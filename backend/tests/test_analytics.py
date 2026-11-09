import io
import pytest
from fastapi import status


@pytest.fixture
def analytics_dataset_id(client):
    csv_content = (
        "region,category,sales,quantity,discount,profit\n"
        "North,Electronics,1000.0,5,0.1,200.0\n"
        "North,Furniture,500.0,2,0.0,50.0\n"
        "South,Electronics,1500.0,8,0.2,350.0\n"
        "South,Office,200.0,10,0.05,40.0\n"
        "East,Electronics,800.0,4,0.1,160.0\n"
        "East,Furniture,1200.0,6,0.15,180.0\n"
        "West,Office,300.0,12,0.0,60.0\n"
        "West,Electronics,2000.0,10,0.25,500.0\n"
        "North,Office,150.0,5,,25.0\n"  # 1 missing discount
    ).encode("utf-8")

    res = client.post(
        "/api/datasets/upload",
        files={"file": ("analytics_sample.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert res.status_code == status.HTTP_201_CREATED
    dataset_id = res.json()["dataset"]["id"]
    yield dataset_id
    client.delete(f"/api/datasets/{dataset_id}")


def test_eda_overview(client, analytics_dataset_id):
    res = client.get(f"/api/analytics/{analytics_dataset_id}/overview")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_rows"] == 9
    assert data["total_columns"] == 6
    assert "sales" in data["numeric_columns"]
    assert "region" in data["categorical_columns"]
    assert data["total_missing_cells"] == 1
    assert len(data["columns_summary"]) == 6


def test_univariate_numeric(client, analytics_dataset_id):
    res = client.get(f"/api/analytics/{analytics_dataset_id}/univariate?column=sales")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["is_numeric"] is True
    num = data["numeric_analysis"]
    assert num is not None
    assert num["count"] == 9
    assert num["min"] == 150.0
    assert num["max"] == 2000.0
    assert num["mean"] > 0
    assert len(num["histogram"]) > 0
    assert num["boxplot"]["median"] > 0


def test_univariate_categorical(client, analytics_dataset_id):
    res = client.get(f"/api/analytics/{analytics_dataset_id}/univariate?column=region")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["is_numeric"] is False
    cat = data["categorical_analysis"]
    assert cat is not None
    assert cat["count"] == 9
    assert cat["unique_count"] == 4
    regions = [f["value"] for f in cat["frequencies"]]
    assert "North" in regions
    assert "South" in regions


def test_correlation_matrix(client, analytics_dataset_id):
    res = client.get(f"/api/analytics/{analytics_dataset_id}/correlation?method=pearson")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["method"] == "pearson"
    assert "sales" in data["columns"]
    assert "profit" in data["columns"]
    # Diagonal must be 1.0
    assert data["matrix"]["sales"]["sales"] == 1.0
    # Sales and profit should have high positive correlation
    assert data["matrix"]["sales"]["profit"] > 0.8
    assert len(data["strong_correlations"]) > 0


def test_bivariate_numeric(client, analytics_dataset_id):
    req = {
        "dataset_id": analytics_dataset_id,
        "x_column": "sales",
        "y_column": "profit",
    }
    res = client.post("/api/analytics/bivariate", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["relationship_type"] == "numeric_vs_numeric"
    assert data["correlation"] > 0.8
    assert len(data["sample_points"]) > 0


def test_bivariate_categorical_numeric(client, analytics_dataset_id):
    req = {
        "dataset_id": analytics_dataset_id,
        "x_column": "category",
        "y_column": "sales",
    }
    res = client.post("/api/analytics/bivariate", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["relationship_type"] == "categorical_vs_numeric"
    assert len(data["group_stats"]) > 0
    categories = [g["category"] for g in data["group_stats"]]
    assert "Electronics" in categories


def test_bivariate_categorical_categorical(client, analytics_dataset_id):
    req = {
        "dataset_id": analytics_dataset_id,
        "x_column": "region",
        "y_column": "category",
    }
    res = client.post("/api/analytics/bivariate", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["relationship_type"] == "categorical_vs_categorical"
    assert data["contingency_matrix"] is not None
    assert "North" in data["contingency_matrix"]


def test_groupby_analysis(client, analytics_dataset_id):
    req = {
        "dataset_id": analytics_dataset_id,
        "group_by_columns": ["region"],
        "agg_column": "sales",
        "agg_functions": ["mean", "sum", "count"],
    }
    res = client.post("/api/analytics/groupby", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_groups"] == 4  # North, South, East, West
    assert "region" in data["columns"]
    assert "sales_sum" in data["columns"] or any("sum" in c for c in data["columns"])
    assert len(data["rows"]) == 4


def test_pivot_table_analysis(client, analytics_dataset_id):
    req = {
        "dataset_id": analytics_dataset_id,
        "index_column": "region",
        "columns_column": "category",
        "values_column": "sales",
        "agg_func": "sum",
        "fill_value": 0.0,
    }
    res = client.post("/api/analytics/pivot", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "region" in data["columns"]
    assert len(data["rows"]) == 4

