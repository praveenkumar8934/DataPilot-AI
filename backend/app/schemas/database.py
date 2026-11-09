from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class DatabaseConnectionConfig(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., description="Human-friendly label for connection")
    db_type: str = Field(..., description="Database type: sqlite, postgresql, mysql")
    database: str = Field(..., description="Database name or SQLite file path")
    host: Optional[str] = Field("localhost", description="Server host")
    port: Optional[int] = Field(None, description="Server port (5432 for Postgres, 3306 for MySQL)")
    username: Optional[str] = Field(None, description="Username")
    password: Optional[str] = Field(None, description="Password (will not be returned to frontend)")
    is_readonly: bool = Field(True, description="Enforce read-only execution")

class DatabaseConnectionSummary(BaseModel):
    id: str
    name: str
    db_type: str
    database: str
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    is_readonly: bool = True
    created_at: str

class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    server_version: Optional[str] = None
    latency_ms: Optional[float] = None

class TableColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool = True
    primary_key: bool = False

class TableSummary(BaseModel):
    table_name: str
    columns: List[TableColumnInfo]
    estimated_row_count: Optional[int] = None

class DatabaseSchemaResponse(BaseModel):
    connection_id: str
    database_name: str
    tables: List[TableSummary]

class TablePreviewRequest(BaseModel):
    connection_id: str
    table_name: str
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class TablePreviewResponse(BaseModel):
    table_name: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    limit: int
    offset: int

class SQLQueryRequest(BaseModel):
    connection_id: str
    query: str
    params: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 200

class SQLQueryResponse(BaseModel):
    query: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float
    is_truncated: bool = False

class ImportTableAsDatasetRequest(BaseModel):
    connection_id: str
    table_name: str
    dataset_name: Optional[str] = None
    limit: Optional[int] = None

