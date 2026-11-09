from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

class OperationParamDefinition(BaseModel):
    name: str
    label: str
    type: str  # "int", "float", "str", "column", "columns", "boolean", "select", "dict"
    required: bool = False
    default: Optional[Any] = None
    options: Optional[List[str]] = None
    description: Optional[str] = None

class OperationDefinition(BaseModel):
    id: str
    name: str
    category: str
    description: str
    returns_type: str  # "table", "scalar", "series", "dict", "info"
    params: List[OperationParamDefinition] = Field(default_factory=list)

class OperationCategory(BaseModel):
    id: str
    name: str
    description: str
    operations: List[OperationDefinition]

class OperationRequest(BaseModel):
    dataset_id: str
    category: str
    operation: str
    params: Dict[str, Any] = Field(default_factory=dict)

class OperationResult(BaseModel):
    success: bool
    operation: str
    category: str
    result_type: str  # "table", "scalar", "series", "dict", "info", "text"
    summary: str
    columns: Optional[List[str]] = None
    rows: Optional[List[Dict[str, Any]]] = None
    data: Optional[Any] = None
    shape: Optional[List[int]] = None
    execution_time_ms: float
    error: Optional[str] = None

