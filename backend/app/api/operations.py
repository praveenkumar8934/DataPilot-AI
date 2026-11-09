from typing import List
from fastapi import APIRouter, HTTPException, status

from app.schemas.operations import OperationCategory, OperationRequest, OperationResult
from app.services.dataset_store import dataset_store
from app.services.operation_engine import operation_engine

router = APIRouter(prefix="/operations", tags=["Pandas Operations (Phase 2)"])

@router.get("/catalog", response_model=List[OperationCategory])
def get_operations_catalog():
    """Retrieve the full catalog of available Pandas operations, categories, and parameters."""
    return operation_engine.get_catalog()

@router.post("/execute", response_model=OperationResult)
def execute_operation(request: OperationRequest):
    """
    Execute a Pandas operation dynamically against the specified or active dataset.
    Supported categories: basic, columns, statistics, missing, duplicates, unique.
    """
    # Fetch dataframe from storage or cache
    df = dataset_store.get_dataframe(request.dataset_id)

    # Execute operation
    result = operation_engine.execute(
        df=df,
        category=request.category,
        operation=request.operation,
        params=request.params,
    )

    if not result.success and result.error:
        # We still return the OperationResult with success=False so frontend can display the error nicely
        return result

    return result
