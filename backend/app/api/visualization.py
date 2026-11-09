from typing import List
from fastapi import APIRouter, HTTPException, status

from app.schemas.visualization import (
    ChartDataResponse,
    ChartRequest,
    ChartTypeInfo,
)
from app.services.dataset_store import dataset_store
from app.services.visualization_engine import visualization_engine

router = APIRouter(prefix="/visualization", tags=["Visualization Studio (Phase 5)"])


@router.get("/types", response_model=List[ChartTypeInfo])
def get_supported_chart_types():
    """Retrieve catalog of all 10 supported chart types and their dimensional specifications."""
    return visualization_engine.get_supported_chart_types()


@router.post("/render", response_model=ChartDataResponse)
def render_chart(request: ChartRequest):
    """
    Process, filter, aggregate, and structure dataset into chart points ready for frontend rendering.
    Supports Bar, Line, Pie, Donut, Histogram, Scatter, Box, Area, Heatmap, and Correlation Matrix.
    """
    df = dataset_store.get_dataframe(request.dataset_id)
    try:
        return visualization_engine.prepare_chart(df, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
