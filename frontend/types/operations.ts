export interface OperationParamDefinition {
  name: string;
  label: string;
  type: "int" | "float" | "str" | "column" | "columns" | "boolean" | "select" | "dict";
  required: boolean;
  default?: any;
  options?: string[];
  description?: string;
}

export interface OperationDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  returns_type: "table" | "scalar" | "series" | "dict" | "info" | "text";
  params: OperationParamDefinition[];
}

export interface OperationCategory {
  id: string;
  name: string;
  description: string;
  operations: OperationDefinition[];
}

export interface OperationRequest {
  dataset_id: string;
  category: string;
  operation: string;
  params: Record<string, any>;
}

export interface OperationResult {
  success: boolean;
  operation: string;
  category: string;
  result_type: "table" | "scalar" | "series" | "dict" | "info" | "text";
  summary: string;
  columns?: string[];
  rows?: Record<string, any>[];
  data?: any;
  shape?: number[];
  execution_time_ms: number;
  error?: string;
}

