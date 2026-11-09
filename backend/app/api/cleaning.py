from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status

from app.schemas.cleaning import (
    CleaningActionRequest,
    CleaningPreviewResponse,
    CleaningApplyResponse,
    CleaningSessionState,
    OutlierDetectionResult,
    MissingValueDetectionSummary,
    SaveCleanedDatasetRequest,
)
from app.schemas.dataset import DatasetMetadata
from app.services.cleaning_engine import cleaning_engine

router = APIRouter(prefix="/cleaning", tags=["Data Cleaning Studio (Phase 3)"])

@router.get("/{dataset_id}/session", response_model=CleaningSessionState)
def get_cleaning_session(dataset_id: str):
    """Retrieve current cleaning session state, history, and undo status."""
    return cleaning_engine.get_session_state(dataset_id)

@router.get("/{dataset_id}/detect-missing", response_model=MissingValueDetectionSummary)
def detect_missing_values(dataset_id: str):
    """Detect and quantify missing values across all columns."""
    df = cleaning_engine.get_working_dataframe(dataset_id)
    return cleaning_engine.detect_missing_values(df)

@router.get("/{dataset_id}/detect-outliers", response_model=List[OutlierDetectionResult])
def detect_outliers(
    dataset_id: str,
    method: str = Query("IQR", description="Detection method: IQR or Z-score"),
    threshold: float = Query(1.5, description="Threshold multiplier (1.5 for IQR, 3.0 for Z-score)"),
    column: Optional[str] = Query(None, description="Optional target column"),
):
    """Detect statistical outliers in numeric columns."""
    df = cleaning_engine.get_working_dataframe(dataset_id)
    return cleaning_engine.detect_outliers(df, method=method, threshold=threshold, target_column=column)

@router.post("/preview", response_model=CleaningPreviewResponse)
def preview_cleaning_action(request: CleaningActionRequest):
    """
    Preview a cleaning transformation before committing it.
    Returns rows before, rows after, affected columns, and sample transformed records.
    """
    try:
        return cleaning_engine.preview_cleaning_action(
            dataset_id=request.dataset_id,
            operation=request.operation,
            params=request.params,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/apply", response_model=CleaningApplyResponse)
def apply_cleaning_action(request: CleaningActionRequest):
    """
    Apply a cleaning transformation to the working dataset.
    Pushes previous state to the undo snapshot stack.
    """
    try:
        return cleaning_engine.apply_cleaning_action(
            dataset_id=request.dataset_id,
            operation=request.operation,
            params=request.params,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{dataset_id}/undo", response_model=CleaningSessionState)
def undo_cleaning_action(dataset_id: str):
    """Undo the last cleaning action and restore previous dataset state."""
    try:
        return cleaning_engine.undo_last_action(dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{dataset_id}/reset", response_model=CleaningSessionState)
def reset_cleaning_session(dataset_id: str):
    """Reset the working dataset back to its original uploaded state."""
    return cleaning_engine.reset_session(dataset_id)

@router.post("/save-version", response_model=DatasetMetadata)
def save_cleaned_version(request: SaveCleanedDatasetRequest):
    """
    Save the cleaned dataset as a brand-new dataset version.
    The original dataset is preserved untouched.
    """
    try:
        return cleaning_engine.save_as_new_version(
            dataset_id=request.dataset_id,
            version_name=request.version_name,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
