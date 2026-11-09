"""Data Cleaning Engine: Provides interactive transformations, outlier detection,
missing value imputation, undo history, and versioning without altering original datasets.
"""
from datetime import datetime, timezone
import re
import uuid
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.schemas.cleaning import (
    CleaningStepInfo,
    CleaningSessionState,
    CleaningPreviewResponse,
    CleaningApplyResponse,
    OutlierDetectionResult,
    MissingValueDetectionSummary,
)
from app.schemas.dataset import DatasetMetadata
from app.services.dataset_store import dataset_store
from app.utils.helpers import df_to_json_records, sanitize_value

class DatasetCleaningSession:
    def __init__(self, dataset_id: str, original_name: str, base_df: pd.DataFrame):
        self.dataset_id = dataset_id
        self.original_name = original_name
        self.base_df = base_df.copy()
        self.working_df = base_df.copy()
        self.snapshots: List[pd.DataFrame] = []
        self.history: List[CleaningStepInfo] = []

    def can_undo(self) -> bool:
        return len(self.snapshots) > 0

    def get_session_state(self) -> CleaningSessionState:
        total_missing = int(self.working_df.isna().sum().sum())
        total_cells = len(self.working_df) * len(self.working_df.columns) if len(self.working_df) > 0 else 1
        missing_pct = round((total_missing / total_cells) * 100, 2)

        return CleaningSessionState(
            dataset_id=self.dataset_id,
            original_name=self.original_name,
            is_dirty=len(self.history) > 0,
            can_undo=self.can_undo(),
            history=self.history,
            total_rows=len(self.working_df),
            total_columns=len(self.working_df.columns),
            missing_count=total_missing,
            missing_percentage=missing_pct,
        )

