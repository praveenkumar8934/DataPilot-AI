from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import HTMLResponse

from app.schemas.exports import (
    CSVExportOptions,
    ExcelExportOptions,
    JSONExportOptions,
    ReportConfig,
    ReportSummaryResponse,
)
from app.services.export_engine import export_engine

router = APIRouter(prefix="/exports", tags=["Reports & Exports (Phase 7)"])


@router.get("/status")
def get_exports_status():
    """Health and status of export and reporting module."""
    return {
        "module": "Reports & Exports",
        "phase": 7,
        "status": "Active",
        "supported_formats": ["csv", "excel", "json", "parquet", "html_report"],
    }


@router.get("/{dataset_id}/report-summary", response_model=ReportSummaryResponse)
def get_dataset_report_summary(dataset_id: str):
    """
    Generate complete dataset audit summary: health score (0-100),
    data completeness, uniqueness, column-by-column quality checks,
    and automated improvement recommendations.
    """
    try:
        return export_engine.generate_report_summary(dataset_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate report summary: {str(e)}",
        )


@router.post("/{dataset_id}/csv")
def export_dataset_csv(dataset_id: str, options: CSVExportOptions = CSVExportOptions()):
    """Export dataset as standard RFC 4180 CSV with custom delimiter, headers, and encoding."""
    try:
        content, filename = export_engine.export_csv(dataset_id, options)
        return Response(
            content=content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV export failed: {str(e)}",
        )


@router.post("/{dataset_id}/excel")
def export_dataset_excel(dataset_id: str, options: ExcelExportOptions = ExcelExportOptions()):
    """Export dataset as formatted multi-sheet Excel workbook with styling and data dictionary."""
    try:
        content, filename = export_engine.export_excel(dataset_id, options)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Excel export failed: {str(e)}",
        )


@router.post("/{dataset_id}/json")
def export_dataset_json(dataset_id: str, options: JSONExportOptions = JSONExportOptions()):
    """Export dataset as structured JSON records or split array."""
    try:
        content, filename = export_engine.export_json(dataset_id, options)
        return Response(
            content=content,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"JSON export failed: {str(e)}",
        )


@router.post("/{dataset_id}/parquet")
def export_dataset_parquet(dataset_id: str):
    """Export dataset as Apache Parquet binary file."""
    try:
        content, filename = export_engine.export_parquet(dataset_id)
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Parquet export failed: {str(e)}",
        )


@router.post("/{dataset_id}/report-html", response_class=HTMLResponse)
def generate_html_audit_report(dataset_id: str, config: ReportConfig = ReportConfig()):
    """Generate self-contained executive HTML report ready for printing or saving as PDF."""
    try:
        html = export_engine.generate_html_report(dataset_id, config)
        return HTMLResponse(content=html)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report generation failed: {str(e)}",
        )
