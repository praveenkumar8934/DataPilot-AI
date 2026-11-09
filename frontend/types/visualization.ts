export interface ChartFilter {
  column: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "contains"
    | "is_null"
    | "not_null";
  value?: any;
}

export interface ChartRequest {
  dataset_id: string;
  chart_type: string;
  x_column?: string;
  y_column?: string;
  group_by_column?: string;
  agg_func?: string;
  title?: string;
  x_label?: string;
  y_label?: string;
  color_theme?: string;
  bins?: number;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  filters?: ChartFilter[];
}

export interface ChartDataResponse {
  chart_type: string;
  title: string;
  x_column?: string;
  y_column?: string;
  x_label: string;
  y_label: string;
  data: Record<string, any>[];
  series_keys: string[];
  category_key: string;
  color_theme: string;
  summary?: string;
  stats?: Record<string, any>;
  total_records_processed: number;
  total_records_plotted: number;
}

export interface ChartTypeInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  requires_x: boolean;
  requires_y: boolean;
  supports_aggregation: boolean;
  x_types: string[];
  y_types: string[];
}

