from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class CSVExportOptions(BaseModel):
    delimiter: str = Field(",", description="CSV delimiter: comma, semicolon, tab, pipe")
    include_header: bool = Field(True, description="Include column header names")
    include_index: bool = Field(False, description="Include DataFrame row index")
    encoding: str = Field("utf-8", description="File encoding: utf-8, utf-8-sig, latin1")

class ExcelExportOptions(BaseModel):
    sheet_name: str = Field("Data", description="Main data sheet tab name")
    include_metadata: bool = Field(True, description="Add 'Metadata & Overview' tab")
    include_stats: bool = Field(True, description="Add 'Summary Statistics' tab")
    include_dictionary: bool = Field(True, description="Add 'Data Dictionary' tab")

class JSONExportOptions(BaseModel):
    orient: str = Field("records", description="JSON format orient: records, split, index, columns")
    indent: int = Field(2, description="Indentation spaces: 0, 2, 4")

class ReportConfig(BaseModel):
    title: Optional[str] = Field("DataPilot AI Executive Audit Report", description="Report title")
    author: Optional[str] = Field("DataPilot AI Analyst", description="Analyst / Author name")
    include_summary_stats: bool = Field(True, description="Include numerical summary statistics")
    include_quality_audit: bool = Field(True, description="Include data health audit and column checks")
    include_cleaning_history: bool = Field(True, description="Include operations and cleaning history")

class ColumnAudit(BaseModel):
    name: str
    data_type: str
    total_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    is_constant: bool
    is_all_null: bool
    quality_status: str = Field("good", description="good, warning, or critical")
    sample_values: List[Any] = Field(default_factory=list)

class ReportSummaryResponse(BaseModel):
    dataset_id: str
    dataset_name: str
    created_at: str
    total_rows: int
    total_columns: int
    memory_bytes: int
    health_score: int = Field(..., description="Overall health score from 0 to 100")
    quality_rating: str = Field(..., description="Excellent, Good, Fair, or Needs Attention")
    completeness_score: float
    uniqueness_score: float
    consistency_score: float
    duplicate_rows: int
    duplicate_percentage: float
    missing_cells: int
    missing_cells_percentage: float
    columns_audit: List[ColumnAudit]
    cleaning_history: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

