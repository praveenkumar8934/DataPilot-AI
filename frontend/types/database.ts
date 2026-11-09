export interface DatabaseConnectionConfig {
  id?: string;
  name: string;
  db_type: "sqlite" | "postgresql" | "mysql";
  database: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  is_readonly?: boolean;
}

export interface DatabaseConnectionSummary {
  id: string;
  name: string;
  db_type: "sqlite" | "postgresql" | "mysql" | string;
  database: string;
  host?: string;
  port?: number;
  username?: string;
  is_readonly: boolean;
  created_at: string;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  server_version?: string;
  latency_ms?: number;
}

export interface TableColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface TableSummary {
  table_name: string;
  columns: TableColumnInfo[];
  estimated_row_count?: number;
}

export interface DatabaseSchemaResponse {
  connection_id: string;
  database_name: string;
  tables: TableSummary[];
}

export interface TablePreviewRequest {
  connection_id: string;
  table_name: string;
  limit?: number;
  offset?: number;
}

export interface TablePreviewResponse {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  limit: number;
  offset: number;
}

export interface SQLQueryRequest {
  connection_id: string;
  query: string;
  params?: Record<string, any>;
  limit?: number;
}

export interface SQLQueryResponse {
  query: string;
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  execution_time_ms: number;
  is_truncated: boolean;
}

export interface ImportTableAsDatasetRequest {
  connection_id: string;
  table_name: string;
  dataset_name?: string;
  limit?: number;
}
