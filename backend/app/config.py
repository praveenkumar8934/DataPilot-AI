import os
from pathlib import Path
from typing import List

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "DataPilot AI")
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS settings
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
        ).split(",")
        if origin.strip()
    ]

    # Storage paths
    STORAGE_DIR: Path = BASE_DIR / os.getenv("STORAGE_DIR", "storage")
    DATASETS_DIR: Path = STORAGE_DIR / "datasets"
    METADATA_DIR: Path = STORAGE_DIR / "metadata"

    # Limits
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    MAX_PREVIEW_ROWS: int = int(os.getenv("MAX_PREVIEW_ROWS", "500"))

    # Allowed extensions
    ALLOWED_EXTENSIONS: set = {".csv", ".xlsx", ".xls", ".json"}

    def init_storage(self) -> None:
        """Ensure storage directories exist."""
        self.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
        self.METADATA_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.init_storage()

