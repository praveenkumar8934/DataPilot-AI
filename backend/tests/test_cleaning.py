import io
import pytest
from fastapi import status

@pytest.fixture
def dirty_dataset_id(client):
    csv_content = (
        "id,customer_name,email,age,income,state\n"
        "1,  John Doe  ,john@example.com,28,50000.0,NY\n"
        "2,Jane Smith,jane@test.org,,65000.0,CA\n"
        "3,Bob Jones,bob@test.org,35,,TX\n"
        "4,Bob Jones,bob@test.org,35,,TX\n"  # duplicate
        "5,Alice Wonder,alice@example.com,19,45000.0,ny\n"  # lowercase state
        "6,Outlier Guy,outlier@test.org,45,950000.0,FL\n"  # extreme income outlier
    ).encode("utf-8")

    res = client.post(
        "/api/datasets/upload",
        files={"file": ("dirty_data.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert res.status_code == status.HTTP_201_CREATED
    dataset_id = res.json()["dataset"]["id"]
    yield dataset_id
    client.delete(f"/api/datasets/{dataset_id}")

def test_detect_missing_values(client, dirty_dataset_id):
    res = client.get(f"/api/cleaning/{dirty_dataset_id}/detect-missing")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_missing_cells"] == 3  # age in row 2, income in rows 3 and 4
    cols = [c["column"] for c in data["columns_with_missing"]]
    assert "age" in cols
    assert "income" in cols

def test_detect_outliers(client, dirty_dataset_id):
    res = client.get(f"/api/cleaning/{dirty_dataset_id}/detect-outliers?method=IQR&threshold=1.5")
    assert res.status_code == status.HTTP_200_OK
    outliers = res.json()
    income_outlier = next((o for o in outliers if o["column"] == "income"), None)
    assert income_outlier is not None
    assert income_outlier["outlier_count"] == 1
    assert 950000.0 in income_outlier["sample_outliers"]

def test_preview_and_apply_cleaning(client, dirty_dataset_id):
    # 1. Preview drop_missing
    prev_res = client.post("/api/cleaning/preview", json={
        "dataset_id": dirty_dataset_id,
        "operation": "drop_missing",
        "params": {"how": "any"}
    })
    assert prev_res.status_code == status.HTTP_200_OK
    prev_data = prev_res.json()
    assert prev_data["rows_before"] == 6
    assert prev_data["rows_after"] == 3
    assert prev_data["rows_affected"] == 3

    # Verify session is still not modified after preview
    sess_res = client.get(f"/api/cleaning/{dirty_dataset_id}/session")
    assert sess_res.json()["is_dirty"] is False
    assert sess_res.json()["can_undo"] is False

    # 2. Apply remove_duplicates with subset
    app_res = client.post("/api/cleaning/apply", json={
        "dataset_id": dirty_dataset_id,
        "operation": "remove_duplicates",
        "params": {"subset": ["customer_name", "email"], "keep": "first"}
    })
    assert app_res.status_code == status.HTTP_200_OK
    assert app_res.json()["can_undo"] is True
    assert app_res.json()["session_state"]["total_rows"] == 5

    # 3. Apply whitespace trim on customer_name
    ws_res = client.post("/api/cleaning/apply", json={
        "dataset_id": dirty_dataset_id,
        "operation": "remove_whitespace",
        "params": {"column": "customer_name"}
    })
    assert ws_res.status_code == status.HTTP_200_OK
    assert ws_res.json()["session_state"]["history"][-1]["operation"] == "remove_whitespace"

    # 4. Apply text standardization (uppercase state)
    case_res = client.post("/api/cleaning/apply", json={
        "dataset_id": dirty_dataset_id,
        "operation": "standardize_text",
        "params": {"column": "state", "case": "upper"}
    })
    assert case_res.status_code == status.HTTP_200_OK

    # 5. Undo last action (standardize_text)
    undo_res = client.post(f"/api/cleaning/{dirty_dataset_id}/undo")
    assert undo_res.status_code == status.HTTP_200_OK
    assert len(undo_res.json()["history"]) == 2  # remove_duplicates + remove_whitespace

    # 6. Save as new version
    save_res = client.post("/api/cleaning/save-version", json={
        "dataset_id": dirty_dataset_id,
        "version_name": "clean_customers_v1.csv"
    })
    assert save_res.status_code == status.HTTP_200_OK
    new_dataset = save_res.json()
    assert new_dataset["original_name"] == "clean_customers_v1.csv"
    assert new_dataset["row_count"] == 5

    # Clean up generated version
    client.delete(f"/api/datasets/{new_dataset['id']}")

def test_outlier_handling(client, dirty_dataset_id):
    # Remove rows with income outliers
    rem_res = client.post("/api/cleaning/apply", json={
        "dataset_id": dirty_dataset_id,
        "operation": "handle_outliers",
        "params": {"column": "income", "method": "IQR", "threshold": 1.5, "action": "remove_rows"}
    })
    assert rem_res.status_code == status.HTTP_200_OK

    # Verify outlier row was removed
    out_res = client.get(f"/api/cleaning/{dirty_dataset_id}/detect-outliers?method=IQR")
    income_out = next((o for o in out_res.json() if o["column"] == "income"), None)
    assert income_out is None or income_out["outlier_count"] == 0
