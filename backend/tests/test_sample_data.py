from pathlib import Path
from fastapi import status

def test_upload_sample_files(client):
    root_dir = Path(__file__).resolve().parent.parent.parent
    sample_dir = root_dir / "sample_data"

    # 1. Test sales_transactions.csv
    csv_path = sample_dir / "sales_transactions.csv"
    assert csv_path.exists(), "sales_transactions.csv should exist"
    with open(csv_path, "rb") as f:
        res = client.post(
            "/api/datasets/upload",
            files={"file": (csv_path.name, f, "text/csv")},
        )
    assert res.status_code == status.HTTP_201_CREATED
    csv_data = res.json()["dataset"]
    assert csv_data["row_count"] == 15
    assert csv_data["column_count"] == 11
    assert csv_data["missing_values_count"] == 5
    csv_id = csv_data["id"]

    # 2. Test customer_churn.json
    json_path = sample_dir / "customer_churn.json"
    assert json_path.exists(), "customer_churn.json should exist"
    with open(json_path, "rb") as f:
        res = client.post(
            "/api/datasets/upload",
            files={"file": (json_path.name, f, "application/json")},
        )
    assert res.status_code == status.HTTP_201_CREATED
    json_data = res.json()["dataset"]
    assert json_data["row_count"] == 5
    assert json_data["column_count"] == 8
    json_id = json_data["id"]

    # 3. Test financial_metrics.xlsx
    excel_path = sample_dir / "financial_metrics.xlsx"
    assert excel_path.exists(), "financial_metrics.xlsx should exist"
    with open(excel_path, "rb") as f:
        res = client.post(
            "/api/datasets/upload",
            files={"file": (excel_path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
    assert res.status_code == status.HTTP_201_CREATED
    excel_data = res.json()["dataset"]
    assert excel_data["row_count"] == 5
    assert excel_data["column_count"] == 5
    excel_id = excel_data["id"]

    # 4. Verify list endpoint contains all 3 datasets
    list_res = client.get("/api/datasets")
    assert list_res.status_code == status.HTTP_200_OK
    dataset_ids = [ds["id"] for ds in list_res.json()]
    assert csv_id in dataset_ids
    assert json_id in dataset_ids
    assert excel_id in dataset_ids

    # 5. Clean up
    for ds_id in [csv_id, json_id, excel_id]:
        client.delete(f"/api/datasets/{ds_id}")
