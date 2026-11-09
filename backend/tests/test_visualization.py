import io
import pytest
from fastapi import status


@pytest.fixture
def viz_dataset_id(client):
    csv_content = (
        "region,product,sales,quantity,discount\n"
        "North,Laptops,5000.0,5,0.05\n"
        "North,Phones,2500.0,10,0.1\n"
        "South,Laptops,4000.0,4,0.0\n"
        "South,Phones,3000.0,12,0.15\n"
        "East,Laptops,6000.0,6,0.0\n"
        "East,Tablets,1500.0,8,0.2\n"
        "West,Phones,3500.0,14,0.1\n"
        "West,Tablets,2000.0,10,0.05\n"
        "North,Tablets,1800.0,9,0.1\n"
    ).encode("utf-8")

    res = client.post(
        "/api/datasets/upload",
        files={"file": ("viz_sample.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert res.status_code == status.HTTP_201_CREATED
    dataset_id = res.json()["dataset"]["id"]
    yield dataset_id
    client.delete(f"/api/datasets/{dataset_id}")


def test_get_chart_types(client):
    res = client.get("/api/visualization/types")
    assert res.status_code == status.HTTP_200_OK
    types = res.json()
    assert len(types) == 10
    ids = [t["id"] for t in types]
    for expected in [
        "bar",
        "line",
        "pie",
        "donut",
        "histogram",
        "scatter",
        "box",
        "area",
        "heatmap",
        "correlation_matrix",
    ]:
        assert expected in ids


def test_render_bar_chart(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "bar",
        "x_column": "region",
        "y_column": "sales",
        "agg_func": "sum",
        "sort_by": "y",
        "sort_order": "desc",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "bar"
    assert len(data["data"]) == 4  # North, South, East, West
    assert data["stats"]["total"] == 29300.0


def test_render_line_chart(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "line",
        "x_column": "product",
        "y_column": "sales",
        "agg_func": "mean",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "line"
    assert len(data["data"]) == 3  # Laptops, Phones, Tablets


def test_render_pie_and_donut(client, viz_dataset_id):
    for c_type in ["pie", "donut"]:
        req = {
            "dataset_id": viz_dataset_id,
            "chart_type": c_type,
            "x_column": "product",
            "y_column": "sales",
            "agg_func": "sum",
        }
        res = client.post("/api/visualization/render", json=req)
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["chart_type"] == c_type
        assert len(data["data"]) == 3
        assert sum(d["percentage"] for d in data["data"]) >= 99.0


def test_render_histogram(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "histogram",
        "x_column": "sales",
        "bins": 5,
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "histogram"
    assert len(data["data"]) == 5
    assert sum(d["count"] for d in data["data"]) == 9


def test_render_scatter(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "scatter",
        "x_column": "quantity",
        "y_column": "sales",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "scatter"
    assert len(data["data"]) == 9
    assert "correlation" in data["stats"]


def test_render_box(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "box",
        "x_column": "product",
        "y_column": "sales",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "box"
    assert len(data["data"]) == 3


def test_render_heatmap(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "heatmap",
        "x_column": "region",
        "y_column": "product",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "heatmap"
    assert len(data["data"]) == 3  # 3 products


def test_render_correlation_matrix(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "correlation_matrix",
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["chart_type"] == "correlation_matrix"
    assert len(data["data"]) == 3  # sales, quantity, discount


def test_render_with_filters(client, viz_dataset_id):
    req = {
        "dataset_id": viz_dataset_id,
        "chart_type": "bar",
        "x_column": "product",
        "y_column": "sales",
        "agg_func": "sum",
        "filters": [
            {"column": "region", "operator": "equals", "value": "North"},
            {"column": "sales", "operator": "greater_than", "value": 2000.0},
        ],
    }
    res = client.post("/api/visualization/render", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    # In North with sales > 2000: Laptops (5000), Phones (2500)
    assert len(data["data"]) == 2

