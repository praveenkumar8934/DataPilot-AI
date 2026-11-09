import uuid
import math
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, status
import pandas as pd

from app.config import settings
from app.core.exceptions import InvalidFileError, FileSizeLimitExceededError, DatasetNotFoundError
from app.schemas.dataset import (
    DatasetMetadata,
    DatasetSummary,
    DatasetPreviewResponse,
    PaginatedRowsResponse,
    DatasetUploadResponse,
    GenericMessageResponse,
)
from app.services.data_loader import DataLoader
from app.services.dataset_store import dataset_store
from app.utils.helpers import df_to_json_records

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload and parse a dataset file (.csv, .xlsx, .xls, .json).
    Validates file format and size, extracts metadata, saves to disk,
    and returns metadata along with the initial preview.
    """
    if not file.filename:
        raise InvalidFileError("No file uploaded or filename is missing.")

    # Validate extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise InvalidFileError(
            f"File format '{file_ext}' is not supported. Please upload one of: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )

    # Read bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file content: {str(e)}",
        )

    # Validate size
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise FileSizeLimitExceededError(len(file_bytes), settings.MAX_UPLOAD_SIZE_BYTES)

    if len(file_bytes) == 0:
        raise InvalidFileError(f"Uploaded file '{file.filename}' is empty (0 bytes).")

    # Generate dataset ID
    dataset_id = str(uuid.uuid4())

    # Parse dataframe
    df = DataLoader.load_from_bytes(file_bytes, file.filename)

    # Persist dataset and get metadata
    metadata = dataset_store.save_dataset(
        dataset_id=dataset_id,
        filename=file.filename,
        original_name=file.filename,
        df=df,
        raw_bytes=file_bytes,
    )

    # Initial preview (first 50 rows)
    preview_df = df.head(50)
    rows_data = df_to_json_records(preview_df)
    total_pages = max(1, math.ceil(len(df) / 50)) if len(df) > 0 else 1

    preview = DatasetPreviewResponse(
        id=dataset_id,
        metadata=metadata,
        columns=[str(c) for c in df.columns],
        rows=rows_data,
        total_rows=len(df),
        page=1,
        page_size=50,
        total_pages=total_pages,
    )

    return DatasetUploadResponse(
        success=True,
        message=f"Dataset '{file.filename}' uploaded and parsed successfully ({metadata.row_count:,} rows, {metadata.column_count} columns).",
        dataset=metadata,
        preview=preview,
    )

@router.get("", response_model=List[DatasetSummary])
def list_datasets():
    """List all available uploaded datasets ordered by creation time descending."""
    return dataset_store.list_datasets()

@router.get("/active", response_model=Optional[DatasetMetadata])
def get_active_dataset():
    """Get the currently active dataset metadata."""
    active = dataset_store.get_active_dataset()
    return active

@router.post("/{dataset_id}/activate", response_model=DatasetMetadata)
def activate_dataset(dataset_id: str):
    """Set a specific dataset as the active dataset."""
    return dataset_store.activate_dataset(dataset_id)

@router.get("/{dataset_id}", response_model=DatasetMetadata)
def get_dataset(dataset_id: str):
    """Retrieve detailed metadata for a specific dataset."""
    return dataset_store.get_metadata(dataset_id)

@router.get("/{dataset_id}/preview", response_model=PaginatedRowsResponse)
def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(50, ge=1, le=500, description="Number of rows per page"),
    sort_by: Optional[str] = Query(None, description="Column name to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order: asc or desc"),
    search: Optional[str] = Query(None, description="Optional search term to filter records"),
):
    """
    Get paginated rows with optional column sorting and search filtering.
    """
    df = dataset_store.get_dataframe(dataset_id)
    total_rows = len(df)

    working_df = df

    # Search filter across string-convertible columns
    if search and search.strip():
        term = search.strip().lower()
        # Find rows where any column string-representation contains term
        mask = pd.Series(False, index=working_df.index)
        for col in working_df.columns:
            mask = mask | working_df[col].astype(str).str.lower().str.contains(term, regex=False, na=False)
        working_df = working_df[mask]
        total_rows = len(working_df)

    # Sorting
    if sort_by and sort_by in working_df.columns:
        ascending = (sort_order.lower() == "asc")
        try:
            working_df = working_df.sort_values(by=sort_by, ascending=ascending)
        except Exception:
            pass

    # Pagination slice
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_df = working_df.iloc[start_idx:end_idx]

    rows_data = df_to_json_records(page_df)
    total_pages = max(1, math.ceil(total_rows / page_size)) if total_rows > 0 else 1

    return PaginatedRowsResponse(
        id=dataset_id,
        columns=[str(c) for c in df.columns],
        rows=rows_data,
        total_rows=total_rows,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

@router.delete("/{dataset_id}", response_model=GenericMessageResponse)
def delete_dataset(dataset_id: str):
    """Delete a dataset and its stored files."""
    dataset_store.delete_dataset(dataset_id)
    return GenericMessageResponse(
        success=True,
        message=f"Dataset '{dataset_id}' deleted successfully.",
    )
