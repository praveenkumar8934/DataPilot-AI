export interface CSVExportOptions {
  delimiter: string;
  include_header: boolean;
  include_index: boolean;
  encoding: string;
}

export interface ExcelExportOptions {
  sheet_name: string;
  include_metadata: boolean;
  include_stats: boolean;
  include_dictionary: boolean;
}

export interface JSONExportOptions {
  orient: "records" | "split" | "index" | "columns" | string;
  indent: number;
}

export interface ReportConfig {
  title?: string;
  author?: string;
  include_summary_stats?: boolean;
  include_quality_audit?: boolean;
  include_cleaning_history?: boolean;
}

export interface ColumnAudit {
  name: string;
  data_type: string;
  total_count: number;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_percentage: number;
  is_constant: boolean;
  is_all_null: boolean;
  quality_status: "good" | "warning" | "critical";
  sample_values: any[];
}

export interface ReportSummaryResponse {
  dataset_id: string;
  dataset_name: string;
  created_at: string;
  total_rows: number;
  total_columns: number;
  memory_bytes: number;
  health_score: number;
  quality_rating: "Excellent" | "Good" | "Fair" | "Needs Attention" | string;
  completeness_score: number;
  uniqueness_score: number;
  consistency_score: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  missing_cells: number;
  missing_cells_percentage: number;
  columns_audit: ColumnAudit[];
  cleaning_history: {
    action_type: string;
    description: string;
    timestamp: string;
  }[];
  recommendations: string[];
}

