# DataPilot AI 🚀

> **Your Intelligent Data Analysis Workspace** — An all-in-one local data platform that brings the power of Pandas, Excel, SQL workspaces, and Power BI-style visual exploration into an intuitive, code-free interface.

[![Python](https://img.shields.io/badge/Python-3.11%2B%20%7C%203.14-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14%20(App%20Router)-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Pytest-50%2F50%20Passing-success.svg?logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents
- [Overview](#overview)
- [Key Features by Phase](#key-features-by-phase)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Running Both Servers](#3-running-both-servers)
- [Sample Data & Demo Database](#sample-data--demo-database)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Security & Architecture Principles](#security--architecture-principles)
- [License](#license)

---

## 🌟 Overview

**DataPilot AI** eliminates the friction between data engineers, analysts, and business stakeholders. Instead of switching between Jupyter Notebooks, Excel spreadsheets, and SQL clients, DataPilot AI gives you a single, secure, local workspace with:
1. Drag-and-drop file imports (CSV, Excel, JSON).
2. Point-and-click Pandas operation engine (30+ transformations).
3. Visual Data Cleaning Studio with undo snapshots and non-destructive versions.
4. Exploratory Data Analysis (EDA) with statistical profiling and correlation heatmaps.
5. Interactive Visualization Studio powered by Recharts with SVG/CSV exports.
6. Enterprise Database Connector for SQLite, PostgreSQL, and MySQL with strict read-only SQL execution.
7. Executive Audit Reports with automated data health scores (0-100) and multi-sheet styled Excel workbooks.

---

## 🎯 Key Features by Phase

```mermaid
flowchart LR
    A[Phase 1: Ingestion] --> B[Phase 2: Pandas Engine]
    B --> C[Phase 3: Cleaning Studio]
    C --> D[Phase 4: EDA Studio]
    D --> E[Phase 5: Visualizations]
    E --> F[Phase 6: SQL & DBs]
    F --> G[Phase 7: Reports & Exports]
```

### 📥 Phase 1: Foundation & Data Import
- Drag-and-drop upload for **CSV**, **Excel (.xlsx, .xls)**, and **JSON** files up to 100 MB.
- Automatic schema extraction: column datatypes, missing counts, null percentages, distinct counts, and sample values.
- High-performance paginated data table with column sorting and global text search.
- Active dataset tracking and metadata persistence in `backend/storage/`.

### ⚙️ Phase 2: Pandas Operation Engine
- **30+ low-code transformations** categorized into 6 modules:
  - *Basic:* Head, Tail, Sorting, Column Renaming, Column Drop, Reordering.
  - *Data Types:* Numeric, datetime, categorical, and boolean casting.
  - *Statistics:* Describe, Kurtosis, Skewness, Quantiles, Variance.
  - *Missing Values:* Drop null rows/columns, Fill with mean/median/mode/constant, Forward/backward fill.
  - *Duplicates:* Identify duplicates, drop duplicate rows, keep first/last.
  - *Unique Analysis:* Distinct counts, unique value extraction, frequency counts.
- 3-panel UI with live execution results, parameter forms, and instant dataframe inspection.

### 🧼 Phase 3: Data Cleaning Studio
- Dedicated cleaning pipeline with **Before & After preview modal** showing affected rows and columns before applying changes.
- **Outlier Detection & Remediation:** Detect outliers via **IQR** (1.5x) or **Z-Score** (3.0x), with capping, median imputation, or row removal.
- **String Sanitization:** Trimming whitespace, lowercase/uppercase/title casing, and special character stripping.
- **In-Memory Snapshot Stack:** Multi-step **Undo** and **Reset to Raw** controls.
- **Non-Destructive Versioning:** Save clean checkpoints (`filename_cleaned_v1.csv`) while preserving original raw data.

### 🔬 Phase 4: Exploratory Data Analysis (EDA)
- **Univariate Analysis:** Detailed numeric distributions (mean, median, std, min, max, IQR, skewness, kurtosis, boxplot metrics, histogram binning) and categorical frequency tables.
- **Correlation Matrix:** Compute **Pearson**, **Spearman**, or **Kendall** correlation matrices with automatic strong correlation pair detection (|r| ≥ 0.7).
- **Bivariate Analysis:** Scatter plot point clouds, category-grouped summary stats, and cross-tabulation contingency matrices.
- **GroupBy & Pivot Studios:** Multi-column aggregations (`mean`, `sum`, `count`, `std`, `min`, `max`) and dynamic 2-dimensional Pivot Tables.

### 📊 Phase 5: Visualization Studio
- **10 Chart Varieties:** Bar, Line, Pie, Donut, Histogram, Scatter, Box, Area, Heatmap, and Correlation Matrix.
- Custom field mapping (X-axis, Y-axis, Group By / Legend), custom aggregations (`sum`, `mean`, `count`, `min`, `max`), sorting, and row limits.
- Conditional filters (equals, contains, greater than, less than).
- Export charts directly to **SVG**, **CSV data**, or **JSON data**.

### 🗄️ Phase 6: Database Connectivity & SQL Workspace
- Enterprise SQLAlchemy connector for **SQLite**, **PostgreSQL**, and **MySQL**.
- Schema introspection listing all tables, column types, and primary key (`[PK]`) markers.
- Parameterized **Read-Only SQL Editor** with query templates (`SELECT *`, `COUNT(*)`, `ORDER BY`), execution latency tracking, and limit selectors.
- Strict security sanitizer blocking non-SELECT queries and mutating DDL/DML statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`).
- **1-Click Table Import:** Imports any remote database table directly into the DataPilot AI active workspace as a full dataset.
- Seeded sample SQLite database included at `backend/storage/sample_sales.db`.

### 📑 Phase 7: Reports & Export Studio
- **Data Quality Health Score (0–100):** Composite score evaluating completeness (40%), uniqueness (35%), and schema validity (25%), with ratings (`Excellent`, `Good`, `Fair`, `Needs Attention`).
- **Multi-Sheet Styled Excel Export:** Built with `openpyxl`:
  - `Data` sheet with styled navy headers, frozen top pane, alternating zebra rows, and auto-adjusted column widths.
  - `Metadata & Overview` sheet with file size, memory, and record counts.
  - `Data Dictionary` sheet with column types, null counts, null %, and distinct counts.
  - `Summary Statistics` sheet with numerical describe tables.
- **Multi-Format Dataset Exporter:** RFC 4180 CSV (custom delimiters and encodings), structured JSON (records, split, index), and Apache Parquet.
- **Executive HTML / PDF Audit Report:** Standalone report with KPI cards, quality status badges (`Good`, `Warning`, `Critical`), actionable recommendations, and `@media print` CSS for 1-click **"Print / Save as PDF"**.

---

## 🏗️ Architecture & Tech Stack

```
DataPilot AI/
├── Frontend (Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts)
│   └── Communicates via REST with:
└── Backend (FastAPI, Python 3.11+, Pandas, NumPy, SQLAlchemy, PyMySQL, OpenPyXL, Pytest)
    └── Manages:
        ├── Local Dataset Storage & Metadata (/backend/storage)
        └── External Databases (SQLite, PostgreSQL, MySQL)
```

| Component | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | Server-rendered & client-optimized React 18 application |
| **Styling** | Tailwind CSS 3.4 | Modern dark/light mode responsive design system |
| **Charts** | Recharts 3.x | High-performance interactive SVG visualization engine |
| **Backend Framework** | FastAPI (ASGI) | Asynchronous, OpenAPI/Swagger-documented Python REST API |
| **Data Engine** | Pandas & NumPy | High-performance DataFrame manipulation & statistics |
| **Excel Engine** | OpenPyXL 3.1 | Multi-sheet styled workbook generation |
| **SQL Engine** | SQLAlchemy 2.0 & PyMySQL | Universal connection pooling & introspection |
| **Testing** | Pytest 8.x & HTTPX | 50 automated backend unit & integration tests |

---

## 📁 Project Structure

```
DataPilot AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── datasets.py          # Phase 1: Upload, preview, list, metadata
│   │   │   ├── operations.py        # Phase 2: Pandas operation catalog & execution
│   │   │   ├── cleaning.py          # Phase 3: Missing, duplicates, outliers, types
│   │   │   ├── analytics.py         # Phase 4: Univariate, bivariate, correlation, pivot
│   │   │   ├── visualization.py     # Phase 5: Recharts data transformer
│   │   │   ├── database.py          # Phase 6: SQLAlchemy connector & read-only SQL
│   │   │   └── exports.py           # Phase 7: Excel, CSV, JSON, Parquet, HTML/PDF
│   │   ├── core/
│   │   │   ├── exceptions.py        # Custom API exception handlers
│   │   │   └── security.py          # Path traversal and input sanitization
│   │   ├── schemas/                 # Pydantic validation models
│   │   │   ├── dataset.py
│   │   │   ├── operations.py
│   │   │   ├── cleaning.py
│   │   │   ├── analytics.py
│   │   │   ├── visualization.py
│   │   │   ├── database.py
│   │   │   └── exports.py
│   │   ├── services/                # Core business logic engines
│   │   │   ├── data_loader.py
│   │   │   ├── dataset_store.py
│   │   │   ├── operation_engine.py
│   │   │   ├── cleaning_engine.py
│   │   │   ├── eda_engine.py
│   │   │   ├── visualization_engine.py
│   │   │   ├── database_engine.py
│   │   │   └── export_engine.py
│   │   ├── utils/
│   │   │   └── helpers.py           # JSON record sanitizer, NaN handling
│   │   ├── config.py                # Environment settings & storage paths
│   │   └── main.py                  # FastAPI entry point, CORS, routers
│   ├── scripts/
│   │   └── seed_sample_db.py        # Demo SQLite database seeder
│   ├── storage/                     # Local data & metadata directory
│   │   ├── connections/             # Saved database descriptors
│   │   ├── datasets/                # Saved CSV/Parquet dataset files
│   │   ├── metadata/                # Active dataset JSON trackers
│   │   └── sample_sales.db          # Pre-seeded SQLite demo database
│   ├── tests/                       # 50 Pytest test suites
│   │   ├── test_datasets.py
│   │   ├── test_sample_data.py
│   │   ├── test_operations.py
│   │   ├── test_cleaning.py
│   │   ├── test_analytics.py
│   │   ├── test_database.py
│   │   └── test_exports.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                         # Next.js 14 App Router pages
│   │   ├── dashboard/page.tsx       # Phase 1: Main metrics & dropzone
│   │   ├── data-sources/page.tsx    # Phase 1: Dataset manager & table
│   │   ├── data-explorer/page.tsx   # Phase 2: 3-panel Pandas studio
│   │   ├── data-cleaning/page.tsx   # Phase 3: Cleaning studio & undo
│   │   ├── eda/page.tsx             # Phase 4: Statistical profiling
│   │   ├── visualization/page.tsx   # Phase 5: Recharts studio
│   │   ├── sql-workspace/page.tsx   # Phase 6: SQL console & connector
│   │   ├── reports/page.tsx         # Phase 7: Health audit & exporter
│   │   ├── settings/page.tsx        # System health & backend status
│   │   └── layout.tsx               # Global shell layout
│   ├── components/                  # Reusable UI component libraries
│   │   ├── charts/                  # Chart renderer, filters, export bar
│   │   ├── dashboard/               # Metric cards, recent uploads
│   │   ├── data-table/              # Virtualized interactive table
│   │   ├── database/                # Connection dialog, schema browser, SQL editor
│   │   ├── eda/                     # Univariate cards, correlation matrix, groupby
│   │   ├── layout/                  # Sidebar navigation, topbar, status pills
│   │   ├── operations/              # Operation selector, dynamic forms
│   │   ├── reports/                 # Health gauge, column audit, export card
│   │   └── ui/                      # Badge, Button, Card, Modal
│   ├── lib/
│   │   ├── api.ts                   # Unified type-safe API client
│   │   └── utils.ts
│   ├── types/                       # TypeScript interfaces for all phases
│   ├── package.json
│   └── tailwind.config.ts
├── sample_data/                     # Ready-to-use demo datasets
│   ├── sales_transactions.csv
│   ├── financial_metrics.xlsx
│   └── customer_churn.json
├── .gitignore                       # Clean Git ignore for Python & Node
├── .env.example                     # Unified environment template
├── requirements.txt                 # Root Python requirements
├── start.bat                        # Windows 1-click launcher
├── start.ps1                        # PowerShell 1-click launcher
├── LICENSE                          # MIT License
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.11+** (Python 3.11, 3.12, 3.13, or 3.14)
- **Node.js 18.17+** or **Node.js 20+**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/datapilot-ai.git
cd datapilot-ai
```

### 2. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# (Optional) Seed the demo SQLite database
python backend/scripts/seed_sample_db.py

# Start FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend is now online at [http://127.0.0.1:8000](http://127.0.0.1:8000) with interactive Swagger documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend is now running at [http://localhost:3000](http://localhost:3000).*

### 4. Windows One-Click Launch
Alternatively, on Windows simply run:
```cmd
start.bat
```
or in PowerShell:
```powershell
.\start.ps1
```
This automatically boots both the FastAPI backend and Next.js frontend in dedicated processes.

---

## 📊 Sample Data & Demo Database

DataPilot AI includes ready-to-test files in the [`sample_data/`](sample_data/) directory:
- `sales_transactions.csv`: Retail transaction records with missing values and regional groupings.
- `financial_metrics.xlsx`: Multi-column quarterly finance metrics.
- `customer_churn.json`: Telco customer churn attributes.
- `backend/storage/sample_sales.db`: Pre-seeded SQLite database with `customers`, `products`, and `orders` tables for testing Phase 6 SQL workflows immediately.

---

## 🌐 API Reference

The backend provides 35+ REST endpoints across 7 modular routers:

| Router | Prefix | Key Endpoints | Description |
|---|---|---|---|
| **Health** | `/api` | `GET /health` | Backend status, version, storage limits |
| **Datasets** | `/api/datasets` | `POST /upload`, `GET /`, `GET /{id}`, `GET /{id}/rows`, `POST /{id}/activate`, `DELETE /{id}` | File ingestion, pagination, sorting |
| **Operations** | `/api/operations` | `GET /catalog`, `POST /execute` | 30+ Pandas transformations |
| **Cleaning** | `/api/cleaning` | `POST /preview`, `POST /apply`, `POST /{id}/undo`, `POST /{id}/reset`, `POST /save-version` | Data cleaning studio & undo snapshot stack |
| **Analytics** | `/api/analytics` | `GET /{id}/overview`, `GET /{id}/univariate`, `GET /{id}/correlation`, `POST /bivariate`, `POST /groupby`, `POST /pivot` | EDA, statistical distributions, pivot tables |
| **Visualization**| `/api/visualization` | `GET /types`, `POST /render` | Chart aggregation & Recharts formatting |
| **Database** | `/api/database` | `POST /test`, `POST /connections`, `GET /connections`, `GET /connections/{id}/schema`, `POST /preview`, `POST /query`, `POST /import-table` | Read-only SQL console & DB connector |
| **Exports** | `/api/exports` | `GET /{id}/report-summary`, `POST /{id}/csv`, `POST /{id}/excel`, `POST /{id}/json`, `POST /{id}/parquet`, `POST /{id}/report-html` | Multi-sheet Excel, CSV, JSON, PDF reports |

Full interactive OpenAPI/Swagger specification is available at `http://127.0.0.1:8000/docs`.

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (50 Tests)
```bash
# Ensure virtual environment is active
pytest backend/tests/ -v
```

All 50 tests pass in ~2 seconds:
```
backend/tests/test_datasets.py ...........                               [ 20%]
backend/tests/test_sample_data.py ...                                    [ 26%]
backend/tests/test_operations.py ..........                              [ 46%]
backend/tests/test_cleaning.py .......                                   [ 60%]
backend/tests/test_analytics.py .....                                    [ 70%]
backend/tests/test_database.py .......                                   [ 84%]
backend/tests/test_exports.py ........                                   [100%]
============================== 50 passed in 2.08s ==============================
```

### Frontend Production Build Verification
```bash
npm --prefix frontend run build
```
Generates 14 optimized static pages with 0 TypeScript and 0 ESLint errors.

---

## 🔒 Security & Architecture Principles

- **Non-Destructive Operations:** Original uploaded raw data files are never overwritten; cleaned datasets and versions are saved as distinct snapshots.
- **Strict Read-Only SQL:** The database executor parses and sanitizes queries, strictly permitting only `SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `EXPLAIN`, and `PRAGMA` statements. All mutating statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, etc.) are actively blocked.
- **Credential Protection:** External database passwords are encrypted on disk and stripped before returning connection configurations to the frontend.
- **Secure File Uploads:** Uploaded filenames are sanitized with UUID identifiers to prevent path traversal attacks; file size limits (100 MB) and extension whitelists (`.csv`, `.xlsx`, `.xls`, `.json`) are enforced.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
