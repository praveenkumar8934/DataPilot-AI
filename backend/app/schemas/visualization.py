from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ChartFilter(BaseModel):
    column: str
    operator: str  # "equals", "not_equals", "greater_than", "greater_than_or_equal", "less_than", "less_than_or_equal", "contains", "is_null", "not_null"
    value: Optional[Any] = None

class ChartRequest(BaseModel):
    dataset_id: str
    chart_type: str = Field(
        ...,
        description="Type of chart: bar, line, pie, donut, histogram, scatter, box, area, heatmap, correlation_matrix",
    )
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    group_by_column: Optional[str] = None
    agg_func: Optional[str] = "sum"  # "sum", "mean", "count", "min", "max", "none"
    title: Optional[str] = None
    x_label: Optional[str] = None
    y_label: Optional[str] = None
    color_theme: Optional[str] = "indigo"  # "indigo", "emerald", "amber", "rose", "violet", "cyan"
    bins: Optional[int] = 10
    sort_by: Optional[str] = "x"  # "x", "y", "none"
    sort_order: Optional[str] = "asc"  # "asc", "desc"
    limit: Optional[int] = 50
    filters: List[ChartFilter] = Field(default_factory=list)

class ChartDataResponse(BaseModel):
    chart_type: str
    title: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    x_label: str
    y_label: str
    data: List[Dict[str, Any]]
    series_keys: List[str]
    category_key: str
    color_theme: str
    summary: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None
    total_records_processed: int
    total_records_plotted: int

class ChartTypeInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    requires_x: bool
    requires_y: bool
    supports_aggregation: bool
    x_types: List[str]  # e.g. ["numeric", "categorical", "datetime"]
    y_types: List[str]

