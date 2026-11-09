export interface CleaningStepInfo {
  step_id: string;
  operation: string;
  description: string;
  timestamp: string;
  rows_count: number;
  columns_count: number;
  missing_count: number;
}

export interface CleaningSessionState {
  dataset_id: string;
  original_name: string;
  is_dirty: boolean;
  can_undo: boolean;
  history: CleaningStepInfo[];
  total_rows: number;
  total_columns: number;
  missing_count: number;
  missing_percentage: number;
}

export interface CleaningActionRequest {
  dataset_id: string;
  operation: string;
  params: Record<string, any>;
  is_preview?: boolean;
}

export interface CleaningPreviewResponse {
  operation: string;
  description: string;
  rows_before: number;
  rows_after: number;
  rows_affected: number;
  columns_affected: string[];
  preview_rows: Record<string, any>[];
  columns: string[];
  metrics_before: Record<string, any>;
  metrics_after: Record<string, any>;
}

export interface CleaningApplyResponse {
  success: boolean;
  message: string;
  step: CleaningStepInfo;
  can_undo: boolean;
  total_history_steps: number;
  session_state: CleaningSessionState;
}

export interface OutlierDetectionResult {
  column: string;
  method: string;
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
  min_value?: number;
  max_value?: number;
  sample_outliers: any[];
}

export interface MissingValueColumnSummary {
  column: string;
  missing_count: number;
  missing_percentage: number;
  dtype: string;
}

export interface MissingValueDetectionSummary {
  total_missing_cells: number;
  total_cells: number;
  missing_percentage: number;
  columns_with_missing: MissingValueColumnSummary[];
}
