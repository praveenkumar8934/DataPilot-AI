import os
import sqlite3
import pytest
from fastapi import status


@pytest.fixture
def sample_sqlite_db(tmp_path):
    db_file = str(tmp_path / "test_analytics.db")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            balance REAL
        )
    """)
    cursor.execute("""
        CREATE TABLE orders (
            order_id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            amount REAL,
            order_date TEXT
        )
    """)
    cursor.executemany(
        "INSERT INTO customers (id, name, email, balance) VALUES (?, ?, ?, ?)",
        [
            (1, "Alice Smith", "alice@test.org", 1500.50),
            (2, "Bob Jones", "bob@test.org", 820.00),
            (3, "Charlie Brown", "charlie@test.org", 3400.75),
        ],
    )
    cursor.executemany(
        "INSERT INTO orders (order_id, customer_id, amount, order_date) VALUES (?, ?, ?, ?)",
        [
            (101, 1, 250.0, "2024-03-01"),
            (102, 1, 450.0, "2024-03-05"),
            (103, 2, 820.0, "2024-03-10"),
        ],
    )
    conn.commit()
    conn.close()
    return db_file


def test_database_status(client):
    res = client.get("/api/database/status")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] == "Active"
    assert "sqlite" in data["supported_engines"]
    assert data["read_only_enforced"] is True


def test_test_connection_sqlite(client, sample_sqlite_db):
    req = {
        "name": "Test SQLite",
        "db_type": "sqlite",
        "database": sample_sqlite_db,
    }
    res = client.post("/api/database/test", json=req)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["success"] is True
    assert data["server_version"] is not None


def test_save_and_list_connections(client, sample_sqlite_db):
    req = {
        "name": "My Analytics DB",
        "db_type": "sqlite",
        "database": sample_sqlite_db,
    }
    res = client.post("/api/database/connections", json=req)
    assert res.status_code == status.HTTP_200_OK
    conn_data = res.json()
    assert conn_data["name"] == "My Analytics DB"
    conn_id = conn_data["id"]

    # List
    list_res = client.get("/api/database/connections")
    assert list_res.status_code == status.HTTP_200_OK
    conns = list_res.json()
    assert any(c["id"] == conn_id for c in conns)

    # Delete
    del_res = client.delete(f"/api/database/connections/{conn_id}")
    assert del_res.status_code == status.HTTP_200_OK


def test_schema_introspection(client, sample_sqlite_db):
    # Save connection
    req = {
        "name": "Schema Test DB",
        "db_type": "sqlite",
        "database": sample_sqlite_db,
    }
    res = client.post("/api/database/connections", json=req)
    conn_id = res.json()["id"]

    # Introspect
    schema_res = client.get(f"/api/database/connections/{conn_id}/schema")
    assert schema_res.status_code == status.HTTP_200_OK
    schema = schema_res.json()
    table_names = [t["table_name"] for t in schema["tables"]]
    assert "customers" in table_names
    assert "orders" in table_names

    customers_table = next(t for t in schema["tables"] if t["table_name"] == "customers")
    assert customers_table["estimated_row_count"] == 3
    col_names = [c["name"] for c in customers_table["columns"]]
    assert "name" in col_names
    assert "balance" in col_names

    client.delete(f"/api/database/connections/{conn_id}")


def test_table_preview(client, sample_sqlite_db):
    res = client.post(
        "/api/database/connections",
        json={"name": "Preview DB", "db_type": "sqlite", "database": sample_sqlite_db},
    )
    conn_id = res.json()["id"]

    prev_res = client.post(
        "/api/database/preview",
        json={"connection_id": conn_id, "table_name": "customers", "limit": 2},
    )
    assert prev_res.status_code == status.HTTP_200_OK
    preview = prev_res.json()
    assert preview["total_rows"] == 3
    assert len(preview["rows"]) == 2
    assert "Alice Smith" in [r["name"] for r in preview["rows"]]

    client.delete(f"/api/database/connections/{conn_id}")


def test_read_only_query_execution(client, sample_sqlite_db):
    res = client.post(
        "/api/database/connections",
        json={"name": "Query DB", "db_type": "sqlite", "database": sample_sqlite_db},
    )
    conn_id = res.json()["id"]

    # 1. Valid SELECT query with parameter
    q_req = {
        "connection_id": conn_id,
        "query": "SELECT name, balance FROM customers WHERE balance > :min_balance ORDER BY balance DESC",
        "params": {"min_balance": 1000.0},
    }
    q_res = client.post("/api/database/query", json=q_req)
    assert q_res.status_code == status.HTTP_200_OK
    data = q_res.json()
    assert data["row_count"] == 2
    assert data["columns"] == ["name", "balance"]
    assert data["execution_time_ms"] > 0

    # 2. Block mutating statements (DROP TABLE)
    drop_req = {
        "connection_id": conn_id,
        "query": "DROP TABLE customers",
    }
    drop_res = client.post("/api/database/query", json=drop_req)
    assert drop_res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unauthorized SQL statement" in drop_res.json()["detail"]

    # 3. Block mutating statements (INSERT)
    ins_req = {
        "connection_id": conn_id,
        "query": "INSERT INTO customers (id, name) VALUES (4, 'Hacker')",
    }
    ins_res = client.post("/api/database/query", json=ins_req)
    assert ins_res.status_code == status.HTTP_400_BAD_REQUEST

    # 4. Block multi-statement injection
    multi_req = {
        "connection_id": conn_id,
        "query": "SELECT * FROM customers; DROP TABLE orders;",
    }
    multi_res = client.post("/api/database/query", json=multi_req)
    assert multi_res.status_code == status.HTTP_400_BAD_REQUEST

    client.delete(f"/api/database/connections/{conn_id}")


def test_import_table_as_dataset(client, sample_sqlite_db):
    res = client.post(
        "/api/database/connections",
        json={"name": "Import DB", "db_type": "sqlite", "database": sample_sqlite_db},
    )
    conn_id = res.json()["id"]

    imp_res = client.post(
        "/api/database/import-table",
        json={
            "connection_id": conn_id,
            "table_name": "customers",
            "dataset_name": "Imported Customers Table",
        },
    )
    assert imp_res.status_code == status.HTTP_200_OK
    meta = imp_res.json()
    assert meta["row_count"] == 3
    assert meta["column_count"] == 4
    assert meta["original_name"] == "Imported Customers Table"

    # Cleanup dataset & connection
    client.delete(f"/api/datasets/{meta['id']}")
    client.delete(f"/api/database/connections/{conn_id}")

