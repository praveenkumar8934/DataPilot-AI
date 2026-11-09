from typing import List
from fastapi import APIRouter, HTTPException, status

from app.schemas.database import (
    ConnectionTestResponse,
    DatabaseConnectionConfig,
    DatabaseConnectionSummary,
    DatabaseSchemaResponse,
    ImportTableAsDatasetRequest,
    SQLQueryRequest,
    SQLQueryResponse,
    TablePreviewRequest,
    TablePreviewResponse,
)
from app.schemas.dataset import DatasetMetadata
from app.services.database_engine import database_engine

router = APIRouter(prefix="/database", tags=["Database Connector & SQL (Phase 6)"])


@router.get("/status")
def get_database_status():
    """Health and status of database connectivity module."""
    return {
        "module": "Database Connector & SQL Workspace",
        "phase": 6,
        "status": "Active",
        "supported_engines": ["sqlite", "postgresql", "mysql"],
        "read_only_enforced": True,
    }


@router.post("/test", response_model=ConnectionTestResponse)
def test_database_connection(config: DatabaseConnectionConfig):
    """Test connection credentials against SQLite, PostgreSQL, or MySQL."""
    return database_engine.test_connection(config)


@router.post("/connections", response_model=DatabaseConnectionSummary)
def save_database_connection(config: DatabaseConnectionConfig):
    """Save a database connection configuration with encrypted credentials."""
    return database_engine.save_connection(config)


@router.get("/connections", response_model=List[DatabaseConnectionSummary])
def list_saved_connections():
    """List all saved database connection descriptors."""
    return database_engine.list_connections()


@router.delete("/connections/{connection_id}")
def delete_database_connection(connection_id: str):
    """Remove a saved connection."""
    success = database_engine.delete_connection(connection_id)
    return {"success": success, "message": "Connection removed."}


@router.get("/connections/{connection_id}/schema", response_model=DatabaseSchemaResponse)
def get_database_schema(connection_id: str):
    """Introspect tables, columns, and row counts."""
    try:
        return database_engine.get_schema(connection_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Schema introspection error: {e}")


@router.post("/preview", response_model=TablePreviewResponse)
def preview_database_table(request: TablePreviewRequest):
    """Fetch paginated table records for preview."""
    try:
        return database_engine.preview_table(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Table preview failed: {e}")


@router.post("/query", response_model=SQLQueryResponse)
def execute_sql_query(request: SQLQueryRequest):
    """
    Execute a parameterized read-only SQL query (SELECT / WITH / SHOW / DESCRIBE / EXPLAIN).
    Non-SELECT operations, multiple statements, and mutating DDL/DML are strictly blocked.
    """
    try:
        return database_engine.execute_query(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Query execution error: {e}")


@router.post("/import-table", response_model=DatasetMetadata)
def import_table_into_workspace(request: ImportTableAsDatasetRequest):
    """Import a database table or view directly into DataPilot AI active workspace as a dataset."""
    try:
        return database_engine.import_table_as_dataset(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Import table failed: {e}")
