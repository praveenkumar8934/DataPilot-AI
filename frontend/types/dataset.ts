export interface ColumnInfo {
  name: string;
  data_type: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  sample_values: any[];
}

export interface DatasetMetadata {
  id: string;
  filename: string;
  original_name: string;
  file_format: string;
  file_size_bytes: number;
  file_size_formatted: string;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  missing_values_count: number;
  missing_percentage: number;
  duplicate_rows_count: number;
  memory_usage_bytes: number;
  memory_usage_formatted: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DatasetSummary {
  id: string;
  filename: string;
  original_name: string;
  file_format: string;
  file_size_formatted: string;
  row_count: number;
  column_count: number;
  missing_values_count: number;
  duplicate_rows_count: number;
  created_at: string;
  is_active: boolean;
}

export interface PaginatedRowsResponse {
  id: string;
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DatasetUploadResponse {
  success: boolean;
  message: string;
  dataset: DatasetMetadata;
  preview: {
    id: string;
    metadata: DatasetMetadata;
    columns: string[];
    rows: Record<string, any>[];
    total_rows: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

