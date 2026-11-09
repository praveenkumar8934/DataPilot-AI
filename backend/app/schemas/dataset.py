from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ColumnInfo(BaseModel):
    name: str
    data_type: str
    missing_count: int = 0
    missing_percentage: float = 0.0
    unique_count: int = 0
    sample_values: List[Any] = Field(default_factory=list)

class DatasetMetadata(BaseModel):
    id: str
    filename: str
    original_name: str
    file_format: str
    file_size_bytes: int
    file_size_formatted: str
    row_count: int
    column_count: int
    columns: List[ColumnInfo]
    missing_values_count: int
    missing_percentage: float
    duplicate_rows_count: int
    memory_usage_bytes: int
    memory_usage_formatted: str
    created_at: str
    updated_at: str
    is_active: bool = False

class DatasetSummary(BaseModel):
    id: str
    filename: str
    original_name: str
    file_format: str
    file_size_formatted: str
    row_count: int
    column_count: int
    missing_values_count: int
    duplicate_rows_count: int
    created_at: str
    is_active: bool = False

class DatasetPreviewResponse(BaseModel):
    id: str
    metadata: DatasetMetadata
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    page: int = 1
    page_size: int = 50
    total_pages: int = 1

class PaginatedRowsResponse(BaseModel):
    id: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    page: int
    page_size: int
    total_pages: int

class DatasetUploadResponse(BaseModel):
    success: bool
    message: str
    dataset: DatasetMetadata
    preview: DatasetPreviewResponse

class GenericMessageResponse(BaseModel):
    success: bool
    message: str

