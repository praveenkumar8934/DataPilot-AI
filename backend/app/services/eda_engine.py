"""Exploratory Data Analysis (EDA) Engine.
Implements univariate, bivariate, multivariate correlation, distribution analysis,
GroupBy aggregations, and pivot table modeling on live datasets.
"""
import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.schemas.analytics import (
    BoxplotMetrics,
    CategoryFrequency,
    CategoricalGroupStat,
    ColumnSummary,
    CorrelationMatrixResponse,
    CorrelationPair,
    EDAOverview,
    GroupByRequest,
    GroupByResponse,
    HistogramBin,
    PivotTableRequest,
    PivotTableResponse,
    ScatterPoint,
    BivariateAnalysisResponse,
    UnivariateCategoricalAnalysis,
    UnivariateNumericAnalysis,
    UnivariateResult,
)
from app.utils.helpers import df_to_json_records, sanitize_value


class EDAEngine:
    @staticmethod
    def get_overview(df: pd.DataFrame, dataset_id: str) -> EDAOverview:
        """Compute top-level summary of dataset structure, dtypes, missingness, and column profiles."""
        total_rows = len(df)
        total_columns = len(df.columns)
        total_cells = total_rows * total_columns

        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        datetime_cols = [
            c
            for c in df.columns
            if pd.api.types.is_datetime64_any_dtype(df[c])
        ]
        categorical_cols = [
            c for c in df.columns if c not in numeric_cols and c not in datetime_cols
        ]

        missing_cells = int(df.isna().sum().sum())
        missing_pct = (
            round((missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0
        )
        duplicate_rows = int(df.duplicated().sum())

        columns_summary: List[ColumnSummary] = []
        for col in df.columns:
            s = df[col]
            is_num = col in numeric_cols
            col_missing = int(s.isna().sum())
            col_missing_pct = (
                round((col_missing / total_rows) * 100, 2) if total_rows > 0 else 0.0
            )
            unique_count = int(s.nunique(dropna=True))

            columns_summary.append(
                ColumnSummary(
                    name=str(col),
                    dtype=str(s.dtype),
                    is_numeric=is_num,
                    missing_count=col_missing,
                    missing_percentage=col_missing_pct,
                    unique_count=unique_count,
                )
            )

        return EDAOverview(
            dataset_id=dataset_id,
            total_rows=total_rows,
            total_columns=total_columns,
            numeric_columns=[str(c) for c in numeric_cols],
            categorical_columns=[str(c) for c in categorical_cols],
            datetime_columns=[str(c) for c in datetime_cols],
            total_missing_cells=missing_cells,
            missing_percentage=missing_pct,
            duplicate_rows=duplicate_rows,
            columns_summary=columns_summary,
        )

    @staticmethod
    def get_univariate(df: pd.DataFrame, column: str) -> UnivariateResult:
        """Compute univariate distribution, descriptive statistics, and frequency distribution for a column."""
        if column not in df.columns:
            raise ValueError(f"Column '{column}' does not exist in dataset.")

        s = df[column]
        total_count = len(s)
        missing_count = int(s.isna().sum())
        missing_pct = (
            round((missing_count / total_count) * 100, 2) if total_count > 0 else 0.0
        )

        is_numeric = bool(pd.api.types.is_numeric_dtype(s))

        if is_numeric:
            clean = s.dropna().astype(float)
            valid_count = len(clean)

            if valid_count == 0:
                # Return empty metrics if all NaN
                boxplot = BoxplotMetrics(
                    min=0.0,
                    q1=0.0,
                    median=0.0,
                    q3=0.0,
                    max=0.0,
                    iqr=0.0,
                    lower_whisker=0.0,
                    upper_whisker=0.0,
                    outlier_count=0,
                )
                numeric_res = UnivariateNumericAnalysis(
                    column=column,
                    count=0,
                    missing_count=missing_count,
                    missing_percentage=missing_pct,
                    mean=0.0,
                    std=0.0,
                    variance=0.0,
                    min=0.0,
                    max=0.0,
                    range=0.0,
                    median=0.0,
                    q25=0.0,
                    q75=0.0,
                    iqr=0.0,
                    skewness=0.0,
                    kurtosis=0.0,
                    histogram=[],
                    boxplot=boxplot,
                )
                return UnivariateResult(
                    column=column, is_numeric=True, numeric_analysis=numeric_res
                )

            mean_val = float(clean.mean())
            std_val = float(clean.std()) if valid_count > 1 else 0.0
            var_val = float(clean.var()) if valid_count > 1 else 0.0
            min_val = float(clean.min())
            max_val = float(clean.max())
            range_val = float(max_val - min_val)
            median_val = float(clean.median())
            q25 = float(clean.quantile(0.25))
            q75 = float(clean.quantile(0.75))
            iqr = float(q75 - q25)

            # Safe skew and kurtosis
            skew_val = 0.0
            kurt_val = 0.0
            if valid_count > 2 and std_val > 0:
                skew_val = float(clean.skew())
                if math.isnan(skew_val):
                    skew_val = 0.0
            if valid_count > 3 and std_val > 0:
                kurt_val = float(clean.kurt())
                if math.isnan(kurt_val):
                    kurt_val = 0.0

            # Boxplot metrics and outliers
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            within_bounds = clean[(clean >= lower_bound) & (clean <= upper_bound)]
            lower_whisker = (
                float(within_bounds.min()) if len(within_bounds) > 0 else min_val
            )
            upper_whisker = (
                float(within_bounds.max()) if len(within_bounds) > 0 else max_val
            )
            outliers = clean[(clean < lower_bound) | (clean > upper_bound)]
            outlier_count = int(len(outliers))

            boxplot = BoxplotMetrics(
                min=min_val,
                q1=q25,
                median=median_val,
                q3=q75,
                max=max_val,
                iqr=iqr,
                lower_whisker=lower_whisker,
                upper_whisker=upper_whisker,
                outlier_count=outlier_count,
            )

            # Histogram bins
            hist_bins: List[HistogramBin] = []
            if min_val == max_val:
                hist_bins.append(
                    HistogramBin(
                        bin_start=min_val,
                        bin_end=max_val,
                        bin_label=f"{min_val:.2f}",
                        count=valid_count,
                        percentage=100.0,
                    )
                )
            else:
                num_bins = min(15, max(6, int(np.sqrt(valid_count))))
                counts, bin_edges = np.histogram(clean, bins=num_bins)
                for i in range(len(counts)):
                    b_start = float(bin_edges[i])
                    b_end = float(bin_edges[i + 1])
                    b_count = int(counts[i])
                    b_pct = (
                        round((b_count / valid_count) * 100, 2)
                        if valid_count > 0
                        else 0.0
                    )
                    hist_bins.append(
                        HistogramBin(
                            bin_start=round(b_start, 2),
                            bin_end=round(b_end, 2),
                            bin_label=f"{b_start:.2f} - {b_end:.2f}",
                            count=b_count,
                            percentage=b_pct,
                        )
                    )

            numeric_res = UnivariateNumericAnalysis(
                column=column,
                count=valid_count,
                missing_count=missing_count,
                missing_percentage=missing_pct,
                mean=round(mean_val, 4),
                std=round(std_val, 4),
                variance=round(var_val, 4),
                min=round(min_val, 4),
                max=round(max_val, 4),
                range=round(range_val, 4),
                median=round(median_val, 4),
                q25=round(q25, 4),
                q75=round(q75, 4),
                iqr=round(iqr, 4),
                skewness=round(skew_val, 4),
                kurtosis=round(kurt_val, 4),
                histogram=hist_bins,
                boxplot=boxplot,
            )
            return UnivariateResult(
                column=column, is_numeric=True, numeric_analysis=numeric_res
            )

        else:
            # Categorical analysis
            clean = s.dropna().astype(str)
            valid_count = len(clean)
            unique_count = int(clean.nunique())
            cardinality_ratio = (
                round(unique_count / valid_count, 4) if valid_count > 0 else 0.0
            )

            val_counts = clean.value_counts().head(50)
            frequencies: List[CategoryFrequency] = []
            for val, count in val_counts.items():
                pct = (
                    round((int(count) / valid_count) * 100, 2)
                    if valid_count > 0
                    else 0.0
                )
                frequencies.append(
                    CategoryFrequency(
                        value=str(val), count=int(count), percentage=pct
                    )
                )

            top_val = frequencies[0].value if frequencies else None
            top_freq = frequencies[0].count if frequencies else None

            cat_res = UnivariateCategoricalAnalysis(
                column=column,
                count=valid_count,
                missing_count=missing_count,
                missing_percentage=missing_pct,
                unique_count=unique_count,
                cardinality_ratio=cardinality_ratio,
                top_value=top_val,
                top_frequency=top_freq,
                frequencies=frequencies,
            )
            return UnivariateResult(
                column=column, is_numeric=False, categorical_analysis=cat_res
            )

    @staticmethod
    def get_correlation_matrix(
        df: pd.DataFrame, method: str = "pearson"
    ) -> CorrelationMatrixResponse:
        """Compute pairwise correlation matrix across all numeric features and list strongest correlations."""
        if method not in ["pearson", "spearman", "kendall"]:
            method = "pearson"

        num_df = df.select_dtypes(include=[np.number])
        cols = [str(c) for c in num_df.columns]

        if len(cols) < 2:
            return CorrelationMatrixResponse(
                method=method,
                columns=cols,
                matrix={c: {c: 1.0} for c in cols},
                strong_correlations=[],
            )

        corr_df = num_df.corr(method=method)

        matrix_dict: Dict[str, Dict[str, Optional[float]]] = {}
        for c1 in cols:
            matrix_dict[c1] = {}
            for c2 in cols:
                val = corr_df.loc[c1, c2]
                matrix_dict[c1][c2] = (
                    round(float(val), 4) if pd.notna(val) else None
                )

        strong_pairs: List[CorrelationPair] = []
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                c1 = cols[i]
                c2 = cols[j]
                val = corr_df.loc[c1, c2]
                if pd.notna(val):
                    r = float(val)
                    abs_r = abs(r)
                    if abs_r >= 0.8:
                        strength = "Very Strong"
                    elif abs_r >= 0.6:
                        strength = "Strong"
                    elif abs_r >= 0.4:
                        strength = "Moderate"
                    else:
                        strength = "Weak"

                    strong_pairs.append(
                        CorrelationPair(
                            feature_a=c1,
                            feature_b=c2,
                            correlation=round(r, 4),
                            strength=strength,
                        )
                    )

        # Sort strong pairs by absolute correlation descending
        strong_pairs.sort(key=lambda p: abs(p.correlation), reverse=True)

        return CorrelationMatrixResponse(
            method=method,
            columns=cols,
            matrix=matrix_dict,
            strong_correlations=strong_pairs,
        )

    @staticmethod
    def get_bivariate(
        df: pd.DataFrame, x_column: str, y_column: str
    ) -> BivariateAnalysisResponse:
        """Compute bivariate relationship: scatter & correlation for numeric pairs,
        group statistics for categorical vs numeric, or contingency matrix for categorical pairs.
        """
        if x_column not in df.columns or y_column not in df.columns:
            raise ValueError(f"Columns '{x_column}' and/or '{y_column}' not found in dataset.")

        x_is_num = pd.api.types.is_numeric_dtype(df[x_column])
        y_is_num = pd.api.types.is_numeric_dtype(df[y_column])

        # Case 1: Numeric vs Numeric
        if x_is_num and y_is_num:
            sub_df = df[[x_column, y_column]].dropna()
            if len(sub_df) < 2:
                return BivariateAnalysisResponse(
                    x_column=x_column,
                    y_column=y_column,
                    relationship_type="numeric_vs_numeric",
                    correlation=0.0,
                    covariance=0.0,
                    sample_points=[],
                    summary="Insufficient data points for numeric correlation.",
                )

            corr_val = float(sub_df[x_column].corr(sub_df[y_column]))
            if math.isnan(corr_val):
                corr_val = 0.0

            cov_val = float(sub_df[x_column].cov(sub_df[y_column]))
            if math.isnan(cov_val):
                cov_val = 0.0

            # Sample up to 500 points for frontend scatter plot
            sample_size = min(len(sub_df), 500)
            sample_df = sub_df.sample(n=sample_size, random_state=42) if len(sub_df) > 500 else sub_df
            points = [
                ScatterPoint(x=round(float(row[0]), 4), y=round(float(row[1]), 4))
                for row in sample_df[[x_column, y_column]].itertuples(index=False)
            ]

            # Qualitative summary
            abs_r = abs(corr_val)
            dir_str = "positive" if corr_val >= 0 else "negative"
            if abs_r >= 0.8:
                qual = f"Very strong {dir_str}"
            elif abs_r >= 0.6:
                qual = f"Strong {dir_str}"
            elif abs_r >= 0.4:
                qual = f"Moderate {dir_str}"
            elif abs_r >= 0.2:
                qual = f"Weak {dir_str}"
            else:
                qual = "Negligible"

            summary = f"{qual} linear relationship (Pearson r = {corr_val:.3f}, Cov = {cov_val:.3f})."

            return BivariateAnalysisResponse(
                x_column=x_column,
                y_column=y_column,
                relationship_type="numeric_vs_numeric",
                correlation=round(corr_val, 4),
                covariance=round(cov_val, 4),
                sample_points=points,
                summary=summary,
            )

        # Case 2: Categorical vs Numeric (or Numeric vs Categorical)
        if (not x_is_num and y_is_num) or (x_is_num and not y_is_num):
            cat_col = x_column if not x_is_num else y_column
            num_col = y_column if y_is_num else x_column

            sub_df = df[[cat_col, num_col]].dropna()
            grouped = sub_df.groupby(cat_col)[num_col]

            stats: List[CategoricalGroupStat] = []
            for cat_name, group in grouped:
                c_len = len(group)
                mean_v = float(group.mean()) if c_len > 0 else None
                median_v = float(group.median()) if c_len > 0 else None
                std_v = float(group.std()) if c_len > 1 else 0.0
                min_v = float(group.min()) if c_len > 0 else None
                max_v = float(group.max()) if c_len > 0 else None

                stats.append(
                    CategoricalGroupStat(
                        category=str(cat_name),
                        count=c_len,
                        mean=round(mean_v, 2) if mean_v is not None else None,
                        median=round(median_v, 2) if median_v is not None else None,
                        std=round(std_v, 2) if std_v is not None else None,
                        min=round(min_v, 2) if min_v is not None else None,
                        max=round(max_v, 2) if max_v is not None else None,
                    )
                )

            # Sort by count descending and take top 25
            stats.sort(key=lambda s: s.count, reverse=True)
            stats = stats[:25]

            summary = f"Categorical breakdown of numeric '{num_col}' across distinct '{cat_col}' groups."

            return BivariateAnalysisResponse(
                x_column=x_column,
                y_column=y_column,
                relationship_type="categorical_vs_numeric",
                group_stats=stats,
                summary=summary,
            )

        # Case 3: Categorical vs Categorical
        sub_df = df[[x_column, y_column]].dropna()
        # Limit to top 15 categories on each axis
        top_x = sub_df[x_column].value_counts().head(12).index
        top_y = sub_df[y_column].value_counts().head(12).index
        filtered_sub = sub_df[
            sub_df[x_column].isin(top_x) & sub_df[y_column].isin(top_y)
        ]

        ct = pd.crosstab(filtered_sub[x_column], filtered_sub[y_column])
        contingency: Dict[str, Dict[str, int]] = {}
        for r_idx in ct.index:
            contingency[str(r_idx)] = {}
            for c_idx in ct.columns:
                contingency[str(r_idx)][str(c_idx)] = int(ct.loc[r_idx, c_idx])

        summary = f"Contingency cross-tabulation across top categories of '{x_column}' and '{y_column}'."

        return BivariateAnalysisResponse(
            x_column=x_column,
            y_column=y_column,
            relationship_type="categorical_vs_categorical",
            contingency_matrix=contingency,
            summary=summary,
        )

    @staticmethod
    def get_groupby(df: pd.DataFrame, req: GroupByRequest) -> GroupByResponse:
        """Compute multi-column dynamic GroupBy with configurable aggregation functions."""
        for col in req.group_by_columns:
            if col not in df.columns:
                raise ValueError(f"GroupBy column '{col}' does not exist.")
        if req.agg_column not in df.columns:
            raise ValueError(f"Aggregation column '{req.agg_column}' does not exist.")

        allowed_aggs = {
            "mean": "mean",
            "sum": "sum",
            "count": "count",
            "std": "std",
            "min": "min",
            "max": "max",
            "median": "median",
        }

        valid_aggs = [a.lower() for a in req.agg_functions if a.lower() in allowed_aggs]
        if not valid_aggs:
            valid_aggs = ["count", "mean"]

        grouped = df.groupby(req.group_by_columns)[req.agg_column].agg(valid_aggs).reset_index()

        # Handle column naming when multiple aggs are run
        if isinstance(grouped.columns, pd.MultiIndex):
            new_cols = []
            for col in grouped.columns:
                if col[0] in req.group_by_columns:
                    new_cols.append(col[0])
                else:
                    new_cols.append(f"{req.agg_column}_{col[1]}")
            grouped.columns = new_cols
        else:
            # Single agg produces simple column names
            cols_renamed = list(req.group_by_columns) + [
                f"{req.agg_column}_{a}" for a in valid_aggs
            ]
            if len(grouped.columns) == len(cols_renamed):
                grouped.columns = cols_renamed

        # Clean NaNs and infs for JSON
        records = df_to_json_records(grouped)
        return GroupByResponse(
            group_by_columns=req.group_by_columns,
            agg_column=req.agg_column,
            metrics=valid_aggs,
            columns=[str(c) for c in grouped.columns],
            rows=records,
            total_groups=len(records),
        )

    @staticmethod
    def get_pivot_table(df: pd.DataFrame, req: PivotTableRequest) -> PivotTableResponse:
        """Compute multi-dimensional pivot table."""
        for col in [req.index_column, req.columns_column, req.values_column]:
            if col not in df.columns:
                raise ValueError(f"Pivot table column '{col}' does not exist in dataset.")

        allowed_aggs = ["mean", "sum", "count", "min", "max"]
        agg = req.agg_func.lower() if req.agg_func.lower() in allowed_aggs else "mean"

        pivot = pd.pivot_table(
            df,
            index=req.index_column,
            columns=req.columns_column,
            values=req.values_column,
            aggfunc=agg,
            fill_value=req.fill_value,
        )

        # Reset index to bring index column into data
        pivot_flat = pivot.reset_index()

        # Format column names cleanly
        flat_columns = [
            str(c) if not isinstance(c, tuple) else "_".join(map(str, c))
            for c in pivot_flat.columns
        ]
        pivot_flat.columns = flat_columns

        records = df_to_json_records(pivot_flat)

        return PivotTableResponse(
            index_column=req.index_column,
            columns_column=req.columns_column,
            values_column=req.values_column,
            agg_func=agg,
            columns=flat_columns,
            rows=records,
            shape=[int(pivot_flat.shape[0]), int(pivot_flat.shape[1])],
        )


eda_engine = EDAEngine()
