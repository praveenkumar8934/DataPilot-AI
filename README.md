# DataPilot AI

> **Your Intelligent Data Analysis Workspace.**

DataPilot AI is an all-in-one local data analysis platform that brings the functionality of Pandas, Excel, SQL workspaces, and Power BI-style exploration into a modern graphical interface.

---

## Architecture Overview (Phase 1: Foundation & Data Import)

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.11+, FastAPI, Pandas, NumPy, OpenPyXL, Uvicorn, Pytest
- **Storage**: Local filesystem storage (`backend/storage/datasets/` and `backend/storage/metadata/`) with Parquet caching and JSON catalogs

### Repository Structure
```
Data Analysis/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── datasets.py        # Dataset upload, preview, list, metadata, activation, deletion
│   │   │   ├── operations.py      # Pandas operation engine (Phase 2)
│   │   │   ├── cleaning.py        # Data cleaning studio (Phase 3)
│   │   │   ├── analytics.py       # Exploratory data analysis (Phase 4)
│   │   │   ├── visualization.py   # Visualization studio (Phase 5)
│   │   │   ├── database.py        # Database connector (Phase 6)
│   │   │   └── exports.py         # Reporting and exports (Phase 7)
│   │   ├── core/
│   │   │   ├── exceptions.py      # Custom HTTP exceptions
│   │   │   └── security.py        # Path and filename sanitization
│   │   ├── schemas/
│   │   │   └── dataset.py         # Pydantic schemas (Metadata, ColumnInfo, Preview)
│   │   ├── services/
│   │   │   ├── data_loader.py     # Parser for CSV, Excel (.xlsx, .xls), JSON
│   │   │   ├── dataset_store.py   # Local filesystem storage, cache & active dataset
│   │   │   └── ...                # Engines for subsequent phases
│   │   ├── utils/
│   │   │   └── helpers.py         # JSON serialization, format helpers
│   │   ├── config.py              # Environment configuration & limits
│   │   └── main.py                # FastAPI entry point, CORS, exception handlers
│   ├── storage/                   # Local persistent datasets & metadata
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_datasets.py       # Automated pytest suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── dashboard/             # Main dashboard, upload dropzone, stats
│   │   ├── data-sources/          # Comprehensive metadata & interactive data table
│   │   ├── data-explorer/         # 3-panel Pandas operation studio (Phase 2 preview)
│   │   ├── data-cleaning/         # Phase 3 workspace roadmap
│   │   ├── eda/                   # Phase 4 EDA roadmap
│   │   ├── visualization/         # Phase 5 visual studio roadmap
│   │   ├── sql-workspace/         # Phase 6 database connector roadmap
│   │   ├── reports/               # Phase 7 export workspace roadmap
│   │   ├── settings/              # System & backend health status
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/             # Dropzone, StatsOverview, DatasetCards
│   │   ├── data-table/            # Interactive DataTable with sorting, search, pagination
│   │   ├── layout/                # Sidebar, Topbar, AppShell
│   │   └── ui/                    # Button, Card, Badge, Modal
│   ├── context/
│   │   └── dataset-context.tsx    # Global React state for active dataset & backend connectivity
│   ├── lib/
│   │   ├── api.ts                 # Type-safe API client
│   │   └── utils.ts
│   ├── types/
│   │   └── dataset.ts             # TypeScript definitions
│   └── package.json
└── sample_data/
    ├── sales_transactions.csv
    ├── customer_churn.json
    └── financial_metrics.xlsx
```

---

## Windows Installation & Quick Start

### 1. Backend Setup

Open **Terminal 1** (PowerShell or Command Prompt):
```powershell
cd "c:\Users\pk595\Desktop\Data Analysis"

# Activate Python Virtual Environment
.\venv\Scripts\activate

# Verify dependencies (already installed)
pip install -r backend/requirements.txt

# Start FastAPI Backend Server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be running at `http://127.0.0.1:8000`.
- Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup

Open **Terminal 2** (PowerShell or Command Prompt):
```powershell
cd "c:\Users\pk595\Desktop\Data Analysis\frontend"

# Start Next.js Development Server
npm run dev
```
Open your browser to: `http://localhost:3000`

---

## Running Automated Backend Tests

In Terminal 1 (with virtual environment active):
```powershell
pytest backend/tests -v
```
This runs 6 comprehensive automated tests verifying:
1. Backend health check and metadata responses
2. Invalid file extensions rejection
3. Empty file detection and 0-byte rejection
4. CSV upload, row and column parsing, missing value calculation, sorting, and search filtering
5. JSON upload and parsing
6. Excel (.xlsx) parsing using OpenPyXL