class CleaningEngine:
    def __init__(self):
        self._sessions: Dict[str, DatasetCleaningSession] = {}

    def get_or_create_session(self, dataset_id: str) -> DatasetCleaningSession:
        if dataset_id not in self._sessions:
            meta = dataset_store.get_metadata(dataset_id)
            base_df = dataset_store.get_dataframe(dataset_id)
            self._sessions[dataset_id] = DatasetCleaningSession(dataset_id, meta.original_name, base_df)
        return self._sessions[dataset_id]

    def get_session_state(self, dataset_id: str) -> CleaningSessionState:
        session = self.get_or_create_session(dataset_id)
        return session.get_session_state()

    def get_working_dataframe(self, dataset_id: str) -> pd.DataFrame:
        session = self.get_or_create_session(dataset_id)
        return session.working_df

    # 1. Missing Value Detection
    @staticmethod
    def detect_missing_values(df: pd.DataFrame) -> MissingValueDetectionSummary:
        total_missing = int(df.isna().sum().sum())
        total_cells = len(df) * len(df.columns) if (len(df) > 0 and len(df.columns) > 0) else 1
        missing_pct = round((total_missing / total_cells) * 100, 2)

        cols_with_missing = []
        for col in df.columns:
            m_count = int(df[col].isna().sum())
            if m_count > 0:
                cols_with_missing.append({
                    "column": str(col),
                    "missing_count": m_count,
                    "missing_percentage": round((m_count / len(df)) * 100, 2) if len(df) > 0 else 0.0,
                    "dtype": str(df[col].dtype),
                })

        return MissingValueDetectionSummary(
            total_missing_cells=total_missing,
            total_cells=total_cells,
            missing_percentage=missing_pct,
            columns_with_missing=cols_with_missing,
        )

    # 2. Outlier Detection
    @staticmethod
    def detect_outliers(
        df: pd.DataFrame,
        method: str = "IQR",
        threshold: float = 1.5,
        target_column: Optional[str] = None,
    ) -> List[OutlierDetectionResult]:
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        if target_column:
            numeric_cols = [c for c in numeric_cols if c == target_column]

        results: List[OutlierDetectionResult] = []

        for col in numeric_cols:
            s = df[col].dropna()
            if len(s) < 4:
                continue

            lower_bound = 0.0
            upper_bound = 0.0
            outlier_mask = pd.Series(False, index=s.index)

            if method.upper() == "IQR":
                q1 = float(s.quantile(0.25))
                q3 = float(s.quantile(0.75))
                iqr = q3 - q1
                lower_bound = round(q1 - (threshold * iqr), 4)
                upper_bound = round(q3 + (threshold * iqr), 4)
                outlier_mask = (s < lower_bound) | (s > upper_bound)
            elif method.upper() in ("ZSCORE", "Z-SCORE"):
                mean_val = float(s.mean())
                std_val = float(s.std())
                if std_val > 0:
                    z_scores = np.abs((s - mean_val) / std_val)
                    lower_bound = round(mean_val - (threshold * std_val), 4)
                    upper_bound = round(mean_val + (threshold * std_val), 4)
                    outlier_mask = z_scores > threshold

            outlier_count = int(outlier_mask.sum())
            if outlier_count > 0:
                sample_vals = [sanitize_value(v) for v in s[outlier_mask].head(5).tolist()]
                outlier_pct = round((outlier_count / len(s)) * 100, 2)
                results.append(
                    OutlierDetectionResult(
                        column=str(col),
                        method=method.upper(),
                        outlier_count=outlier_count,
                        outlier_percentage=outlier_pct,
                        lower_bound=lower_bound,
                        upper_bound=upper_bound,
                        min_value=sanitize_value(s.min()),
                        max_value=sanitize_value(s.max()),
                        sample_outliers=sample_vals,
                    )
                )

        return results

    # 3. Core Transformation Logic
    def _execute_transformation(
        self, df: pd.DataFrame, operation: str, params: Dict[str, Any]
    ) -> tuple[pd.DataFrame, str, List[str]]:
        """
        Execute cleaning transformation on a dataframe and return (new_df, description, columns_affected).
        """
        working = df.copy()
        affected_cols: List[str] = []
        desc = ""

        # --- A. MISSING VALUES ---
        if operation == "drop_missing":
            how = params.get("how", "any")  # "any" or "all"
            subset = params.get("subset")
            if isinstance(subset, str):
                subset = [subset]
            valid_subset = [c for c in subset if c in working.columns] if subset else None

            rows_before = len(working)
            working = working.dropna(how=how, subset=valid_subset)
            dropped = rows_before - len(working)
            target = f"columns {valid_subset}" if valid_subset else "any column"
            desc = f"Dropped {dropped:,} row(s) with missing values in {target} (how='{how}')"
            affected_cols = valid_subset if valid_subset else list(df.columns)

        elif operation == "fill_missing":
            col = params.get("column")
            strategy = params.get("strategy", "constant")  # "constant", "mean", "median", "mode", "ffill", "bfill"
            fill_val = params.get("value")

            if col and col in working.columns:
                target_cols = [col]
            else:
                target_cols = list(working.columns)

            affected_cols = target_cols

            for c in target_cols:
                series = working[c]
                if strategy == "constant":
                    # Coerce type if numeric
                    if pd.api.types.is_numeric_dtype(series) and fill_val is not None:
                        try:
                            working[c] = series.fillna(float(fill_val) if "." in str(fill_val) else int(fill_val))
                        except Exception:
                            working[c] = series.fillna(fill_val)
                    else:
                        working[c] = series.fillna(fill_val if fill_val is not None else "Unknown")
                elif strategy == "mean" and pd.api.types.is_numeric_dtype(series):
                    working[c] = series.fillna(series.mean())
                elif strategy == "median" and pd.api.types.is_numeric_dtype(series):
                    working[c] = series.fillna(series.median())
                elif strategy == "mode":
                    mode_val = series.mode()
                    if len(mode_val) > 0:
                        working[c] = series.fillna(mode_val.iloc[0])
                elif strategy == "ffill":
                    working[c] = series.ffill()
                elif strategy == "bfill":
                    working[c] = series.bfill()

            desc = f"Filled missing values in {len(target_cols)} column(s) using strategy '{strategy}'"

        # --- B. DUPLICATES ---
        elif operation == "remove_duplicates":
            subset = params.get("subset")
            keep = params.get("keep", "first")
            if keep not in ("first", "last"):
                keep = "first"
            if isinstance(subset, str):
                subset = [subset]
            valid_subset = [c for c in subset if c in working.columns] if subset else None

            rows_before = len(working)
            working = working.drop_duplicates(subset=valid_subset, keep=keep)
            dropped = rows_before - len(working)
            desc = f"Removed {dropped:,} duplicate row(s) (keep='{keep}', subset={valid_subset or 'all'})"
            affected_cols = valid_subset if valid_subset else list(working.columns)

        # --- C. COLUMN TRANSFORMATIONS ---
        elif operation == "rename_column":
            old_name = params.get("old_name")
            new_name = params.get("new_name", "").strip()
            if not old_name or old_name not in working.columns:
                raise ValueError(f"Column '{old_name}' not found.")
            if not new_name:
                raise ValueError("New column name cannot be empty.")
            working = working.rename(columns={old_name: new_name})
            desc = f"Renamed column '{old_name}' to '{new_name}'"
            affected_cols = [new_name]

        elif operation == "change_dtype":
            col = params.get("column")
            target_dtype = params.get("target_dtype")  # "int", "float", "string", "datetime", "boolean"

            if not col or col not in working.columns:
                raise ValueError(f"Column '{col}' not found.")

            series = working[col]

            if target_dtype in ("int", "int64"):
                working[col] = pd.to_numeric(series, errors="coerce").fillna(0).astype("int64")
            elif target_dtype in ("float", "float64"):
                working[col] = pd.to_numeric(series, errors="coerce")
            elif target_dtype in ("str", "string"):
                working[col] = series.astype(str).replace("nan", "")
            elif target_dtype in ("datetime", "datetime64"):
                working[col] = pd.to_datetime(series, errors="coerce")
            elif target_dtype in ("bool", "boolean"):
                working[col] = series.astype(bool)
            else:
                raise ValueError(f"Unsupported target dtype '{target_dtype}'")

            desc = f"Converted column '{col}' to data type '{target_dtype}'"
            affected_cols = [col]

        elif operation == "remove_whitespace":
            col = params.get("column")
            target_cols = [col] if (col and col in working.columns) else [
                c for c in working.columns if working[c].dtype == object or pd.api.types.is_string_dtype(working[c])
            ]

            for c in target_cols:
                working[c] = working[c].astype(str).str.strip().replace("nan", "")

            desc = f"Trimmed whitespace across {len(target_cols)} text column(s)"
            affected_cols = target_cols

        elif operation == "standardize_text":
            col = params.get("column")
            case_mode = params.get("case", "lower")  # "lower", "upper", "title"
            strip_special = bool(params.get("strip_special", False))

            if not col or col not in working.columns:
                raise ValueError(f"Target text column '{col}' is required.")

            series = working[col].astype(str)
            if case_mode == "lower":
                series = series.str.lower()
            elif case_mode == "upper":
                series = series.str.upper()
            elif case_mode == "title":
                series = series.str.title()

            if strip_special:
                series = series.apply(lambda val: re.sub(r'[^a-zA-Z0-9\s]', '', val))

            working[col] = series
            desc = f"Standardized text in '{col}' ({case_mode}case, strip_special={strip_special})"
            affected_cols = [col]

        elif operation == "replace_values":
            col = params.get("column")
            find_val = params.get("find_value")
            replace_val = params.get("replace_value", "")
            use_regex = bool(params.get("use_regex", False))

            if not col or col not in working.columns:
                raise ValueError(f"Column '{col}' not found.")

            if use_regex:
                working[col] = working[col].astype(str).replace(str(find_val), str(replace_val), regex=True)
            else:
                working[col] = working[col].replace(find_val, replace_val)

            desc = f"Replaced '{find_val}' with '{replace_val}' in column '{col}'"
            affected_cols = [col]

        # --- D. OUTLIERS ---
        elif operation == "handle_outliers":
            col = params.get("column")
            method = params.get("method", "IQR")
            threshold = float(params.get("threshold", 1.5))
            action = params.get("action", "cap")  # "cap", "remove_rows", "set_null", "impute_median"

            if not col or col not in working.columns:
                raise ValueError(f"Numeric column '{col}' is required for outlier handling.")

            s = working[col].dropna()
            if len(s) < 4:
                raise ValueError(f"Column '{col}' has insufficient numeric entries.")

            if method.upper() == "IQR":
                q1 = float(s.quantile(0.25))
                q3 = float(s.quantile(0.75))
                iqr = q3 - q1
                lower = q1 - (threshold * iqr)
                upper = q3 + (threshold * iqr)
            else:
                mean_v = float(s.mean())
                std_v = float(s.std())
                lower = mean_v - (threshold * std_v)
                upper = mean_v + (threshold * std_v)

            outlier_mask = (working[col] < lower) | (working[col] > upper)
            outlier_count = int(outlier_mask.sum())

            if action == "cap":
                working[col] = working[col].clip(lower=lower, upper=upper)
                desc = f"Capped {outlier_count:,} outlier values in '{col}' to bounds [{lower:.2f}, {upper:.2f}]"
            elif action == "remove_rows":
                working = working[~outlier_mask]
                desc = f"Removed {outlier_count:,} rows with outliers in '{col}'"
            elif action == "set_null":
                working.loc[outlier_mask, col] = np.nan
                desc = f"Set {outlier_count:,} outliers in '{col}' to NaN"
            elif action == "impute_median":
                working.loc[outlier_mask, col] = s.median()
                desc = f"Imputed {outlier_count:,} outliers in '{col}' with column median ({s.median():.2f})"

            affected_cols = [col]

        else:
            raise ValueError(f"Unknown cleaning operation '{operation}'.")

        return working, desc, affected_cols

    # 4. Preview Operation
    def preview_cleaning_action(
        self, dataset_id: str, operation: str, params: Dict[str, Any]
    ) -> CleaningPreviewResponse:
        session = self.get_or_create_session(dataset_id)
        current_df = session.working_df

        rows_before = len(current_df)
        missing_before = int(current_df.isna().sum().sum())

        new_df, desc, affected_cols = self._execute_transformation(current_df, operation, params)

        rows_after = len(new_df)
        missing_after = int(new_df.isna().sum().sum())
        rows_affected = abs(rows_before - rows_after)

        preview_rows = df_to_json_records(new_df.head(50))

        return CleaningPreviewResponse(
            operation=operation,
            description=desc,
            rows_before=rows_before,
            rows_after=rows_after,
            rows_affected=rows_affected,
            columns_affected=affected_cols,
            preview_rows=preview_rows,
            columns=[str(c) for c in new_df.columns],
            metrics_before={"rows": rows_before, "missing_cells": missing_before},
            metrics_after={"rows": rows_after, "missing_cells": missing_after},
        )

    # 5. Apply Operation
    def apply_cleaning_action(
        self, dataset_id: str, operation: str, params: Dict[str, Any]
    ) -> CleaningApplyResponse:
        session = self.get_or_create_session(dataset_id)

        # Push snapshot for Undo
        session.snapshots.append(session.working_df.copy())

        # Execute
        new_df, desc, _ = self._execute_transformation(session.working_df, operation, params)
        session.working_df = new_df

        # Add history step
        now_str = datetime.now(timezone.utc).isoformat()
        step = CleaningStepInfo(
            step_id=str(uuid.uuid4()),
            operation=operation,
            description=desc,
            timestamp=now_str,
            rows_count=len(new_df),
            columns_count=len(new_df.columns),
            missing_count=int(new_df.isna().sum().sum()),
        )
        session.history.append(step)

        return CleaningApplyResponse(
            success=True,
            message=desc,
            step=step,
            can_undo=session.can_undo(),
            total_history_steps=len(session.history),
            session_state=session.get_session_state(),
        )

    # 6. Undo Last Operation
    def undo_last_action(self, dataset_id: str) -> CleaningSessionState:
        session = self.get_or_create_session(dataset_id)
        if not session.snapshots:
            raise ValueError("No actions to undo.")

        # Pop previous state
        session.working_df = session.snapshots.pop()
        if session.history:
            session.history.pop()

        return session.get_session_state()

    # 7. Reset to Original
    def reset_session(self, dataset_id: str) -> CleaningSessionState:
        session = self.get_or_create_session(dataset_id)
        session.working_df = session.base_df.copy()
        session.snapshots.clear()
        session.history.clear()
        return session.get_session_state()

    # 8. Save Cleaned Dataset as New Version
    def save_as_new_version(
        self, dataset_id: str, version_name: Optional[str] = None
    ) -> DatasetMetadata:
        session = self.get_or_create_session(dataset_id)

        new_dataset_id = str(uuid.uuid4())
        base_name = session.original_name
        # Build clean version name
        name_root = base_name.rsplit(".", 1)[0]
        ext = base_name.rsplit(".", 1)[1] if "." in base_name else "csv"

        if not version_name:
            version_name = f"{name_root}_cleaned_v{len(session.history)}.{ext}"
        elif not version_name.endswith(f".{ext}"):
            version_name = f"{version_name}.{ext}"

        raw_csv_bytes = session.working_df.to_csv(index=False).encode("utf-8")

        new_metadata = dataset_store.save_dataset(
            dataset_id=new_dataset_id,
            filename=version_name,
            original_name=version_name,
            df=session.working_df,
            raw_bytes=raw_csv_bytes,
        )

        # Set as active dataset so user immediately operates on the cleaned version
        dataset_store.set_active_id(new_dataset_id)

        return new_metadata

cleaning_engine = CleaningEngine()
