"""Export and Reporting Engine: Multi-format dataset exports (CSV, Excel, JSON, Parquet)
and automated executive audit reporting with data health scoring.
"""
from io import BytesIO
import json
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
import pandas as pd

from app.core.exceptions import DatasetNotFoundError
from app.schemas.exports import (
    ColumnAudit,
    CSVExportOptions,
    ExcelExportOptions,
    JSONExportOptions,
    ReportConfig,
    ReportSummaryResponse,
)
from app.services.cleaning_engine import cleaning_engine
from app.services.dataset_store import dataset_store
from app.utils.helpers import sanitize_value


class ExportEngine:
    def __init__(self):
        pass

    def _get_clean_filename(self, original_name: str, ext: str) -> str:
        stem = Path(original_name).stem
        safe_stem = re.sub(r"[^\w\-_\. ]", "_", stem).strip()
        return f"{safe_stem}_export.{ext}"

    def export_csv(self, dataset_id: str, options: CSVExportOptions) -> Tuple[bytes, str]:
        """Export dataset as standard RFC 4180 CSV with custom delimiter and encoding."""
        df = dataset_store.get_dataframe(dataset_id)
        meta = dataset_store.get_metadata(dataset_id)

        delimiter = options.delimiter
        if delimiter == "\\t" or delimiter == "tab":
            delimiter = "\t"

        csv_str = df.to_csv(
            sep=delimiter,
            header=options.include_header,
            index=options.include_index,
            encoding=options.encoding,
        )

        filename = self._get_clean_filename(meta.original_name, "csv")
        return csv_str.encode(options.encoding, errors="replace"), filename

    def export_json(self, dataset_id: str, options: JSONExportOptions) -> Tuple[bytes, str]:
        """Export dataset as structured JSON (records, split, or index)."""
        df = dataset_store.get_dataframe(dataset_id)
        meta = dataset_store.get_metadata(dataset_id)

        orient = options.orient if options.orient in ["records", "split", "index", "columns"] else "records"
        json_str = df.to_json(orient=orient, indent=options.indent, date_format="iso")

        filename = self._get_clean_filename(meta.original_name, "json")
        return json_str.encode("utf-8"), filename

    def export_parquet(self, dataset_id: str) -> Tuple[bytes, str]:
        """Export dataset as Apache Parquet."""
        df = dataset_store.get_dataframe(dataset_id)
        meta = dataset_store.get_metadata(dataset_id)

        try:
            buf = BytesIO()
            df.to_parquet(buf, index=False)
            buf.seek(0)
            filename = self._get_clean_filename(meta.original_name, "parquet")
            return buf.getvalue(), filename
        except Exception as e:
            raise ValueError(f"Parquet export failed: {str(e)}. Try CSV or Excel export.")

    def export_excel(self, dataset_id: str, options: ExcelExportOptions) -> Tuple[bytes, str]:
        """Generate multi-sheet styled Excel workbook using openpyxl."""
        df = dataset_store.get_dataframe(dataset_id)
        meta = dataset_store.get_metadata(dataset_id)

        output = BytesIO()
        wb = openpyxl.Workbook()

        # Sheet 1: Main Data
        ws_data = wb.active
        ws_data.title = options.sheet_name[:31] if options.sheet_name else "Data"

        # Styling constants
        navy_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        regular_font = Font(name="Calibri", size=10)
        thin_border = Border(
            left=Side(style="thin", color="E2E8F0"),
            right=Side(style="thin", color="E2E8F0"),
            top=Side(style="thin", color="E2E8F0"),
            bottom=Side(style="thin", color="E2E8F0"),
        )
        zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

        # Write data headers
        cols = [str(c) for c in df.columns]
        for col_idx, col_name in enumerate(cols, 1):
            cell = ws_data.cell(row=1, column=col_idx, value=col_name)
            cell.fill = navy_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=False)
            cell.border = thin_border

        # Write data rows
        for row_idx, row in enumerate(df.itertuples(index=False), 2):
            is_zebra = (row_idx % 2 == 0)
            for col_idx, val in enumerate(row, 1):
                clean_val = val
                if pd.isna(val):
                    clean_val = ""
                cell = ws_data.cell(row=row_idx, column=col_idx, value=clean_val)
                cell.font = regular_font
                cell.border = thin_border
                if is_zebra:
                    cell.fill = zebra_fill

        # Freeze top row
        ws_data.freeze_panes = "A2"

        # Auto-adjust column widths
        for col in ws_data.columns:
            max_len = max(len(str(cell.value or "")) for cell in col[:100])
            col_letter = get_column_letter(col[0].column)
            ws_data.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 45)

        # Sheet 2: Metadata & Overview
        if options.include_metadata:
            ws_meta = wb.create_sheet(title="Metadata & Overview")
            ws_meta.column_dimensions["A"].width = 24
            ws_meta.column_dimensions["B"].width = 40

            meta_title = ws_meta.cell(row=1, column=1, value="Dataset Overview & Properties")
            meta_title.font = Font(name="Calibri", size=14, bold=True, color="0F172A")
            ws_meta.merge_cells("A1:B1")

            meta_items = [
                ("Dataset ID", meta.id),
                ("Original File Name", meta.original_name),
                ("Total Rows", f"{len(df):,}"),
                ("Total Columns", len(df.columns)),
                ("File Size (KB)", f"{round(meta.file_size_bytes / 1024, 2)} KB"),
                ("Memory Usage (KB)", f"{round(meta.memory_usage_bytes / 1024, 2)} KB"),
                ("Missing Values (Total)", f"{int(df.isna().sum().sum()):,}"),
                ("Duplicate Rows", f"{int(df.duplicated().sum()):,}"),
                ("Generated By", "DataPilot AI - Intelligent Analytics Studio"),
                ("Export Timestamp", time.strftime("%Y-%m-%d %H:%M:%S")),
            ]

            for idx, (label, val) in enumerate(meta_items, 3):
                lbl_cell = ws_meta.cell(row=idx, column=1, value=label)
                lbl_cell.font = Font(name="Calibri", size=10, bold=True)
                lbl_cell.fill = zebra_fill
                lbl_cell.border = thin_border

                val_cell = ws_meta.cell(row=idx, column=2, value=str(val))
                val_cell.font = regular_font
                val_cell.border = thin_border

        # Sheet 3: Data Dictionary
        if options.include_dictionary:
            ws_dict = wb.create_sheet(title="Data Dictionary")
            dict_headers = ["Column Name", "Data Type", "Non-Null Count", "Null Count", "Null %", "Unique Values"]
            for c_idx, h in enumerate(dict_headers, 1):
                c = ws_dict.cell(row=1, column=c_idx, value=h)
                c.fill = navy_fill
                c.font = header_font
                c.border = thin_border

            total_n = len(df)
            for r_idx, col in enumerate(df.columns, 2):
                s = df[col]
                null_c = int(s.isna().sum())
                null_pct = round((null_c / total_n * 100), 2) if total_n > 0 else 0.0
                uniq_c = int(s.nunique())

                row_vals = [str(col), str(s.dtype), total_n - null_c, null_c, f"{null_pct}%", uniq_c]
                for c_idx, val in enumerate(row_vals, 1):
                    c = ws_dict.cell(row=r_idx, column=c_idx, value=val)
                    c.font = regular_font
                    c.border = thin_border
                    if r_idx % 2 == 0:
                        c.fill = zebra_fill

            for col in ws_dict.columns:
                max_len = max(len(str(cell.value or "")) for cell in col[:100])
                ws_dict.column_dimensions[get_column_letter(col[0].column)].width = max(max_len + 3, 14)

        # Sheet 4: Summary Statistics
        if options.include_stats:
            num_cols = df.select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                ws_stats = wb.create_sheet(title="Summary Statistics")
                stats_df = df[num_cols].describe().round(4).reset_index()

                for c_idx, col_name in enumerate(stats_df.columns, 1):
                    c = ws_stats.cell(row=1, column=c_idx, value=str(col_name))
                    c.fill = navy_fill
                    c.font = header_font
                    c.border = thin_border

                for r_idx, row in enumerate(stats_df.itertuples(index=False), 2):
                    for c_idx, val in enumerate(row, 1):
                        c = ws_stats.cell(row=r_idx, column=c_idx, value=val)
                        c.font = regular_font
                        c.border = thin_border
                        if r_idx % 2 == 0:
                            c.fill = zebra_fill

                for col in ws_stats.columns:
                    max_len = max(len(str(cell.value or "")) for cell in col)
                    ws_stats.column_dimensions[get_column_letter(col[0].column)].width = max(max_len + 3, 12)

        wb.save(output)
        output.seek(0)
        filename = self._get_clean_filename(meta.original_name, "xlsx")
        return output.getvalue(), filename

    def generate_report_summary(self, dataset_id: str) -> ReportSummaryResponse:
        """Calculate comprehensive data quality score and audit metrics."""
        df = dataset_store.get_dataframe(dataset_id)
        meta = dataset_store.get_metadata(dataset_id)

        total_rows = len(df)
        total_cols = len(df.columns)
        total_cells = max(1, total_rows * total_cols)

        # Missing cells
        missing_cells = int(df.isna().sum().sum())
        missing_pct = round((missing_cells / total_cells) * 100, 2)

        # Duplicate rows
        duplicate_rows = int(df.duplicated().sum())
        duplicate_pct = round((duplicate_rows / max(1, total_rows)) * 100, 2)

        # Column audits
        col_audits: List[ColumnAudit] = []
        all_null_count = 0
        constant_count = 0

        for col in df.columns:
            s = df[col]
            n_null = int(s.isna().sum())
            null_p = round((n_null / max(1, total_rows)) * 100, 2)
            n_uniq = int(s.nunique(dropna=True))
            uniq_p = round((n_uniq / max(1, total_rows)) * 100, 2)

            is_all_null = (n_null == total_rows)
            is_constant = (n_uniq <= 1 and not is_all_null)

            if is_all_null:
                all_null_count += 1
                status = "critical"
            elif null_p > 40:
                status = "critical"
            elif null_p > 10 or is_constant:
                status = "warning"
            else:
                status = "good"

            if is_constant:
                constant_count += 1

            non_null_samples = [sanitize_value(v) for v in s.dropna().head(3).tolist()]

            col_audits.append(
                ColumnAudit(
                    name=str(col),
                    data_type=str(s.dtype),
                    total_count=total_rows,
                    null_count=n_null,
                    null_percentage=null_p,
                    unique_count=n_uniq,
                    unique_percentage=uniq_p,
                    is_constant=is_constant,
                    is_all_null=is_all_null,
                    quality_status=status,
                    sample_values=non_null_samples,
                )
            )

        # Component scores (0-100)
        completeness = max(0.0, 100.0 - missing_pct)
        uniqueness = max(0.0, 100.0 - duplicate_pct)
        validity = max(0.0, 100.0 - ((all_null_count * 20.0 + constant_count * 10.0) / max(1, total_cols)))
        health_score = int(round(0.40 * completeness + 0.35 * uniqueness + 0.25 * validity))
        health_score = max(0, min(100, health_score))

        if health_score >= 88:
            rating = "Excellent"
        elif health_score >= 72:
            rating = "Good"
        elif health_score >= 50:
            rating = "Fair"
        else:
            rating = "Needs Attention"

        # Actionable recommendations
        recommendations: List[str] = []
        if duplicate_rows > 0:
            recommendations.append(
                f"Found {duplicate_rows:,} duplicate rows ({duplicate_pct}%). Use Data Cleaning Studio to deduplicate records."
            )
        if missing_cells > 0:
            high_null_cols = [c.name for c in col_audits if c.null_percentage > 25]
            if high_null_cols:
                recommendations.append(
                    f"Columns with high missingness (>25%): {', '.join(high_null_cols[:4])}. Consider median/mode imputation or column removal."
                )
        if all_null_count > 0:
            all_null_cols = [c.name for c in col_audits if c.is_all_null]
            recommendations.append(f"Columns completely empty: {', '.join(all_null_cols)}. Safe to drop.")
        if constant_count > 0:
            const_cols = [c.name for c in col_audits if c.is_constant]
            recommendations.append(f"Columns with only 1 distinct value: {', '.join(const_cols[:3])}. Provide zero variance in models.")
        if not recommendations:
            recommendations.append("Dataset passed all quality thresholds with high completeness and uniqueness.")

        # Cleaning history if active
        history: List[Dict[str, Any]] = []
        try:
            session = cleaning_engine.get_session(dataset_id)
            for act in session.action_history:
                history.append(
                    {
                        "action_type": act.action_type,
                        "description": act.description,
                        "timestamp": act.timestamp,
                    }
                )
        except Exception:
            pass

        return ReportSummaryResponse(
            dataset_id=dataset_id,
            dataset_name=meta.original_name,
            created_at=meta.created_at,
            total_rows=total_rows,
            total_columns=total_cols,
            memory_bytes=meta.memory_usage_bytes,
            health_score=health_score,
            quality_rating=rating,
            completeness_score=round(completeness, 1),
            uniqueness_score=round(uniqueness, 1),
            consistency_score=round(validity, 1),
            duplicate_rows=duplicate_rows,
            duplicate_percentage=duplicate_pct,
            missing_cells=missing_cells,
            missing_cells_percentage=missing_pct,
            columns_audit=col_audits,
            cleaning_history=history,
            recommendations=recommendations,
        )

    def generate_html_report(self, dataset_id: str, config: ReportConfig) -> str:
        """Generate high-fidelity self-contained HTML executive report."""
        summary = self.generate_report_summary(dataset_id)
        df = dataset_store.get_dataframe(dataset_id)

        # Prepare summary statistics table for numeric columns
        num_cols = df.select_dtypes(include=[np.number]).columns
        stats_html = ""
        if config.include_summary_stats and len(num_cols) > 0:
            stats_df = df[num_cols].describe().round(2)
            stats_html = stats_df.to_html(classes="styled-table", border=0)

        # Color token by score
        if summary.health_score >= 88:
            score_color = "#10B981"
            score_bg = "#ECFDF5"
        elif summary.health_score >= 70:
            score_color = "#3B82F6"
            score_bg = "#EFF6FF"
        elif summary.health_score >= 50:
            score_color = "#F59E0B"
            score_bg = "#FFFBEB"
        else:
            score_color = "#EF4444"
            score_bg = "#FEF2F2"

        # Column audits rows
        col_rows = ""
        for c in summary.columns_audit:
            badge_class = f"badge-{c.quality_status}"
            samples = ", ".join(str(s) for s in c.sample_values) if c.sample_values else "—"
            col_rows += f"""
            <tr>
                <td><strong>{c.name}</strong></td>
                <td><code>{c.data_type}</code></td>
                <td>{c.null_count:,} ({c.null_percentage}%)</td>
                <td>{c.unique_count:,}</td>
                <td><span class="badge {badge_class}">{c.quality_status.upper()}</span></td>
                <td class="sample-text">{samples}</td>
            </tr>
            """

        # Recommendations list
        rec_html = "".join(f"<li>{r}</li>" for r in summary.recommendations)

        # History list
        history_html = ""
        if config.include_cleaning_history and summary.cleaning_history:
            history_rows = "".join(
                f"<tr><td>{h.get('timestamp','')}</td><td><strong>{h.get('action_type','')}</strong></td><td>{h.get('description','')}</td></tr>"
                for h in summary.cleaning_history
            )
            history_html = f"""
            <div class="section">
                <h2>Data Transformation & Cleaning History</h2>
                <table class="styled-table">
                    <thead><tr><th>Timestamp</th><th>Action</th><th>Description</th></tr></thead>
                    <tbody>{history_rows}</tbody>
                </table>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{config.title} - {summary.dataset_name}</title>
<style>
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background: #f8fafc;
        margin: 0;
        padding: 40px 20px;
    }}
    .container {{
        max-width: 960px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 16px;
        padding: 40px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }}
    .header {{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 24px;
        margin-bottom: 32px;
    }}
    .header h1 {{
        margin: 0 0 6px 0;
        font-size: 24px;
        color: #0f172a;
    }}
    .meta-sub {{
        font-size: 13px;
        color: #64748b;
    }}
    .health-pill {{
        text-align: right;
        background: {score_bg};
        border: 1px solid {score_color}40;
        padding: 12px 20px;
        border-radius: 12px;
    }}
    .health-score {{
        font-size: 32px;
        font-weight: 800;
        color: {score_color};
        line-height: 1;
    }}
    .health-label {{
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: {score_color};
        margin-top: 4px;
    }}
    .kpi-grid {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 32px;
    }}
    .kpi-card {{
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
    }}
    .kpi-card .label {{
        font-size: 11px;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 600;
    }}
    .kpi-card .value {{
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 4px;
    }}
    .section {{
        margin-bottom: 36px;
    }}
    .section h2 {{
        font-size: 16px;
        color: #0f172a;
        margin-bottom: 12px;
        border-left: 4px solid #6366f1;
        padding-left: 10px;
    }}
    .styled-table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin-top: 8px;
    }}
    .styled-table th {{
        background: #f1f5f9;
        color: #475569;
        text-align: left;
        padding: 10px 12px;
        font-weight: 700;
        border-bottom: 1px solid #cbd5e1;
    }}
    .styled-table td {{
        padding: 9px 12px;
        border-bottom: 1px solid #f1f5f9;
    }}
    .styled-table tr:hover {{
        background: #f8fafc;
    }}
    .badge {{
        display: inline-block;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
    }}
    .badge-good {{ background: #ecfdf5; color: #047857; }}
    .badge-warning {{ background: #fffbeb; color: #b45309; }}
    .badge-critical {{ background: #fef2f2; color: #b91c1c; }}
    .sample-text {{
        color: #64748b;
        font-family: monospace;
        font-size: 11px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }}
    .recs-box {{
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        padding: 16px 20px;
    }}
    .recs-box ul {{
        margin: 8px 0 0 18px;
        padding: 0;
        font-size: 13px;
        color: #1e3a8a;
    }}
    .recs-box li {{
        margin-bottom: 6px;
    }}
    .print-btn {{
        background: #6366f1;
        color: #fff;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        float: right;
    }}
    @media print {{
        body {{
            background: #fff;
            padding: 0;
        }}
        .container {{
            box-shadow: none;
            padding: 0;
            max-width: 100%;
        }}
        .print-btn {{
            display: none;
        }}
    }}
</style>
</head>
<body>
<div class="container">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    <div class="header">
        <div>
            <h1>{config.title}</h1>
            <div class="meta-sub">
                Dataset: <strong>{summary.dataset_name}</strong> | Author: <strong>{config.author}</strong> | Date: <strong>{time.strftime("%B %d, %Y")}</strong>
            </div>
        </div>
        <div class="health-pill">
            <div class="health-score">{summary.health_score}/100</div>
            <div class="health-label">{summary.quality_rating}</div>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="label">Total Records</div>
            <div class="value">{summary.total_rows:,}</div>
        </div>
        <div class="kpi-card">
            <div class="label">Total Columns</div>
            <div class="value">{summary.total_columns}</div>
        </div>
        <div class="kpi-card">
            <div class="label">Missing Cells</div>
            <div class="value">{summary.missing_cells:,} ({summary.missing_cells_percentage}%)</div>
        </div>
        <div class="kpi-card">
            <div class="label">Duplicate Rows</div>
            <div class="value">{summary.duplicate_rows:,} ({summary.duplicate_percentage}%)</div>
        </div>
    </div>

    <div class="section">
        <h2>Quality & Hygiene Recommendations</h2>
        <div class="recs-box">
            <ul>{rec_html}</ul>
        </div>
    </div>

    <div class="section">
        <h2>Column Dictionary & Quality Audit</h2>
        <table class="styled-table">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Missing</th>
                    <th>Distinct</th>
                    <th>Status</th>
                    <th>Samples</th>
                </tr>
            </thead>
            <tbody>
                {col_rows}
            </tbody>
        </table>
    </div>

    {f'<div class="section"><h2>Numeric Distribution & Summary Statistics</h2>{stats_html}</div>' if stats_html else ''}

    {history_html}

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Generated by DataPilot AI — Intelligent Data Analysis Workspace & Reporting Engine
    </div>
</div>
</body>
</html>
"""
        return html


export_engine = ExportEngine()
