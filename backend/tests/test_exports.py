from io import BytesIO
import json
import pytest
import openpyxl
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def sample_dataset_id():
    """Upload a test dataset for exports testing."""
    csv_content = (
        "id,name,age,salary,department,score\n"
        "1,Alice,29,75000.0,Engineering,92.5\n"
        "2,Bob,34,82000.0,Marketing,88.0\n"
        "3,Charlie,,61000.0,Engineering,79.0\n"
        "4,Diana,41,95000.0,,95.0\n"
        "5,Evan,25,52000.0,Support,71.5\n"
        "1,Alice,29,75000.0,Engineering,92.5\n"  # Exact duplicate row
    )
    files = {"file": ("test_export_data.csv", csv_content.encode("utf-8"), "text/csv")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 201
    return res.json()["dataset"]["id"]


def test_exports_status():
    res = client.get("/api/exports/status")
    assert res.status_code == 200
    data = res.json()
    assert data["module"] == "Reports & Exports"
    assert data["status"] == "Active"
    assert "csv" in data["supported_formats"]
    assert "excel" in data["supported_formats"]


def test_export_csv_default(sample_dataset_id):
    res = client.post(f"/api/exports/{sample_dataset_id}/csv", json={})
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment;" in res.headers["content-disposition"]
    body = res.text
    assert "id,name,age,salary,department,score" in body
    assert "Alice" in body
    assert "Charlie" in body


def test_export_csv_custom_delimiter(sample_dataset_id):
    payload = {
        "delimiter": ";",
        "include_header": True,
        "include_index": False,
    }
    res = client.post(f"/api/exports/{sample_dataset_id}/csv", json=payload)
    assert res.status_code == 200
    body = res.text
    assert "id;name;age;salary;department;score" in body


def test_export_excel_multi_sheet(sample_dataset_id):
    payload = {
        "sheet_name": "Employees",
        "include_metadata": True,
        "include_stats": True,
        "include_dictionary": True,
    }
    res = client.post(f"/api/exports/{sample_dataset_id}/excel", json=payload)
    assert res.status_code == 200
    assert "application/vnd.openxmlformats" in res.headers["content-type"]
    assert ".xlsx" in res.headers["content-disposition"]

    # Validate workbook structure with openpyxl
    wb = openpyxl.load_workbook(BytesIO(res.content))
    sheet_names = wb.sheetnames
    assert "Employees" in sheet_names
    assert "Metadata & Overview" in sheet_names
    assert "Summary Statistics" in sheet_names
    assert "Data Dictionary" in sheet_names

    # Check cell in Employees sheet
    ws = wb["Employees"]
    assert ws["A1"].value == "id"
    assert ws["B1"].value == "name"


def test_export_json_records(sample_dataset_id):
    payload = {"orient": "records", "indent": 2}
    res = client.post(f"/api/exports/{sample_dataset_id}/json", json=payload)
    assert res.status_code == 200
    assert "application/json" in res.headers["content-type"]

    records = json.loads(res.text)
    assert isinstance(records, list)
    assert len(records) == 6
    assert records[0]["name"] == "Alice"


def test_dataset_report_summary(sample_dataset_id):
    res = client.get(f"/api/exports/{sample_dataset_id}/report-summary")
    assert res.status_code == 200
    data = res.json()

    assert data["dataset_id"] == sample_dataset_id
    assert 0 <= data["health_score"] <= 100
    assert data["quality_rating"] in ["Excellent", "Good", "Fair", "Needs Attention"]
    assert data["total_rows"] == 6
    assert data["total_columns"] == 6
    assert data["duplicate_rows"] == 1  # 1 duplicate row Alice
    assert len(data["columns_audit"]) == 6
    assert len(data["recommendations"]) > 0

    # Verify column audit details
    age_col = next(c for c in data["columns_audit"] if c["name"] == "age")
    assert age_col["null_count"] == 1


def test_generate_html_report(sample_dataset_id):
    payload = {
        "title": "Corporate Audit Report",
        "author": "Chief Data Officer",
        "include_summary_stats": True,
        "include_quality_audit": True,
    }
    res = client.post(f"/api/exports/{sample_dataset_id}/report-html", json=payload)
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    html = res.text
    assert "<!DOCTYPE html>" in html
    assert "Corporate Audit Report" in html
    assert "Chief Data Officer" in html
    assert "Column Dictionary &amp; Quality Audit" in html or "Column Dictionary & Quality Audit" in html


def test_export_nonexistent_dataset():
    res = client.get("/api/exports/invalid-uuid-1234/report-summary")
    assert res.status_code in [400, 404]
