import io
import pytest
from fastapi import status

@pytest.fixture
def sample_dataset_id(client):
    csv_content = (
        "id,name,department,salary,age,is_active\n"
        "1,Alice,Engineering,85000.0,29,True\n"
        "2,Bob,Marketing,62000.0,34,True\n"
        "3,Charlie,Engineering,92000.0,41,False\n"
        "4,Diana,Sales,,30,True\n"
        "5,Evan,Engineering,85000.0,29,True\n"
        "6,Evan,Engineering,85000.0,29,True\n"  # deliberate duplicate row
    ).encode("utf-8")

    res = client.post(
        "/api/datasets/upload",
        files={"file": ("test_ops.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert res.status_code == status.HTTP_201_CREATED
    dataset_id = res.json()["dataset"]["id"]
    yield dataset_id
    client.delete(f"/api/datasets/{dataset_id}")

def test_catalog_endpoint(client):
    res = client.get("/api/operations/catalog")
    assert res.status_code == status.HTTP_200_OK
    categories = res.json()
    cat_ids = [c["id"] for c in categories]
    assert "basic" in cat_ids
    assert "columns" in cat_ids
    assert "statistics" in cat_ids
    assert "missing" in cat_ids
    assert "duplicates" in cat_ids
    assert "unique" in cat_ids

def test_basic_operations(client, sample_dataset_id):
    # head(3)
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "head", "params": {"n": 3}
    })
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["success"] is True
    assert len(data["rows"]) == 3

    # tail(2)
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "tail", "params": {"n": 2}
    })
    assert len(res.json()["rows"]) == 2

    # shape
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "shape", "params": {}
    })
    assert res.json()["data"]["rows"] == 6
    assert res.json()["data"]["columns"] == 6

    # describe
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "describe", "params": {"include": "all"}
    })
    assert res.json()["success"] is True
    assert len(res.json()["rows"]) > 0

    # dtypes
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "dtypes", "params": {}
    })
    assert "salary" in res.json()["data"]

    # size
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "basic", "operation": "size", "params": {}
    })
    assert res.json()["data"] == 36

def test_column_operations(client, sample_dataset_id):
    # select_columns
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "columns", "operation": "select_columns",
        "params": {"columns": ["name", "salary"]}
    })
    assert res.json()["columns"] == ["name", "salary"]

    # filter_records: salary > 80000
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "columns", "operation": "filter_records",
        "params": {"column": "salary", "operator": ">", "value": 80000}
    })
    assert res.json()["success"] is True
    assert len(res.json()["rows"]) == 4

    # sort_values
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "columns", "operation": "sort_values",
        "params": {"column": "age", "ascending": False}
    })
    assert res.json()["rows"][0]["name"] == "Charlie"  # age 41 is oldest

def test_statistical_operations(client, sample_dataset_id):
    # mean of salary
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "statistics", "operation": "mean",
        "params": {"column": "salary"}
    })
    assert res.json()["success"] is True
    assert "salary" in res.json()["data"]
    assert res.json()["data"]["salary"] > 60000

    # count
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "statistics", "operation": "count",
        "params": {"column": "salary"}
    })
    assert res.json()["data"]["salary"] == 5  # 1 missing out of 6

def test_missing_and_duplicates(client, sample_dataset_id):
    # missing_count
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "missing", "operation": "missing_count",
        "params": {"column": "salary"}
    })
    assert res.json()["data"]["salary"] == 1

    # duplicated
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "duplicates", "operation": "duplicated",
        "params": {"subset": ["name", "department", "salary"]}
    })
    assert len(res.json()["rows"]) >= 1

    # unique
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "unique", "operation": "unique",
        "params": {"column": "department"}
    })
    assert set(res.json()["data"]) == {"Engineering", "Marketing", "Sales"}

    # value_counts
    res = client.post("/api/operations/execute", json={
        "dataset_id": sample_dataset_id, "category": "unique", "operation": "value_counts",
        "params": {"column": "department"}
    })
    assert res.json()["success"] is True
    assert len(res.json()["rows"]) == 3

