"""Helper utilities for formatting and data handling."""
import math
from typing import Any, Dict, List
import numpy as np
import pandas as pd

def format_bytes(size_bytes: int) -> str:
    """Format bytes into human readable KB, MB, GB."""
    if size_bytes < 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(size_bytes)
    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1
    return f"{size:.2f} {units[unit_index]}"

def sanitize_value(val: Any) -> Any:
    """Clean individual cell values so they serialize to valid JSON without NaN or Inf crashes."""
    if pd.isna(val):
        return None
    if isinstance(val, (float, np.floating)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    return val

def df_to_json_records(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert a Pandas DataFrame into JSON-safe dictionaries."""
    records = []
    # Replace NaN/inf with None for the entire dataframe representation
    cleaned_df = df.replace([np.inf, -np.inf], np.nan)
    for row in cleaned_df.itertuples(index=False, name=None):
        row_dict = {}
        for col_name, val in zip(df.columns, row):
            row_dict[str(col_name)] = sanitize_value(val)
        records.append(row_dict)
    return records

