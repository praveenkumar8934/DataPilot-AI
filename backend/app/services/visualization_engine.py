"""Data Visualization Engine: Prepares, filters, aggregates, and structures live datasets
for interactive rendering of 10 chart types (Bar, Line, Pie, Donut, Histogram, Scatter,
Box, Area, Heatmap, and Correlation Matrix).
"""
import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from app.schemas.visualization import (
    ChartDataResponse,
    ChartFilter,
    ChartRequest,
    ChartTypeInfo,
)
from app.utils.helpers import df_to_json_records, sanitize_value


class VisualizationEngine:
    @staticmethod
    def get_supported_chart_types() -> List[ChartTypeInfo]:
        """Return catalog of available chart types and their configuration requirements."""
        return [
            ChartTypeInfo(
                id="bar",
                name="Bar Chart",
                category="Comparison",
                description="Compare discrete metrics across categorical dimensions.",
                requires_x=True,
                requires_y=True,
                supports_aggregation=True,
                x_types=["categorical", "datetime", "numeric"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="line",
                name="Line Chart",
                category="Trend",
                description="Visualize temporal progressions, sequential series, and continuous trends.",
                requires_x=True,
                requires_y=True,
                supports_aggregation=True,
                x_types=["datetime", "categorical", "numeric"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="area",
                name="Area Chart",
                category="Trend",
                description="Highlight volume and cumulative magnitude over continuous intervals.",
                requires_x=True,
                requires_y=True,
                supports_aggregation=True,
                x_types=["datetime", "categorical", "numeric"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="pie",
                name="Pie Chart",
                category="Part-to-Whole",
                description="Display proportional distribution of a metric across categories.",
                requires_x=True,
                requires_y=False,
                supports_aggregation=True,
                x_types=["categorical"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="donut",
                name="Donut Chart",
                category="Part-to-Whole",
                description="Modern hollowed circular composition displaying category shares.",
                requires_x=True,
                requires_y=False,
                supports_aggregation=True,
                x_types=["categorical"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="histogram",
                name="Histogram",
                category="Distribution",
                description="Examine frequency distribution and density across continuous intervals.",
                requires_x=True,
                requires_y=False,
                supports_aggregation=False,
                x_types=["numeric"],
                y_types=[],
            ),
            ChartTypeInfo(
                id="scatter",
                name="Scatter Plot",
                category="Correlation",
                description="Plot individual observations to identify bivariate correlation and clustering.",
                requires_x=True,
                requires_y=True,
                supports_aggregation=False,
                x_types=["numeric"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="box",
                name="Box Plot",
                category="Distribution",
                description="Display median, quartiles, and outliers across categorical cohorts.",
                requires_x=False,
                requires_y=True,
                supports_aggregation=False,
                x_types=["categorical"],
                y_types=["numeric"],
            ),
            ChartTypeInfo(
                id="heatmap",
                name="Heatmap",
                category="Matrix",
                description="Visualize relationship intensity across two categorical dimensions.",
                requires_x=True,
                requires_y=True,
                supports_aggregation=True,
                x_types=["categorical"],
                y_types=["categorical"],
            ),
            ChartTypeInfo(
                id="correlation_matrix",
                name="Correlation Matrix",
                category="Matrix",
                description="Pairwise correlation heatmap across all numeric variables in the dataset.",
                requires_x=False,
                requires_y=False,
                supports_aggregation=False,
                x_types=["numeric"],
                y_types=["numeric"],
            ),
        ]

    @staticmethod
    def apply_filters(df: pd.DataFrame, filters: List[ChartFilter]) -> pd.DataFrame:
        """Apply conditional row filters to dataset before chart aggregation."""
        if not filters:
            return df

        filtered_df = df.copy()
        for f in filters:
            col = f.column
            if col not in filtered_df.columns:
                continue

            op = f.operator.lower()
            val = f.value

            if op == "is_null":
                filtered_df = filtered_df[filtered_df[col].isna()]
            elif op == "not_null":
                filtered_df = filtered_df[filtered_df[col].notna()]
            elif op == "contains" and val is not None:
                filtered_df = filtered_df[
                    filtered_df[col].astype(str).str.contains(str(val), case=False, na=False)
                ]
            elif val is not None:
                # Handle numeric comparison if column is numeric
                is_num = pd.api.types.is_numeric_dtype(filtered_df[col])
                if is_num:
                    try:
                        num_val = float(val)
                        if op == "equals":
                            filtered_df = filtered_df[filtered_df[col] == num_val]
                        elif op == "not_equals":
                            filtered_df = filtered_df[filtered_df[col] != num_val]
                        elif op == "greater_than":
                            filtered_df = filtered_df[filtered_df[col] > num_val]
                        elif op == "greater_than_or_equal":
                            filtered_df = filtered_df[filtered_df[col] >= num_val]
                        elif op == "less_than":
                            filtered_df = filtered_df[filtered_df[col] < num_val]
                        elif op == "less_than_or_equal":
                            filtered_df = filtered_df[filtered_df[col] <= num_val]
                    except (ValueError, TypeError):
                        pass
                else:
                    str_val = str(val)
                    if op == "equals":
                        filtered_df = filtered_df[filtered_df[col].astype(str) == str_val]
                    elif op == "not_equals":
                        filtered_df = filtered_df[filtered_df[col].astype(str) != str_val]

        return filtered_df

    def prepare_chart(self, df: pd.DataFrame, req: ChartRequest) -> ChartDataResponse:
        """Route to appropriate chart generator based on chart_type."""
        total_raw = len(df)
        working_df = self.apply_filters(df, req.filters)

        chart_type = req.chart_type.lower()
        title = req.title or self._generate_default_title(chart_type, req.x_column, req.y_column)
        x_label = req.x_label or (req.x_column or "Category")
        y_label = req.y_label or (req.y_column or (f"{req.agg_func.capitalize()} of Records" if req.agg_func else "Value"))
        theme = req.color_theme or "indigo"

        if chart_type in ["bar", "line", "area"]:
            return self._prepare_discrete_chart(working_df, req, chart_type, title, x_label, y_label, theme, total_raw)
        elif chart_type in ["pie", "donut"]:
            return self._prepare_pie_chart(working_df, req, chart_type, title, x_label, y_label, theme, total_raw)
        elif chart_type == "histogram":
            return self._prepare_histogram(working_df, req, title, x_label, y_label, theme, total_raw)
        elif chart_type == "scatter":
            return self._prepare_scatter(working_df, req, title, x_label, y_label, theme, total_raw)
        elif chart_type == "box":
            return self._prepare_box(working_df, req, title, x_label, y_label, theme, total_raw)
        elif chart_type == "heatmap":
            return self._prepare_heatmap(working_df, req, title, x_label, y_label, theme, total_raw)
        elif chart_type == "correlation_matrix":
            return self._prepare_correlation_matrix(working_df, req, title, x_label, y_label, theme, total_raw)
        else:
            raise ValueError(f"Unsupported chart type '{req.chart_type}'")

    def _generate_default_title(self, chart_type: str, x_col: Optional[str], y_col: Optional[str]) -> str:
        if x_col and y_col:
            return f"{y_col} by {x_col}"
        elif x_col:
            return f"Distribution of {x_col}"
        elif y_col:
            return f"Overview of {y_col}"
        return f"{chart_type.capitalize()} Chart"

    def _prepare_discrete_chart(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        chart_type: str,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        x_col = req.x_column
        y_col = req.y_column

        if not x_col or x_col not in df.columns:
            raise ValueError(f"X-Axis column '{x_col}' is required and must exist in dataset.")

        agg = (req.agg_func or "sum").lower()
        limit = req.limit or 50

        # Handle aggregation
        if y_col and y_col in df.columns and agg != "none":
            if agg == "count":
                grouped = df.groupby(x_col).size().reset_index(name="value")
            else:
                grouped = df.groupby(x_col)[y_col].agg(agg).reset_index(name="value")
        elif agg == "count":
            grouped = df.groupby(x_col).size().reset_index(name="value")
        elif y_col and y_col in df.columns:
            # No aggregation: take first N rows
            grouped = df[[x_col, y_col]].head(limit).rename(columns={y_col: "value"})
        else:
            grouped = df.groupby(x_col).size().reset_index(name="value")

        # Sorting
        if req.sort_by == "y":
            grouped = grouped.sort_values(by="value", ascending=(req.sort_order == "asc"))
        elif req.sort_by == "x":
            grouped = grouped.sort_values(by=x_col, ascending=(req.sort_order == "asc"))

        grouped = grouped.head(limit)

        data = []
        for row in grouped.itertuples(index=False):
            x_val = str(row[0]) if pd.notna(row[0]) else "Missing"
            y_val = sanitize_value(row[1])
            data.append({
                x_col: x_val,
                "value": y_val if y_val is not None else 0,
            })

        val_series = [d["value"] for d in data if isinstance(d["value"], (int, float))]
        stats = {
            "min": round(float(min(val_series)), 2) if val_series else 0,
            "max": round(float(max(val_series)), 2) if val_series else 0,
            "total": round(float(sum(val_series)), 2) if val_series else 0,
            "count": len(data),
        }

        return ChartDataResponse(
            chart_type=chart_type,
            title=title,
            x_column=x_col,
            y_column=y_col,
            x_label=x_label,
            y_label=y_label,
            data=data,
            series_keys=["value"],
            category_key=x_col,
            color_theme=theme,
            stats=stats,
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Plotted {len(data)} items grouped by '{x_col}'.",
        )

    def _prepare_pie_chart(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        chart_type: str,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        x_col = req.x_column
        y_col = req.y_column
        if not x_col or x_col not in df.columns:
            raise ValueError(f"Category column '{x_col}' is required for {chart_type} chart.")

        agg = (req.agg_func or "sum").lower()
        limit = min(req.limit or 8, 12)  # Pies look best with <= 12 slices

        if y_col and y_col in df.columns and agg != "none" and agg != "count":
            grouped = df.groupby(x_col)[y_col].agg(agg).reset_index(name="value")
        else:
            grouped = df.groupby(x_col).size().reset_index(name="value")

        grouped = grouped.sort_values(by="value", ascending=False)

        top_slice = grouped.head(limit)
        remaining = grouped.iloc[limit:]

        data = []
        for row in top_slice.itertuples(index=False):
            data.append({
                "name": str(row[0]) if pd.notna(row[0]) else "Missing",
                "value": sanitize_value(row[1]) or 0,
            })

        if len(remaining) > 0:
            others_val = float(remaining["value"].sum())
            if others_val > 0:
                data.append({"name": "Other", "value": round(others_val, 2)})

        total_sum = sum(d["value"] for d in data)
        # Compute percentages
        for d in data:
            d["percentage"] = round((d["value"] / total_sum) * 100, 1) if total_sum > 0 else 0

        return ChartDataResponse(
            chart_type=chart_type,
            title=title,
            x_column=x_col,
            y_column=y_col,
            x_label=x_label,
            y_label=y_label,
            data=data,
            series_keys=["value"],
            category_key="name",
            color_theme=theme,
            stats={"total": round(total_sum, 2), "slices": len(data)},
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Proportional breakdown across top {len(data)} slices of '{x_col}'.",
        )

    def _prepare_histogram(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        col = req.x_column or req.y_column
        if not col or col not in df.columns:
            raise ValueError("Numeric target column is required for histogram.")

        clean = df[col].dropna().astype(float)
        if len(clean) == 0:
            return ChartDataResponse(
                chart_type="histogram",
                title=title,
                x_column=col,
                x_label=x_label,
                y_label="Frequency",
                data=[],
                series_keys=["count"],
                category_key="bin",
                color_theme=theme,
                total_records_processed=0,
                total_records_plotted=0,
            )

        num_bins = req.bins or 10
        min_v = float(clean.min())
        max_v = float(clean.max())

        if min_v == max_v:
            data = [{"bin": f"{min_v:.2f}", "count": len(clean), "start": min_v, "end": max_v}]
        else:
            counts, bin_edges = np.histogram(clean, bins=num_bins)
            data = []
            for i in range(len(counts)):
                b_start = round(float(bin_edges[i]), 2)
                b_end = round(float(bin_edges[i + 1]), 2)
                data.append({
                    "bin": f"{b_start} - {b_end}",
                    "count": int(counts[i]),
                    "start": b_start,
                    "end": b_end,
                })

        return ChartDataResponse(
            chart_type="histogram",
            title=title,
            x_column=col,
            x_label=x_label,
            y_label="Frequency",
            data=data,
            series_keys=["count"],
            category_key="bin",
            color_theme=theme,
            stats={"min": min_v, "max": max_v, "mean": round(float(clean.mean()), 2)},
            total_records_processed=len(df),
            total_records_plotted=len(clean),
            summary=f"Histogram density of '{col}' divided into {len(data)} intervals.",
        )

    def _prepare_scatter(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        x_col = req.x_column
        y_col = req.y_column
        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            raise ValueError("Both X-Axis and Y-Axis numeric columns are required for scatter plot.")

        clean = df[[x_col, y_col]].dropna()
        sample_size = min(len(clean), req.limit or 500)
        sample_df = clean.sample(n=sample_size, random_state=42) if len(clean) > sample_size else clean

        data = []
        for row in sample_df.itertuples(index=False):
            data.append({
                "x": round(float(row[0]), 3),
                "y": round(float(row[1]), 3),
            })

        corr = float(clean[x_col].corr(clean[y_col])) if len(clean) > 1 else 0.0
        if math.isnan(corr):
            corr = 0.0

        return ChartDataResponse(
            chart_type="scatter",
            title=title,
            x_column=x_col,
            y_column=y_col,
            x_label=x_label,
            y_label=y_label,
            data=data,
            series_keys=["y"],
            category_key="x",
            color_theme=theme,
            stats={"correlation": round(corr, 3), "samples_plotted": len(data)},
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Scatter distribution across {len(data)} points (Pearson r = {corr:.3f}).",
        )

    def _prepare_box(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        x_col = req.x_column
        y_col = req.y_column or req.x_column
        if not y_col or y_col not in df.columns:
            raise ValueError("Numeric target column is required for box plot.")

        data = []
        if x_col and x_col in df.columns and x_col != y_col:
            # Grouped box plots
            grouped = df[[x_col, y_col]].dropna().groupby(x_col)
            for cat, group in grouped:
                vals = group[y_col].astype(float)
                if len(vals) < 2:
                    continue
                q1 = float(vals.quantile(0.25))
                med = float(vals.median())
                q3 = float(vals.quantile(0.75))
                iqr = q3 - q1
                data.append({
                    "category": str(cat),
                    "min": round(float(vals.min()), 2),
                    "q1": round(q1, 2),
                    "median": round(med, 2),
                    "q3": round(q3, 2),
                    "max": round(float(vals.max()), 2),
                    "lower_whisker": round(max(float(vals.min()), q1 - 1.5 * iqr), 2),
                    "upper_whisker": round(min(float(vals.max()), q3 + 1.5 * iqr), 2),
                    "count": len(vals),
                })
        else:
            # Single box plot
            vals = df[y_col].dropna().astype(float)
            if len(vals) > 0:
                q1 = float(vals.quantile(0.25))
                med = float(vals.median())
                q3 = float(vals.quantile(0.75))
                iqr = q3 - q1
                data.append({
                    "category": str(y_col),
                    "min": round(float(vals.min()), 2),
                    "q1": round(q1, 2),
                    "median": round(med, 2),
                    "q3": round(q3, 2),
                    "max": round(float(vals.max()), 2),
                    "lower_whisker": round(max(float(vals.min()), q1 - 1.5 * iqr), 2),
                    "upper_whisker": round(min(float(vals.max()), q3 + 1.5 * iqr), 2),
                    "count": len(vals),
                })

        return ChartDataResponse(
            chart_type="box",
            title=title,
            x_column=x_col,
            y_column=y_col,
            x_label=x_label,
            y_label=y_label,
            data=data,
            series_keys=["median"],
            category_key="category",
            color_theme=theme,
            stats={"cohorts": len(data)},
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Boxplot quartiles and Tukey bounds across {len(data)} groups.",
        )

    def _prepare_heatmap(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        x_col = req.x_column
        y_col = req.y_column
        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            raise ValueError("Both X-Axis and Y-Axis dimensions are required for heatmap.")

        sub = df[[x_col, y_col]].dropna()
        top_x = sub[x_col].value_counts().head(10).index
        top_y = sub[y_col].value_counts().head(10).index
        filtered = sub[sub[x_col].isin(top_x) & sub[y_col].isin(top_y)]

        ct = pd.crosstab(filtered[y_col], filtered[x_col])

        data = []
        max_val = 0
        min_val = 999999
        for r_name in ct.index:
            row_dict = {"y": str(r_name)}
            for c_name in ct.columns:
                val = int(ct.loc[r_name, c_name])
                row_dict[str(c_name)] = val
                if val > max_val:
                    max_val = val
                if val < min_val:
                    min_val = val
            data.append(row_dict)

        return ChartDataResponse(
            chart_type="heatmap",
            title=title,
            x_column=x_col,
            y_column=y_col,
            x_label=x_label,
            y_label=y_label,
            data=data,
            series_keys=[str(c) for c in ct.columns],
            category_key="y",
            color_theme=theme,
            stats={"min": min_val, "max": max_val},
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Heatmap density across {len(ct.index)}×{len(ct.columns)} intersection matrix.",
        )

    def _prepare_correlation_matrix(
        self,
        df: pd.DataFrame,
        req: ChartRequest,
        title: str,
        x_label: str,
        y_label: str,
        theme: str,
        total_raw: int,
    ) -> ChartDataResponse:
        num_df = df.select_dtypes(include=[np.number])
        cols = [str(c) for c in num_df.columns]

        if len(cols) < 2:
            return ChartDataResponse(
                chart_type="correlation_matrix",
                title=title,
                x_label="Features",
                y_label="Features",
                data=[],
                series_keys=[],
                category_key="feature",
                color_theme=theme,
                total_records_processed=len(df),
                total_records_plotted=0,
                summary="Insufficient numeric features for correlation matrix.",
            )

        corr_df = num_df.corr(method="pearson")
        data = []
        for c1 in cols:
            row_dict = {"feature": c1}
            for c2 in cols:
                val = corr_df.loc[c1, c2]
                row_dict[c2] = round(float(val), 2) if pd.notna(val) else None
            data.append(row_dict)

        return ChartDataResponse(
            chart_type="correlation_matrix",
            title=title,
            x_label="Features",
            y_label="Features",
            data=data,
            series_keys=cols,
            category_key="feature",
            color_theme=theme,
            stats={"features_count": len(cols)},
            total_records_processed=len(df),
            total_records_plotted=len(data),
            summary=f"Pairwise Pearson correlation matrix over {len(cols)} numeric features.",
        )


visualization_engine = VisualizationEngine()
