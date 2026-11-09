"""Pandas Operation Engine: Executes all basic, column, statistical, missing value,
duplicate, and unique operations dynamically against the active dataset.
"""
import io
import time
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.schemas.operations import OperationCategory, OperationDefinition, OperationParamDefinition, OperationResult
from app.utils.helpers import df_to_json_records, sanitize_value

class OperationEngine:
    @staticmethod
    def get_catalog() -> List[OperationCategory]:
        """Return full catalog of supported Pandas operations and their configurable parameters."""
        return [
            OperationCategory(
                id="basic",
                name="Basic Operations",
                description="Core dataset inspection methods and properties",
                operations=[
                    OperationDefinition(
                        id="head",
                        name="head()",
                        category="basic",
                        description="Return the first n rows of the dataset",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="n", label="Number of rows", type="int", required=False, default=5, description="Rows to return"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="tail",
                        name="tail()",
                        category="basic",
                        description="Return the last n rows of the dataset",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="n", label="Number of rows", type="int", required=False, default=5, description="Rows to return"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="sample",
                        name="sample()",
                        category="basic",
                        description="Return a random sample of rows",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="n", label="Sample size", type="int", required=False, default=5, description="Number of items to return"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="shape",
                        name="shape",
                        category="basic",
                        description="Tuple of dimensionality (rows, columns)",
                        returns_type="dict",
                        params=[],
                    ),
                    OperationDefinition(
                        id="columns",
                        name="columns",
                        category="basic",
                        description="The column labels of the dataset",
                        returns_type="series",
                        params=[],
                    ),
                    OperationDefinition(
                        id="index",
                        name="index",
                        category="basic",
                        description="The row index information of the dataset",
                        returns_type="dict",
                        params=[],
                    ),
                    OperationDefinition(
                        id="info",
                        name="info()",
                        category="basic",
                        description="Concise summary of dataset, column types, and memory usage",
                        returns_type="info",
                        params=[],
                    ),
                    OperationDefinition(
                        id="describe",
                        name="describe()",
                        category="basic",
                        description="Descriptive statistics summary for numeric or all columns",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="include",
                                label="Columns to include",
                                type="select",
                                required=False,
                                default="all",
                                options=["all", "numeric"],
                                description="Whether to include all columns or only numeric",
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="dtypes",
                        name="dtypes",
                        category="basic",
                        description="Data types of all columns in the dataset",
                        returns_type="dict",
                        params=[],
                    ),
                    OperationDefinition(
                        id="size",
                        name="size",
                        category="basic",
                        description="Total number of elements in the dataset (rows × columns)",
                        returns_type="scalar",
                        params=[],
                    ),
                    OperationDefinition(
                        id="ndim",
                        name="ndim",
                        category="basic",
                        description="Number of axes / array dimensions (2 for tabular data)",
                        returns_type="scalar",
                        params=[],
                    ),
                ],
            ),
            OperationCategory(
                id="columns",
                name="Column Operations",
                description="Subset, rename, drop, filter, and sort columns & records",
                operations=[
                    OperationDefinition(
                        id="select_columns",
                        name="Select Columns",
                        category="columns",
                        description="Filter dataset to keep only selected columns",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="columns", label="Columns to select", type="columns", required=True, description="Columns to include"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="rename_columns",
                        name="Rename Columns",
                        category="columns",
                        description="Rename one or more columns",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Target Column", type="column", required=True, description="Original column name"
                            ),
                            OperationParamDefinition(
                                name="new_name", label="New Name", type="str", required=True, description="New column name"
                            ),
                        ],
                    ),
                    OperationDefinition(
                        id="drop_columns",
                        name="Drop Columns",
                        category="columns",
                        description="Drop specified columns from dataset view",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="columns", label="Columns to drop", type="columns", required=True, description="Columns to remove"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="select_rows",
                        name="Select Specific Rows",
                        category="columns",
                        description="Slice rows by index range",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="start_idx", label="Start Row Index", type="int", required=False, default=0, description="Start index (0-based)"
                            ),
                            OperationParamDefinition(
                                name="end_idx", label="End Row Index", type="int", required=False, default=10, description="End index (exclusive)"
                            ),
                        ],
                    ),
                    OperationDefinition(
                        id="filter_records",
                        name="Filter Records",
                        category="columns",
                        description="Filter rows matching a logical condition",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column", type="column", required=True, description="Column to filter"
                            ),
                            OperationParamDefinition(
                                name="operator",
                                label="Operator",
                                type="select",
                                required=True,
                                default="==",
                                options=["==", "!=", ">", "<", ">=", "<=", "contains", "startswith", "endswith", "isnull", "notnull"],
                                description="Comparison operator",
                            ),
                            OperationParamDefinition(
                                name="value", label="Value", type="str", required=False, description="Filter comparison value"
                            ),
                        ],
                    ),
                    OperationDefinition(
                        id="sort_values",
                        name="Sort Values",
                        category="columns",
                        description="Sort dataset by a specific column",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Sort Column", type="column", required=True, description="Column to sort on"
                            ),
                            OperationParamDefinition(
                                name="ascending", label="Ascending Order", type="boolean", required=False, default=True, description="Sort order"
                            ),
                        ],
                    ),
                ],
            ),
            OperationCategory(
                id="statistics",
                name="Statistical Operations",
                description="Descriptive statistics and aggregation functions",
                operations=[
                    OperationDefinition(
                        id="mean",
                        name="mean()",
                        category="statistics",
                        description="Calculate arithmetic mean of numeric columns",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="median",
                        name="median()",
                        category="statistics",
                        description="Calculate median (50th percentile) value",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="mode",
                        name="mode()",
                        category="statistics",
                        description="Calculate mode (most frequent value)",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all columns"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="min",
                        name="min()",
                        category="statistics",
                        description="Calculate minimum value",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all columns"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="max",
                        name="max()",
                        category="statistics",
                        description="Calculate maximum value",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all columns"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="sum",
                        name="sum()",
                        category="statistics",
                        description="Calculate sum of values",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="count",
                        name="count()",
                        category="statistics",
                        description="Count non-missing values",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all columns"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="std",
                        name="std()",
                        category="statistics",
                        description="Calculate sample standard deviation",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="var",
                        name="var()",
                        category="statistics",
                        description="Calculate unbiased sample variance",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="quantile",
                        name="quantile()",
                        category="statistics",
                        description="Calculate value at the given quantile",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all numeric"
                            ),
                            OperationParamDefinition(
                                name="q", label="Quantile (0.0 - 1.0)", type="float", required=False, default=0.5, description="Quantile to compute"
                            ),
                        ],
                    ),
                ],
            ),
            OperationCategory(
                id="missing",
                name="Missing Values",
                description="Detect, inspect, and quantify null/NaN entries",
                operations=[
                    OperationDefinition(
                        id="isnull",
                        name="isnull()",
                        category="missing",
                        description="Boolean mask indicating missing values (preview first 50 rows)",
                        returns_type="table",
                        params=[],
                    ),
                    OperationDefinition(
                        id="notnull",
                        name="notnull()",
                        category="missing",
                        description="Boolean mask indicating non-missing values (preview first 50 rows)",
                        returns_type="table",
                        params=[],
                    ),
                    OperationDefinition(
                        id="isna",
                        name="isna()",
                        category="missing",
                        description="Alias of isnull() - detect NA/null values",
                        returns_type="table",
                        params=[],
                    ),
                    OperationDefinition(
                        id="missing_count",
                        name="Missing Value Count",
                        category="missing",
                        description="Total count of missing values per column",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="missing_percentage",
                        name="Missing Value Percentage",
                        category="missing",
                        description="Percentage of missing values per column",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all"
                            )
                        ],
                    ),
                ],
            ),
            OperationCategory(
                id="duplicates",
                name="Duplicate Operations",
                description="Identify and isolate duplicate records",
                operations=[
                    OperationDefinition(
                        id="duplicated",
                        name="duplicated()",
                        category="duplicates",
                        description="Inspect rows that have duplicate values",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="subset", label="Subset Columns (Optional)", type="columns", required=False, description="Columns to check for duplicates"
                            ),
                            OperationParamDefinition(
                                name="keep",
                                label="Keep Strategy",
                                type="select",
                                required=False,
                                default="first",
                                options=["first", "last", "false"],
                                description="Which duplicate occurrences to flag",
                            ),
                        ],
                    ),
                    OperationDefinition(
                        id="drop_duplicates",
                        name="drop_duplicates()",
                        category="duplicates",
                        description="Preview dataset with duplicate rows removed",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="subset", label="Subset Columns (Optional)", type="columns", required=False, description="Columns to identify duplicates"
                            ),
                            OperationParamDefinition(
                                name="keep",
                                label="Keep Strategy",
                                type="select",
                                required=False,
                                default="first",
                                options=["first", "last"],
                                description="Which duplicate occurrence to keep",
                            ),
                        ],
                    ),
                ],
            ),
            OperationCategory(
                id="unique",
                name="Unique Values",
                description="Inspect unique elements and frequency distributions",
                operations=[
                    OperationDefinition(
                        id="unique",
                        name="unique()",
                        category="unique",
                        description="Return unique values of a selected column",
                        returns_type="series",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Target Column", type="column", required=True, description="Column to inspect"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="nunique",
                        name="nunique()",
                        category="unique",
                        description="Count distinct values per column or for a specific column",
                        returns_type="dict",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Column (Optional)", type="column", required=False, description="Specific column or all"
                            )
                        ],
                    ),
                    OperationDefinition(
                        id="value_counts",
                        name="value_counts()",
                        category="unique",
                        description="Return frequency counts and percentages of unique values in a column",
                        returns_type="table",
                        params=[
                            OperationParamDefinition(
                                name="column", label="Target Column", type="column", required=True, description="Column to analyze"
                            ),
                            OperationParamDefinition(
                                name="normalize", label="Show Relative Frequency (%)", type="boolean", required=False, default=False, description="Compute as percentage"
                            ),
                            OperationParamDefinition(
                                name="ascending", label="Ascending Order", type="boolean", required=False, default=False, description="Sort low to high"
                            ),
                        ],
                    ),
                ],
            ),
        ]

    @staticmethod
    def execute(df: pd.DataFrame, category: str, operation: str, params: Dict[str, Any]) -> OperationResult:
        """Execute a Pandas operation dynamically against the DataFrame."""
        start_time = time.perf_counter()

        try:
            # 1. Basic Operations
            if operation == "head":
                n = int(params.get("n", 5))
                result_df = df.head(n)
                rows = df_to_json_records(result_df)
                return OperationResult(
                    success=True,
                    operation="head",
                    category=category,
                    result_type="table",
                    summary=f"First {len(result_df)} rows of dataset",
                    columns=[str(c) for c in result_df.columns],
                    rows=rows,
                    shape=[len(result_df), len(result_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "tail":
                n = int(params.get("n", 5))
                result_df = df.tail(n)
                rows = df_to_json_records(result_df)
                return OperationResult(
                    success=True,
                    operation="tail",
                    category=category,
                    result_type="table",
                    summary=f"Last {len(result_df)} rows of dataset",
                    columns=[str(c) for c in result_df.columns],
                    rows=rows,
                    shape=[len(result_df), len(result_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "sample":
                n = int(params.get("n", 5))
                n = min(n, len(df))
                result_df = df.sample(n=n, random_state=42) if len(df) > 0 else df
                rows = df_to_json_records(result_df)
                return OperationResult(
                    success=True,
                    operation="sample",
                    category=category,
                    result_type="table",
                    summary=f"Random sample of {len(result_df)} rows",
                    columns=[str(c) for c in result_df.columns],
                    rows=rows,
                    shape=[len(result_df), len(result_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "shape":
                shape_data = {
                    "rows": int(df.shape[0]),
                    "columns": int(df.shape[1]),
                    "total_cells": int(df.shape[0] * df.shape[1]),
                }
                return OperationResult(
                    success=True,
                    operation="shape",
                    category=category,
                    result_type="dict",
                    summary=f"Dimensionality: {df.shape[0]:,} rows × {df.shape[1]} columns",
                    data=shape_data,
                    shape=list(df.shape),
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "columns":
                cols_list = [str(c) for c in df.columns]
                return OperationResult(
                    success=True,
                    operation="columns",
                    category=category,
                    result_type="series",
                    summary=f"{len(cols_list)} total columns",
                    data=cols_list,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "index":
                idx_data = {
                    "start": 0 if len(df) == 0 else int(df.index.min()),
                    "stop": int(len(df)),
                    "step": 1,
                    "length": int(len(df)),
                    "index_type": str(type(df.index).__name__),
                }
                return OperationResult(
                    success=True,
                    operation="index",
                    category=category,
                    result_type="dict",
                    summary=f"RangeIndex: 0 to {len(df)} (step 1)",
                    data=idx_data,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "info":
                buf = io.StringIO()
                df.info(buf=buf, memory_usage="deep")
                info_text = buf.getvalue()
                col_summaries = []
                for c in df.columns:
                    col_summaries.append({
                        "column": str(c),
                        "non_null_count": int(df[c].count()),
                        "null_count": int(df[c].isna().sum()),
                        "dtype": str(df[c].dtype),
                    })
                return OperationResult(
                    success=True,
                    operation="info",
                    category=category,
                    result_type="info",
                    summary=f"Dataset Info: {len(df):,} rows, {len(df.columns)} columns",
                    data={"raw_text": info_text, "columns_info": col_summaries},
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "describe":
                include = params.get("include", "all")
                if include == "all":
                    desc_df = df.describe(include="all")
                else:
                    numeric_df = df.select_dtypes(include=[np.number])
                    desc_df = numeric_df.describe() if not numeric_df.empty else df.describe()

                # Reset index so metrics (count, mean, std, min, etc.) appear as a column
                desc_df_reset = desc_df.reset_index().rename(columns={"index": "statistic"})
                rows = df_to_json_records(desc_df_reset)
                return OperationResult(
                    success=True,
                    operation="describe",
                    category=category,
                    result_type="table",
                    summary=f"Descriptive statistics for {len(desc_df.columns)} features",
                    columns=[str(c) for c in desc_df_reset.columns],
                    rows=rows,
                    shape=[len(desc_df_reset), len(desc_df_reset.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "dtypes":
                dtypes_dict = {str(c): str(df[c].dtype) for c in df.columns}
                return OperationResult(
                    success=True,
                    operation="dtypes",
                    category=category,
                    result_type="dict",
                    summary="Column data types",
                    data=dtypes_dict,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "size":
                total_size = int(df.size)
                return OperationResult(
                    success=True,
                    operation="size",
                    category=category,
                    result_type="scalar",
                    summary=f"Total elements: {total_size:,}",
                    data=total_size,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "ndim":
                ndim_val = int(df.ndim)
                return OperationResult(
                    success=True,
                    operation="ndim",
                    category=category,
                    result_type="scalar",
                    summary=f"Number of dimensions: {ndim_val}",
                    data=ndim_val,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            # 2. Column Operations
            elif operation == "select_columns":
                selected_cols = params.get("columns", [])
                if isinstance(selected_cols, str):
                    selected_cols = [c.strip() for c in selected_cols.split(",") if c.strip()]
                valid_cols = [c for c in selected_cols if c in df.columns]
                if not valid_cols:
                    valid_cols = list(df.columns[:min(5, len(df.columns))])
                sub_df = df[valid_cols].head(100)
                rows = df_to_json_records(sub_df)
                return OperationResult(
                    success=True,
                    operation="select_columns",
                    category=category,
                    result_type="table",
                    summary=f"Selected {len(valid_cols)} columns: {', '.join(valid_cols)}",
                    columns=valid_cols,
                    rows=rows,
                    shape=[len(sub_df), len(valid_cols)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "rename_columns":
                target_col = params.get("column")
                new_name = params.get("new_name", "").strip()
                if not target_col or target_col not in df.columns:
                    raise ValueError(f"Column '{target_col}' not found in dataset.")
                if not new_name:
                    raise ValueError("New column name cannot be empty.")
                renamed_df = df.rename(columns={target_col: new_name}).head(50)
                rows = df_to_json_records(renamed_df)
                return OperationResult(
                    success=True,
                    operation="rename_columns",
                    category=category,
                    result_type="table",
                    summary=f"Renamed column '{target_col}' → '{new_name}' (Preview)",
                    columns=[str(c) for c in renamed_df.columns],
                    rows=rows,
                    shape=[len(renamed_df), len(renamed_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "drop_columns":
                cols_to_drop = params.get("columns", [])
                if isinstance(cols_to_drop, str):
                    cols_to_drop = [c.strip() for c in cols_to_drop.split(",") if c.strip()]
                valid_drops = [c for c in cols_to_drop if c in df.columns]
                dropped_df = df.drop(columns=valid_drops).head(50)
                rows = df_to_json_records(dropped_df)
                return OperationResult(
                    success=True,
                    operation="drop_columns",
                    category=category,
                    result_type="table",
                    summary=f"Dropped {len(valid_drops)} column(s): {', '.join(valid_drops)} (Preview)",
                    columns=[str(c) for c in dropped_df.columns],
                    rows=rows,
                    shape=[len(dropped_df), len(dropped_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "select_rows":
                start_idx = int(params.get("start_idx", 0))
                end_idx = int(params.get("end_idx", 10))
                slice_df = df.iloc[start_idx:end_idx]
                rows = df_to_json_records(slice_df)
                return OperationResult(
                    success=True,
                    operation="select_rows",
                    category=category,
                    result_type="table",
                    summary=f"Selected row slice [{start_idx}:{end_idx}] ({len(slice_df)} rows)",
                    columns=[str(c) for c in slice_df.columns],
                    rows=rows,
                    shape=[len(slice_df), len(slice_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "filter_records":
                col = params.get("column")
                op = params.get("operator", "==")
                val = params.get("value")

                if not col or col not in df.columns:
                    raise ValueError(f"Column '{col}' not found.")

                series = df[col]

                if op == "isnull":
                    mask = series.isna()
                elif op == "notnull":
                    mask = series.notna()
                elif op == "contains":
                    mask = series.astype(str).str.contains(str(val), case=False, na=False)
                elif op == "startswith":
                    mask = series.astype(str).str.startswith(str(val), na=False)
                elif op == "endswith":
                    mask = series.astype(str).str.endswith(str(val), na=False)
                else:
                    # Type conversion attempt for numeric comparisons
                    compare_val = val
                    if pd.api.types.is_numeric_dtype(series):
                        try:
                            compare_val = float(val) if "." in str(val) else int(val)
                        except (ValueError, TypeError):
                            pass

                    if op == "==":
                        mask = (series == compare_val)
                    elif op == "!=":
                        mask = (series != compare_val)
                    elif op == ">":
                        mask = (series > compare_val)
                    elif op == "<":
                        mask = (series < compare_val)
                    elif op == ">=":
                        mask = (series >= compare_val)
                    elif op == "<=":
                        mask = (series <= compare_val)
                    else:
                        mask = pd.Series(True, index=df.index)

                filtered_df = df[mask].head(100)
                rows = df_to_json_records(filtered_df)
                total_matches = int(mask.sum())

                return OperationResult(
                    success=True,
                    operation="filter_records",
                    category=category,
                    result_type="table",
                    summary=f"Filter '{col} {op} {val}': {total_matches:,} matches found",
                    columns=[str(c) for c in filtered_df.columns],
                    rows=rows,
                    shape=[len(filtered_df), len(filtered_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "sort_values":
                col = params.get("column")
                asc = bool(params.get("ascending", True))
                if not col or col not in df.columns:
                    col = df.columns[0]
                sorted_df = df.sort_values(by=col, ascending=asc).head(100)
                rows = df_to_json_records(sorted_df)
                direction = "ascending" if asc else "descending"
                return OperationResult(
                    success=True,
                    operation="sort_values",
                    category=category,
                    result_type="table",
                    summary=f"Sorted by '{col}' ({direction})",
                    columns=[str(c) for c in sorted_df.columns],
                    rows=rows,
                    shape=[len(sorted_df), len(sorted_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            # 3. Statistical Operations
            elif operation in ("mean", "median", "mode", "min", "max", "sum", "count", "std", "var", "quantile"):
                col = params.get("column")
                numeric_df = df.select_dtypes(include=[np.number]) if not col else None

                stat_data = {}
                summary_msg = ""

                if col:
                    if col not in df.columns:
                        raise ValueError(f"Column '{col}' not found.")
                    s = df[col]
                    if operation == "mean":
                        stat_data = {col: sanitize_value(s.mean())}
                        summary_msg = f"Mean of '{col}': {stat_data[col]}"
                    elif operation == "median":
                        stat_data = {col: sanitize_value(s.median())}
                        summary_msg = f"Median of '{col}': {stat_data[col]}"
                    elif operation == "mode":
                        mode_vals = s.mode().tolist()
                        stat_data = {col: [sanitize_value(v) for v in mode_vals]}
                        summary_msg = f"Mode of '{col}': {stat_data[col]}"
                    elif operation == "min":
                        stat_data = {col: sanitize_value(s.min())}
                        summary_msg = f"Min of '{col}': {stat_data[col]}"
                    elif operation == "max":
                        stat_data = {col: sanitize_value(s.max())}
                        summary_msg = f"Max of '{col}': {stat_data[col]}"
                    elif operation == "sum":
                        stat_data = {col: sanitize_value(s.sum())}
                        summary_msg = f"Sum of '{col}': {stat_data[col]}"
                    elif operation == "count":
                        stat_data = {col: int(s.count())}
                        summary_msg = f"Non-null count of '{col}': {stat_data[col]:,}"
                    elif operation == "std":
                        stat_data = {col: sanitize_value(s.std())}
                        summary_msg = f"Std Dev of '{col}': {stat_data[col]}"
                    elif operation == "var":
                        stat_data = {col: sanitize_value(s.var())}
                        summary_msg = f"Variance of '{col}': {stat_data[col]}"
                    elif operation == "quantile":
                        q_val = float(params.get("q", 0.5))
                        stat_data = {col: sanitize_value(s.quantile(q_val))}
                        summary_msg = f"{int(q_val * 100)}th percentile of '{col}': {stat_data[col]}"
                else:
                    # Apply across numeric columns
                    target = numeric_df if (numeric_df is not None and not numeric_df.empty) else df
                    if operation == "mean":
                        stat_data = {str(c): sanitize_value(target[c].mean()) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    elif operation == "median":
                        stat_data = {str(c): sanitize_value(target[c].median()) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    elif operation == "min":
                        stat_data = {str(c): sanitize_value(target[c].min()) for c in target.columns}
                    elif operation == "max":
                        stat_data = {str(c): sanitize_value(target[c].max()) for c in target.columns}
                    elif operation == "sum":
                        stat_data = {str(c): sanitize_value(target[c].sum()) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    elif operation == "count":
                        stat_data = {str(c): int(target[c].count()) for c in target.columns}
                    elif operation == "std":
                        stat_data = {str(c): sanitize_value(target[c].std()) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    elif operation == "var":
                        stat_data = {str(c): sanitize_value(target[c].var()) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    elif operation == "quantile":
                        q_val = float(params.get("q", 0.5))
                        stat_data = {str(c): sanitize_value(target[c].quantile(q_val)) for c in target.columns if pd.api.types.is_numeric_dtype(target[c])}
                    summary_msg = f"{operation.capitalize()} computed across {len(stat_data)} columns"

                return OperationResult(
                    success=True,
                    operation=operation,
                    category=category,
                    result_type="dict",
                    summary=summary_msg,
                    data=stat_data,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            # 4. Missing Value Operations
            elif operation in ("isnull", "notnull", "isna"):
                mask_df = df.isna().head(50) if operation in ("isnull", "isna") else df.notna().head(50)
                rows = df_to_json_records(mask_df)
                return OperationResult(
                    success=True,
                    operation=operation,
                    category=category,
                    result_type="table",
                    summary=f"Boolean mask for {operation}() (Preview 50 rows)",
                    columns=[str(c) for c in mask_df.columns],
                    rows=rows,
                    shape=[len(mask_df), len(mask_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "missing_count":
                col = params.get("column")
                if col:
                    if col not in df.columns:
                        raise ValueError(f"Column '{col}' not found.")
                    cnt = int(df[col].isna().sum())
                    stat_data = {col: cnt}
                    summary_msg = f"Column '{col}' has {cnt:,} missing values"
                else:
                    stat_data = {str(c): int(df[c].isna().sum()) for c in df.columns}
                    summary_msg = f"Total missing values across dataset: {sum(stat_data.values()):,}"

                return OperationResult(
                    success=True,
                    operation="missing_count",
                    category=category,
                    result_type="dict",
                    summary=summary_msg,
                    data=stat_data,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "missing_percentage":
                col = params.get("column")
                total_rows = len(df) if len(df) > 0 else 1
                if col:
                    if col not in df.columns:
                        raise ValueError(f"Column '{col}' not found.")
                    pct = round((df[col].isna().sum() / total_rows) * 100, 2)
                    stat_data = {col: pct}
                    summary_msg = f"Column '{col}' has {pct}% missing values"
                else:
                    stat_data = {str(c): round((df[c].isna().sum() / total_rows) * 100, 2) for c in df.columns}
                    summary_msg = "Missing value percentages per column"

                return OperationResult(
                    success=True,
                    operation="missing_percentage",
                    category=category,
                    result_type="dict",
                    summary=summary_msg,
                    data=stat_data,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            # 5. Duplicate Operations
            elif operation == "duplicated":
                subset = params.get("subset")
                keep = params.get("keep", "first")
                if keep not in ("first", "last", "false", False):
                    keep = "first"
                if keep == "false":
                    keep = False

                valid_subset = [c for c in subset if c in df.columns] if subset else None
                dup_mask = df.duplicated(subset=valid_subset, keep=keep)
                dup_df = df[dup_mask].head(100)
                rows = df_to_json_records(dup_df)
                total_dups = int(dup_mask.sum())

                return OperationResult(
                    success=True,
                    operation="duplicated",
                    category=category,
                    result_type="table",
                    summary=f"Found {total_dups:,} duplicate rows (keep='{keep}')",
                    columns=[str(c) for c in dup_df.columns],
                    rows=rows,
                    shape=[len(dup_df), len(dup_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "drop_duplicates":
                subset = params.get("subset")
                keep = params.get("keep", "first")
                if keep not in ("first", "last"):
                    keep = "first"

                valid_subset = [c for c in subset if c in df.columns] if subset else None
                dedup_df = df.drop_duplicates(subset=valid_subset, keep=keep).head(100)
                rows = df_to_json_records(dedup_df)
                dropped_count = len(df) - len(df.drop_duplicates(subset=valid_subset, keep=keep))

                return OperationResult(
                    success=True,
                    operation="drop_duplicates",
                    category=category,
                    result_type="table",
                    summary=f"Preview without duplicates: dropped {dropped_count} rows, {len(dedup_df)} remaining",
                    columns=[str(c) for c in dedup_df.columns],
                    rows=rows,
                    shape=[len(dedup_df), len(dedup_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            # 6. Unique Value Operations
            elif operation == "unique":
                col = params.get("column")
                if not col or col not in df.columns:
                    raise ValueError(f"Column '{col}' not specified or not found in dataset.")
                unique_vals = [sanitize_value(v) for v in df[col].dropna().unique().tolist()]
                return OperationResult(
                    success=True,
                    operation="unique",
                    category=category,
                    result_type="series",
                    summary=f"{len(unique_vals)} unique values in '{col}'",
                    data=unique_vals,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "nunique":
                col = params.get("column")
                if col:
                    if col not in df.columns:
                        raise ValueError(f"Column '{col}' not found.")
                    val = int(df[col].nunique(dropna=True))
                    stat_data = {col: val}
                    summary_msg = f"{val:,} distinct values in '{col}'"
                else:
                    stat_data = {str(c): int(df[c].nunique(dropna=True)) for c in df.columns}
                    summary_msg = "Distinct counts across all columns"

                return OperationResult(
                    success=True,
                    operation="nunique",
                    category=category,
                    result_type="dict",
                    summary=summary_msg,
                    data=stat_data,
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            elif operation == "value_counts":
                col = params.get("column")
                normalize = bool(params.get("normalize", False))
                ascending = bool(params.get("ascending", False))

                if not col or col not in df.columns:
                    raise ValueError(f"Target column '{col}' is required for value_counts().")

                vc = df[col].value_counts(dropna=False, normalize=normalize, ascending=ascending)
                vc_df = vc.reset_index()
                # Ensure column names are clear
                vc_df.columns = [col, "frequency" if normalize else "count"]
                if normalize:
                    vc_df["frequency"] = vc_df["frequency"].round(4)
                rows = df_to_json_records(vc_df)

                return OperationResult(
                    success=True,
                    operation="value_counts",
                    category=category,
                    result_type="table",
                    summary=f"Value counts for '{col}' ({len(vc_df)} distinct bins)",
                    columns=[str(c) for c in vc_df.columns],
                    rows=rows,
                    shape=[len(vc_df), len(vc_df.columns)],
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                )

            else:
                raise ValueError(f"Unsupported operation '{operation}' in category '{category}'.")

        except Exception as e:
            return OperationResult(
                success=False,
                operation=operation,
                category=category,
                result_type="text",
                summary=f"Failed to execute {operation}()",
                error=str(e),
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
            )

operation_engine = OperationEngine()
