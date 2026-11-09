from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class CleaningStepInfo(BaseModel):
    step_id: str
    operation: str
    description: str
    timestamp: str
    rows_count: int
    columns_count: int
    missing_count: int

class CleaningSessionState(BaseModel):
    dataset_id: str
    original_name: str
    is_dirty: bool = False
    can_undo: bool = False
    history: List[CleaningStepInfo] = Field(default_factory=list)
    total_rows: int
    total_columns: int
    missing_count: int
    missing_percentage: float

class CleaningActionRequest(BaseModel):
    dataset_id: str
    operation: str  # e.g., "drop_missing", "fill_missing", "remove_duplicates", "rename_column", "change_dtype", "standardize_text", "handle_outliers"
    params: Dict[str, Any] = Field(default_factory=dict)
    is_preview: bool = False

class CleaningPreviewResponse(BaseModel):
    operation: str
    description: str
    rows_before: int
    rows_after: int
    rows_affected: int
    columns_affected: List[str]
    preview_rows: List[Dict[str, Any]]
    columns: List[str]
    metrics_before: Dict[str, Any]
    metrics_after: Dict[str, Any]

class CleaningApplyResponse(BaseModel):
    success: bool
    message: str
    step: CleaningStepInfo
    can_undo: bool
    total_history_steps: int
    session_state: CleaningSessionState

class OutlierDetectionResult(BaseModel):
    column: str
    method: str  # "IQR" or "Z-score"
    outlier_count: int
    outlier_percentage: float
    lower_bound: float
    upper_bound: float
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    sample_outliers: List[Any] = Field(default_factory=list)

class MissingValueDetectionSummary(BaseModel):
    total_missing_cells: int
    total_cells: int
    missing_percentage: float
    columns_with_missing: List[Dict[str, Any]]

class SaveCleanedDatasetRequest(BaseModel):
    dataset_id: str
    version_name: Optional[str] = None

