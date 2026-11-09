"""Seed script: Recreates backend/storage/sample_sales.db with sample e-commerce data."""
from pathlib import Path
import sqlite3

def seed_database():
    storage_dir = Path(__file__).resolve().parent.parent / "storage"
    storage_dir.mkdir(parents=True, exist_ok=True)
    db_path = storage_dir / "sample_sales.db"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        company TEXT,
        email TEXT UNIQUE NOT NULL,
        city TEXT,
        country TEXT NOT NULL,
        lifetime_spend REAL DEFAULT 0.0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit_price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        shipping_city TEXT,
        shipping_country TEXT,
        order_status TEXT NOT NULL,
        total_amount REAL NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
    )
    """)

    cur.execute("SELECT COUNT(*) FROM customers")
    if cur.fetchone()[0] == 0:
        customers = [
            ("Alex", "Morgan", "Apex Tech", "alex.m@apextech.io", "San Francisco", "USA", 4250.00),
            ("Elena", "Rostova", "Starlight Media", "elena@starlight.co", "Berlin", "Germany", 1890.50),
            ("Hiroshi", "Tanaka", "Tanaka Logistics", "hiroshi@tanakalog.jp", "Tokyo", "Japan", 8340.00),
            ("Sophie", "Dubois", "Atelier Paris", "sophie@atelier.fr", "Paris", "France", 2150.75),
            ("Marcus", "Vance", "Vance Capital", "marcus@vancecap.com", "London", "UK", 6720.00),
            ("Priya", "Sharma", "Novus Retail", "priya@novus.in", "Bengaluru", "India", 3490.20),
            ("Mateo", "Silva", "Silva Importadora", "mateo@silva.br", "Sao Paulo", "Brazil", 1240.00),
            ("Chloe", "Bennett", "Bennett Studio", "chloe@bennettstudio.ca", "Toronto", "Canada", 5100.80),
        ]
        cur.executemany("INSERT INTO customers (first_name, last_name, company, email, city, country, lifetime_spend) VALUES (?, ?, ?, ?, ?, ?, ?)", customers)

        products = [
            ("DataPilot Enterprise License", "Software", 1200.00, 999),
            ("Analytics Pro Tier", "Subscription", 299.00, 9999),
            ("Custom Connector Addon", "Software", 450.00, 500),
            ("Dedicated Support SLA", "Services", 1500.00, 50),
            ("ETL High-Throughput Worker", "Compute", 600.00, 150),
            ("Machine Learning Add-on", "AI Models", 850.00, 300),
            ("On-Premise Gateway Appliance", "Hardware", 3200.00, 25),
        ]
        cur.executemany("INSERT INTO products (product_name, category, unit_price, stock_quantity) VALUES (?, ?, ?, ?)", products)

        orders = [
            (1, "2026-01-12", "San Francisco", "USA", "Completed", 1650.00),
            (2, "2026-01-15", "Berlin", "Germany", "Completed", 299.00),
            (3, "2026-01-18", "Tokyo", "Japan", "Completed", 3800.00),
            (4, "2026-02-01", "Paris", "France", "Pending", 749.00),
            (5, "2026-02-05", "London", "UK", "Completed", 2700.00),
            (6, "2026-02-10", "Bengaluru", "India", "Completed", 1450.00),
            (7, "2026-02-14", "Sao Paulo", "Brazil", "Refunded", 450.00),
            (8, "2026-02-20", "Toronto", "Canada", "Completed", 2350.00),
            (1, "2026-02-25", "San Francisco", "USA", "Completed", 2600.00),
            (3, "2026-03-01", "Tokyo", "Japan", "Processing", 4540.00),
        ]
        cur.executemany("INSERT INTO orders (customer_id, order_date, shipping_city, shipping_country, order_status, total_amount) VALUES (?, ?, ?, ?, ?, ?)", orders)

    conn.commit()
    conn.close()
    print(f"Sample SQLite database ready at {db_path}")

if __name__ == "__main__":
    seed_database()

