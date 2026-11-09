export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  bin_label: string;
  count: number;
  percentage: number;
}

export interface BoxplotMetrics {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lower_whisker: number;
  upper_whisker: number;
  outlier_count: number;
}

export interface UnivariateNumericAnalysis {
  column: string;
  count: number;
  missing_count: number;
  missing_percentage: number;
  mean: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  median: number;
  q25: number;
  q75: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  histogram: HistogramBin[];
  boxplot: BoxplotMetrics;
}

export interface CategoryFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface UnivariateCategoricalAnalysis {
  column: string;
  count: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  cardinality_ratio: number;
  top_value?: string | null;
  top_frequency?: number | null;
  frequencies: CategoryFrequency[];
}

export interface UnivariateResult {
  column: string;
  is_numeric: boolean;
  numeric_analysis?: UnivariateNumericAnalysis | null;
  categorical_analysis?: UnivariateCategoricalAnalysis | null;
}

export interface CorrelationPair {
  feature_a: string;
  feature_b: string;
  correlation: number;
  strength: "Very Strong" | "Strong" | "Moderate" | "Weak";
}

export interface CorrelationMatrixResponse {
  method: string;
  columns: string[];
  matrix: Record<string, Record<string, number | null>>;
  strong_correlations: CorrelationPair[];
}

export interface ScatterPoint {
  x: number;
  y: number;
}

export interface CategoricalGroupStat {
  category: string;
  count: number;
  mean?: number | null;
  median?: number | null;
  std?: number | null;
  min?: number | null;
  max?: number | null;
}

export interface BivariateAnalysisRequest {
  dataset_id: string;
  x_column: string;
  y_column: string;
}

export interface BivariateAnalysisResponse {
  x_column: string;
  y_column: string;
  relationship_type: "numeric_vs_numeric" | "categorical_vs_numeric" | "categorical_vs_categorical";
  correlation?: number | null;
  covariance?: number | null;
  sample_points: ScatterPoint[];
  group_stats: CategoricalGroupStat[];
  contingency_matrix?: Record<string, Record<string, number>> | null;
  summary: string;
}

export interface GroupByRequest {
  dataset_id: string;
  group_by_columns: string[];
  agg_column: string;
  agg_functions: string[];
}

export interface GroupByResponse {
  group_by_columns: string[];
  agg_column: string;
  metrics: string[];
  columns: string[];
  rows: Record<string, unknown>[];
  total_groups: number;
}

export interface PivotTableRequest {
  dataset_id: string;
  index_column: string;
  columns_column: string;
  values_column: string;
  agg_func: string;
  fill_value?: number;
}

export interface PivotTableResponse {
  index_column: string;
  columns_column: string;
  values_column: string;
  agg_func: string;
  columns: string[];
  rows: Record<string, unknown>[];
  shape: number[];
}

export interface ColumnSummary {
  name: string;
  dtype: string;
  is_numeric: boolean;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
}

export interface EDAOverview {
  dataset_id: string;
  total_rows: number;
  total_columns: number;
  numeric_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  total_missing_cells: number;
  missing_percentage: number;
  duplicate_rows: number;
  columns_summary: ColumnSummary[];
}
