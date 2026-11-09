import io
import json
import pytest
import pandas as pd
from fastapi import status

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "DataPilot AI"

def test_upload_invalid_extension(client):
    file_content = b"fake binary data"
    response = client.post(
        "/api/datasets/upload",
        files={"file": ("malicious.exe", io.BytesIO(file_content), "application/octet-stream")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not supported" in response.json()["detail"]

def test_upload_empty_file(client):
    response = client.post(
        "/api/datasets/upload",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "empty" in response.json()["detail"]

def test_upload_valid_csv(client):
    csv_content = (
        "id,name,age,salary,department\n"
        "1,Alice,29,75000.0,Engineering\n"
        "2,Bob,,62000.5,Marketing\n"
        "3,Charlie,35,88000.0,Engineering\n"
        "4,Diana,41,,Sales\n"
        "5,Evan,25,54000.0,Finance\n"
    ).encode("utf-8")

    response = client.post(
        "/api/datasets/upload",
        files={"file": ("employees.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["success"] is True

    dataset = data["dataset"]
    assert dataset["original_name"] == "employees.csv"
    assert dataset["row_count"] == 5
    assert dataset["column_count"] == 5
    assert dataset["missing_values_count"] == 2  # age in row 2, salary in row 4
    assert len(dataset["columns"]) == 5

    preview = data["preview"]
    assert len(preview["rows"]) == 5
    assert preview["columns"] == ["id", "name", "age", "salary", "department"]

    # Verify preview API works
    dataset_id = dataset["id"]
    preview_res = client.get(f"/api/datasets/{dataset_id}/preview?page=1&page_size=2")
    assert preview_res.status_code == status.HTTP_200_OK
    preview_data = preview_res.json()
    assert len(preview_data["rows"]) == 2
    assert preview_data["total_rows"] == 5
    assert preview_data["total_pages"] == 3

    # Test sorting
    sorted_res = client.get(f"/api/datasets/{dataset_id}/preview?sort_by=age&sort_order=desc")
    assert sorted_res.status_code == status.HTTP_200_OK
    # Diana is 41, should be first
    first_row = sorted_res.json()["rows"][0]
    assert first_row["name"] == "Diana"

    # Test search filter
    search_res = client.get(f"/api/datasets/{dataset_id}/preview?search=Engineering")
    assert search_res.status_code == status.HTTP_200_OK
    search_data = search_res.json()
    assert len(search_data["rows"]) == 2

    # Clean up test dataset
    del_res = client.delete(f"/api/datasets/{dataset_id}")
    assert del_res.status_code == status.HTTP_200_OK

def test_upload_valid_json(client):
    json_data = [
        {"product": "Laptop", "price": 1200, "in_stock": True},
        {"product": "Keyboard", "price": 75, "in_stock": True},
        {"product": "Monitor", "price": 300, "in_stock": False},
    ]
    raw_json = json.dumps(json_data).encode("utf-8")

    response = client.post(
        "/api/datasets/upload",
        files={"file": ("inventory.json", io.BytesIO(raw_json), "application/json")},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["dataset"]["row_count"] == 3
    assert data["dataset"]["column_count"] == 3

    # Clean up
    dataset_id = data["dataset"]["id"]
    client.delete(f"/api/datasets/{dataset_id}")

def test_upload_valid_excel(client):
    # Generate in-memory Excel workbook using pandas
    df = pd.DataFrame({
        "order_id": [101, 102, 103],
        "customer": ["Acme Corp", "Globex", "Initech"],
        "total": [450.50, 120.00, 990.25]
    })
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine="openpyxl")
    buf.seek(0)

    response = client.post(
        "/api/datasets/upload",
        files={"file": ("orders.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["dataset"]["row_count"] == 3
    assert data["dataset"]["column_count"] == 3

    # Clean up
    dataset_id = data["dataset"]["id"]
    client.delete(f"/api/datasets/{dataset_id}")

