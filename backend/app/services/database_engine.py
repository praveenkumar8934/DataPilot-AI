"""Database Engine: Manages enterprise database connections (SQLite, PostgreSQL, MySQL),
introspects schemas and tables, executes parameterized read-only SQL queries,
and exports or imports tables directly as DataPilot AI datasets.
"""
import base64
import json
import os
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional
import uuid

import numpy as np
import pandas as pd

from app.config import settings
from app.schemas.database import (
    ConnectionTestResponse,
    DatabaseConnectionConfig,
    DatabaseConnectionSummary,
    DatabaseSchemaResponse,
    SQLQueryRequest,
    SQLQueryResponse,
    TableColumnInfo,
    TablePreviewRequest,
    TablePreviewResponse,
    TableSummary,
)
from app.schemas.dataset import DatasetMetadata
from app.services.dataset_store import dataset_store
from app.utils.helpers import df_to_json_records, sanitize_value


class DatabaseEngine:
    def __init__(self):
        self._connections: Dict[str, DatabaseConnectionConfig] = {}
        self._engines: Dict[str, Any] = {}
        self.connections_dir = Path("backend/storage/connections")
        self.connections_dir.mkdir(parents=True, exist_ok=True)
        self._load_saved_connections()

    def _obfuscate(self, secret: Optional[str]) -> str:
        """Obfuscate credentials before saving to disk to prevent plain-text leak."""
        if not secret:
            return ""
        return base64.b64encode(secret.encode("utf-8")).decode("utf-8")

    def _deobfuscate(self, secret_b64: Optional[str]) -> str:
        """De-obfuscate stored credentials."""
        if not secret_b64:
            return ""
        try:
            return base64.b64decode(secret_b64.encode("utf-8")).decode("utf-8")
        except Exception:
            return ""

    def _load_saved_connections(self):
        """Load stored connection descriptors on startup."""
        for f in self.connections_dir.glob("*.json"):
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    raw_pass = self._deobfuscate(data.get("password_encrypted"))
                    data["password"] = raw_pass
                    cfg = DatabaseConnectionConfig(**data)
                    if cfg.id:
                        self._connections[cfg.id] = cfg
            except Exception as e:
                print(f"[DatabaseEngine] Error loading connection {f}: {e}")

    def _build_url(self, config: DatabaseConnectionConfig) -> str:
        """Construct secure SQLAlchemy connection URL."""
        db_type = config.db_type.lower()
        if db_type == "sqlite":
            db_path = config.database
            if db_path != ":memory:" and not os.path.isabs(db_path):
                db_path = str(Path(db_path).resolve())
            return f"sqlite:///{db_path}"
        elif db_type == "postgresql":
            port = config.port or 5432
            auth = f"{config.username}:{config.password}@" if config.username else ""
            return f"postgresql://{auth}{config.host}:{port}/{config.database}"
        elif db_type == "mysql":
            port = config.port or 3306
            auth = f"{config.username}:{config.password}@" if config.username else ""
            return f"mysql+pymysql://{auth}{config.host}:{port}/{config.database}"
        else:
            raise ValueError(f"Unsupported database type: '{config.db_type}'")

    def _get_or_create_engine(self, config: DatabaseConnectionConfig):
        """Get or initialize SQLAlchemy engine."""
        import sqlalchemy as sa
        url = self._build_url(config)
        conn_id = config.id or url
        if conn_id not in self._engines:
            # Use connection pooling & pre-ping
            engine = sa.create_engine(
                url,
                pool_pre_ping=True,
                echo=False,
            )
            self._engines[conn_id] = engine
        return self._engines[conn_id]

    def test_connection(self, config: DatabaseConnectionConfig) -> ConnectionTestResponse:
        """Test database connection, verify connectivity, and measure ping latency."""
        import sqlalchemy as sa
        start = time.perf_counter()
        try:
            url = self._build_url(config)
            engine = sa.create_engine(url, pool_pre_ping=True)
            with engine.connect() as conn:
                # Query version or 1
                if config.db_type.lower() == "sqlite":
                    query = sa.text("SELECT sqlite_version()")
                elif config.db_type.lower() == "postgresql":
                    query = sa.text("SELECT version()")
                else:
                    query = sa.text("SELECT @@version")

                res = conn.execute(query).scalar()
                version = str(res) if res is not None else "Active"

            latency = round((time.perf_counter() - start) * 1000, 2)
            return ConnectionTestResponse(
                success=True,
                message=f"Connected to {config.db_type.upper()} successfully ({latency} ms).",
                server_version=version,
                latency_ms=latency,
            )
        except Exception as e:
            latency = round((time.perf_counter() - start) * 1000, 2)
            # Never expose passwords in errors
            err_msg = str(e)
            if config.password:
                err_msg = err_msg.replace(config.password, "******")
            return ConnectionTestResponse(
                success=False,
                message=f"Connection failed: {err_msg}",
                latency_ms=latency,
            )

    def save_connection(self, config: DatabaseConnectionConfig) -> DatabaseConnectionSummary:
        """Persist connection descriptor without plain-text credentials."""
        conn_id = config.id or str(uuid.uuid4())
        config.id = conn_id
        self._connections[conn_id] = config

        # Save to disk
        record = config.model_dump()
        raw_password = record.pop("password", None)
        record["password_encrypted"] = self._obfuscate(raw_password)

        file_path = self.connections_dir / f"{conn_id}.json"
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(record, fp, indent=2)

        return DatabaseConnectionSummary(
            id=conn_id,
            name=config.name,
            db_type=config.db_type,
            database=config.database,
            host=config.host,
            port=config.port,
            username=config.username,
            is_readonly=config.is_readonly,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        )

    def list_connections(self) -> List[DatabaseConnectionSummary]:
        """List all saved connections."""
        summaries = []
        for conn_id, cfg in self._connections.items():
            summaries.append(
                DatabaseConnectionSummary(
                    id=conn_id,
                    name=cfg.name,
                    db_type=cfg.db_type,
                    database=cfg.database,
                    host=cfg.host,
                    port=cfg.port,
                    username=cfg.username,
                    is_readonly=cfg.is_readonly,
                    created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                )
            )
        return summaries

    def get_connection(self, connection_id: str) -> DatabaseConnectionConfig:
        """Retrieve connection configuration."""
        if connection_id not in self._connections:
            raise ValueError(f"Database connection '{connection_id}' not found.")
        return self._connections[connection_id]

    def delete_connection(self, connection_id: str) -> bool:
        """Remove a connection."""
        if connection_id in self._connections:
            del self._connections[connection_id]
        if connection_id in self._engines:
            del self._engines[connection_id]
        file_path = self.connections_dir / f"{connection_id}.json"
        if file_path.exists():
            file_path.unlink()
        return True

    def get_schema(self, connection_id: str) -> DatabaseSchemaResponse:
        """Introspect tables, schemas, and columns."""
        import sqlalchemy as sa
        cfg = self.get_connection(connection_id)
        engine = self._get_or_create_engine(cfg)

        inspector = sa.inspect(engine)
        table_names = inspector.get_table_names()

        tables_summary: List[TableSummary] = []
        with engine.connect() as conn:
            for t_name in table_names:
                try:
                    cols = inspector.get_columns(t_name)
                    pk_info = inspector.get_pk_constraint(t_name)
                    pk_cols = pk_info.get("constrained_columns", []) if pk_info else []

                    col_models: List[TableColumnInfo] = []
                    for c in cols:
                        col_models.append(
                            TableColumnInfo(
                                name=c["name"],
                                type=str(c["type"]),
                                nullable=c.get("nullable", True),
                                primary_key=c["name"] in pk_cols,
                            )
                        )

                    # Quick count
                    count_query = sa.text(f'SELECT COUNT(*) FROM "{t_name}"' if cfg.db_type != "mysql" else f"SELECT COUNT(*) FROM `{t_name}`")
                    row_count = conn.execute(count_query).scalar()

                    tables_summary.append(
                        TableSummary(
                            table_name=t_name,
                            columns=col_models,
                            estimated_row_count=row_count if isinstance(row_count, int) else None,
                        )
                    )
                except Exception as e:
                    print(f"Error inspecting table {t_name}: {e}")

        return DatabaseSchemaResponse(
            connection_id=connection_id,
            database_name=cfg.database,
            tables=tables_summary,
        )

    def preview_table(self, req: TablePreviewRequest) -> TablePreviewResponse:
        """Retrieve paginated table rows for preview."""
        import sqlalchemy as sa
        cfg = self.get_connection(req.connection_id)
        engine = self._get_or_create_engine(cfg)

        limit = min(req.limit or 50, 200)
        offset = req.offset or 0
        t_name = req.table_name

        # Quote identifier safely
        quote = '`' if cfg.db_type == "mysql" else '"'
        safe_t = f"{quote}{t_name}{quote}"

        with engine.connect() as conn:
            # Count total
            total_count = conn.execute(sa.text(f"SELECT COUNT(*) FROM {safe_t}")).scalar() or 0

            # Fetch rows
            query = sa.text(f"SELECT * FROM {safe_t} LIMIT :limit OFFSET :offset")
            res = conn.execute(query, {"limit": limit, "offset": offset})
            columns = list(res.keys())

            rows = []
            for row in res.fetchall():
                row_dict = {}
                for col_name, val in zip(columns, row):
                    row_dict[col_name] = sanitize_value(val)
                rows.append(row_dict)

        return TablePreviewResponse(
            table_name=t_name,
            columns=columns,
            rows=rows,
            total_rows=int(total_count),
            limit=limit,
            offset=offset,
        )

    def validate_readonly_query(self, sql: str) -> None:
        """Enforce strict read-only execution."""
        # 1. Clean query
        cleaned = re.sub(r"--.*$", "", sql, flags=re.MULTILINE)
        cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL).strip()

        if not cleaned:
            raise ValueError("SQL query cannot be empty.")

        # 2. Reject multi-statement queries to prevent injection smuggling
        # Remove trailing semicolon
        trimmed = cleaned.rstrip(";").strip()
        if ";" in trimmed:
            raise ValueError("Multiple SQL statements in a single execution are prohibited.")

        # 3. Disallow mutation/DDL/DML tokens
        forbidden_pattern = re.compile(
            r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|GRANT|REVOKE|VACUUM|EXEC|EXECUTE)\b",
            re.IGNORECASE,
        )
        match = forbidden_pattern.search(trimmed)
        if match:
            raise ValueError(
                f"Unauthorized SQL statement '{match.group(0).upper()}'. "
                f"Only read-only SELECT queries are allowed."
            )

        # 4. Must begin with safe read keywords
        allowed_starters = ("SELECT", "WITH", "SHOW", "DESCRIBE", "EXPLAIN", "PRAGMA")
        first_token = trimmed.split()[0].upper()
        if first_token not in allowed_starters:
            raise ValueError(
                f"Query must begin with a read-only keyword (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN, PRAGMA). Found: '{first_token}'"
            )

    def execute_query(self, req: SQLQueryRequest) -> SQLQueryResponse:
        """Execute a validated parameterized read-only SQL query."""
        import sqlalchemy as sa
        self.validate_readonly_query(req.query)

        cfg = self.get_connection(req.connection_id)
        engine = self._get_or_create_engine(cfg)

        start = time.perf_counter()
        limit = min(req.limit or 200, 1000)

        with engine.connect() as conn:
            stmt = sa.text(req.query)
            params = req.params or {}
            res = conn.execute(stmt, params)

            columns = list(res.keys())
            raw_rows = res.fetchmany(limit + 1)
            is_truncated = len(raw_rows) > limit
            rows_to_keep = raw_rows[:limit]

            rows = []
            for row in rows_to_keep:
                row_dict = {}
                for col_name, val in zip(columns, row):
                    row_dict[col_name] = sanitize_value(val)
                rows.append(row_dict)

        latency = round((time.perf_counter() - start) * 1000, 2)

        return SQLQueryResponse(
            query=req.query,
            columns=columns,
            rows=rows,
            row_count=len(rows),
            execution_time_ms=latency,
            is_truncated=is_truncated,
        )

    def import_table_as_dataset(self, req: ImportTableAsDatasetRequest) -> DatasetMetadata:
        """Read an entire database table or query into a DataFrame and register it into DataPilot AI."""
        import sqlalchemy as sa
        cfg = self.get_connection(req.connection_id)
        engine = self._get_or_create_engine(cfg)

        t_name = req.table_name
        quote = '`' if cfg.db_type == "mysql" else '"'
        safe_t = f"{quote}{t_name}{quote}"

        sql = f"SELECT * FROM {safe_t}"
        if req.limit:
            sql += f" LIMIT {int(req.limit)}"

        with engine.connect() as conn:
            df = pd.read_sql_query(sa.text(sql), con=conn)

        dataset_id = str(uuid.uuid4())
        dataset_name = req.dataset_name or f"{t_name} ({cfg.name})"
        filename = f"{t_name}.csv"
        raw_csv_bytes = df.to_csv(index=False).encode("utf-8")

        new_metadata = dataset_store.save_dataset(
            dataset_id=dataset_id,
            filename=filename,
            original_name=dataset_name,
            df=df,
            raw_bytes=raw_csv_bytes,
        )
        dataset_store.set_active_id(dataset_id)
        return new_metadata


database_engine = DatabaseEngine()
