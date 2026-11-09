from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.analytics import (
    BivariateAnalysisRequest,
    BivariateAnalysisResponse,
    CorrelationMatrixResponse,
    EDAOverview,
    GroupByRequest,
    GroupByResponse,
    PivotTableRequest,
    PivotTableResponse,
    UnivariateResult,
)
from app.services.dataset_store import dataset_store
from app.services.eda_engine import eda_engine

router = APIRouter(prefix="/analytics", tags=["Exploratory Data Analysis (Phase 4)"])


@router.get("/{dataset_id}/overview", response_model=EDAOverview)
def get_dataset_overview(dataset_id: str):
    """Retrieve statistical overview, dtype classification, missingness, and column summaries."""
    df = dataset_store.get_dataframe(dataset_id)
    return eda_engine.get_overview(df, dataset_id)


@router.get("/{dataset_id}/univariate", response_model=UnivariateResult)
def get_univariate_analysis(
    dataset_id: str,
    column: str = Query(..., description="Target column to analyze"),
):
    """Compute univariate distribution, skewness/kurtosis/quantiles/histogram for numeric, or frequencies for categorical."""
    df = dataset_store.get_dataframe(dataset_id)
    try:
        return eda_engine.get_univariate(df, column)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{dataset_id}/correlation", response_model=CorrelationMatrixResponse)
def get_correlation_matrix(
    dataset_id: str,
    method: str = Query("pearson", description="Correlation method: pearson, spearman, kendall"),
):
    """Compute correlation matrix across all numeric features and list strongest correlation pairs."""
    df = dataset_store.get_dataframe(dataset_id)
    return eda_engine.get_correlation_matrix(df, method=method)


@router.post("/bivariate", response_model=BivariateAnalysisResponse)
def get_bivariate_analysis(request: BivariateAnalysisRequest):
    """Compute bivariate analysis (scatter/correlation for numeric-numeric, grouped stats for cat-num, or crosstab for cat-cat)."""
    df = dataset_store.get_dataframe(request.dataset_id)
    try:
        return eda_engine.get_bivariate(df, request.x_column, request.y_column)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/groupby", response_model=GroupByResponse)
def get_groupby_analysis(request: GroupByRequest):
    """Compute multi-column GroupBy with configurable aggregation functions."""
    df = dataset_store.get_dataframe(request.dataset_id)
    try:
        return eda_engine.get_groupby(df, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/pivot", response_model=PivotTableResponse)
def get_pivot_analysis(request: PivotTableRequest):
    """Compute dynamic pivot table with configurable index, columns, values, and aggregation function."""
    df = dataset_store.get_dataframe(request.dataset_id)
    try:
        return eda_engine.get_pivot_table(df, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
