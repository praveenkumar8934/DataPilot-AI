from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HistogramBin(BaseModel):
    bin_start: float
    bin_end: float
    bin_label: str
    count: int
    percentage: float

class BoxplotMetrics(BaseModel):
    min: float
    q1: float
    median: float
    q3: float
    max: float
    iqr: float
    lower_whisker: float
    upper_whisker: float
    outlier_count: int

class UnivariateNumericAnalysis(BaseModel):
    column: str
    count: int
    missing_count: int
    missing_percentage: float
    mean: float
    std: float
    variance: float
    min: float
    max: float
    range: float
    median: float
    q25: float
    q75: float
    iqr: float
    skewness: float
    kurtosis: float
    histogram: List[HistogramBin]
    boxplot: BoxplotMetrics

class CategoryFrequency(BaseModel):
    value: str
    count: int
    percentage: float

class UnivariateCategoricalAnalysis(BaseModel):
    column: str
    count: int
    missing_count: int
    missing_percentage: float
    unique_count: int
    cardinality_ratio: float
    top_value: Optional[str] = None
    top_frequency: Optional[int] = None
    frequencies: List[CategoryFrequency]

class UnivariateResult(BaseModel):
    column: str
    is_numeric: bool
    numeric_analysis: Optional[UnivariateNumericAnalysis] = None
    categorical_analysis: Optional[UnivariateCategoricalAnalysis] = None

class CorrelationPair(BaseModel):
    feature_a: str
    feature_b: str
    correlation: float
    strength: str  # "Very Strong", "Strong", "Moderate", "Weak"

class CorrelationMatrixResponse(BaseModel):
    method: str  # "pearson", "spearman", "kendall"
    columns: List[str]
    matrix: Dict[str, Dict[str, Optional[float]]]
    strong_correlations: List[CorrelationPair]

class BivariateAnalysisRequest(BaseModel):
    dataset_id: str
    x_column: str
    y_column: str

class ScatterPoint(BaseModel):
    x: float
    y: float

class CategoricalGroupStat(BaseModel):
    category: str
    count: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None

class BivariateAnalysisResponse(BaseModel):
    x_column: str
    y_column: str
    relationship_type: str  # "numeric_vs_numeric", "categorical_vs_numeric", "categorical_vs_categorical"
    correlation: Optional[float] = None
    covariance: Optional[float] = None
    sample_points: List[ScatterPoint] = Field(default_factory=list)
    group_stats: List[CategoricalGroupStat] = Field(default_factory=list)
    contingency_matrix: Optional[Dict[str, Dict[str, int]]] = None
    summary: str

class GroupByRequest(BaseModel):
    dataset_id: str
    group_by_columns: List[str]
    agg_column: str
    agg_functions: List[str] = Field(default_factory=lambda: ["mean", "sum", "count"])

class GroupByResponse(BaseModel):
    group_by_columns: List[str]
    agg_column: str
    metrics: List[str]
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_groups: int

class PivotTableRequest(BaseModel):
    dataset_id: str
    index_column: str
    columns_column: str
    values_column: str
    agg_func: str = "mean"  # "mean", "sum", "count", "min", "max"
    fill_value: Optional[float] = 0.0

class PivotTableResponse(BaseModel):
    index_column: str
    columns_column: str
    values_column: str
    agg_func: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    shape: List[int]

class ColumnSummary(BaseModel):
    name: str
    dtype: str
    is_numeric: bool
    missing_count: int
    missing_percentage: float
    unique_count: int

class EDAOverview(BaseModel):
    dataset_id: str
    total_rows: int
    total_columns: int
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    total_missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    columns_summary: List[ColumnSummary] = Field(default_factory=list)
