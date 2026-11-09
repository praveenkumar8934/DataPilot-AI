"""DatasetStore Service: Manages persistence, active dataset tracking, and in-memory caching."""
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd

from app.config import settings
from app.core.exceptions import DatasetNotFoundError
from app.core.security import sanitize_filename
from app.schemas.dataset import DatasetMetadata, DatasetSummary

class DatasetStore:
    def __init__(self):
        self._cache: Dict[str, pd.DataFrame] = {}
        self._active_id_file: Path = settings.METADATA_DIR / "active_dataset.json"

    def _get_active_id(self) -> Optional[str]:
        if self._active_id_file.exists():
            try:
                data = json.loads(self._active_id_file.read_text(encoding="utf-8"))
                return data.get("active_id")
            except Exception:
                return None
        return None

    def set_active_id(self, dataset_id: Optional[str]) -> None:
        try:
            self._active_id_file.write_text(
                json.dumps({"active_id": dataset_id}, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            print(f"Error persisting active dataset ID: {e}")

    def save_dataset(
        self,
        dataset_id: str,
        filename: str,
        original_name: str,
        df: pd.DataFrame,
        raw_bytes: bytes,
    ) -> DatasetMetadata:
        """Persist raw file, save parquet for high-speed reads, save metadata JSON, and cache in memory."""
        now_str = datetime.now(timezone.utc).isoformat()
        clean_name = sanitize_filename(original_name)

        # 1. Save raw file
        raw_path = settings.DATASETS_DIR / f"{dataset_id}_{clean_name}"
        raw_path.write_bytes(raw_bytes)

        # 2. Save optimized parquet for instant loads
        parquet_path = settings.DATASETS_DIR / f"{dataset_id}.parquet"
        try:
            # Convert any mixed object columns to strings if needed for parquet
            clean_df = df.copy()
            clean_df.columns = [str(c) for c in clean_df.columns]
            clean_df.to_parquet(parquet_path, index=False)
        except Exception:
            # Fallback to feather or CSV if parquet engine complains
            csv_path = settings.DATASETS_DIR / f"{dataset_id}.csv"
            df.to_csv(csv_path, index=False)

        # 3. If there is no active dataset, make this one active
        current_active = self._get_active_id()
        is_active = False
        if not current_active:
            self.set_active_id(dataset_id)
            is_active = True
        elif current_active == dataset_id:
            is_active = True

        # 4. Generate & save metadata
        from app.services.data_loader import DataLoader
        metadata = DataLoader.extract_metadata(
            dataset_id=dataset_id,
            filename=f"{dataset_id}_{clean_name}",
            original_name=original_name,
            df=df,
            file_size_bytes=len(raw_bytes),
            created_at=now_str,
            is_active=is_active,
        )

        meta_path = settings.METADATA_DIR / f"{dataset_id}.json"
        meta_path.write_text(metadata.model_dump_json(indent=2), encoding="utf-8")

        # 5. Cache dataframe
        self._cache[dataset_id] = df

        return metadata

    def get_metadata(self, dataset_id: str) -> DatasetMetadata:
        meta_path = settings.METADATA_DIR / f"{dataset_id}.json"
        if not meta_path.exists():
            raise DatasetNotFoundError(dataset_id)
        try:
            data = json.loads(meta_path.read_text(encoding="utf-8"))
            active_id = self._get_active_id()
            data["is_active"] = (dataset_id == active_id)
            return DatasetMetadata(**data)
        except Exception as e:
            raise DatasetNotFoundError(dataset_id)

    def get_dataframe(self, dataset_id: str) -> pd.DataFrame:
        """Return dataframe from in-memory cache or load from disk."""
        if dataset_id in self._cache:
            return self._cache[dataset_id]

        parquet_path = settings.DATASETS_DIR / f"{dataset_id}.parquet"
        csv_path = settings.DATASETS_DIR / f"{dataset_id}.csv"

        if parquet_path.exists():
            try:
                df = pd.read_parquet(parquet_path)
                self._cache[dataset_id] = df
                return df
            except Exception:
                pass

        if csv_path.exists():
            df = pd.read_csv(csv_path)
            self._cache[dataset_id] = df
            return df

        # Try raw file lookup
        meta = self.get_metadata(dataset_id)
        raw_path = settings.DATASETS_DIR / meta.filename
        if raw_path.exists():
            from app.services.data_loader import DataLoader
            df = DataLoader.load_from_bytes(raw_path.read_bytes(), meta.original_name)
            self._cache[dataset_id] = df
            return df

        raise DatasetNotFoundError(dataset_id)

    def list_datasets(self) -> List[DatasetSummary]:
        """List all datasets in storage ordered by creation time descending."""
        active_id = self._get_active_id()
        summaries: List[DatasetSummary] = []

        for meta_file in settings.METADATA_DIR.glob("*.json"):
            if meta_file.name == "active_dataset.json":
                continue
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                dataset_id = data.get("id")
                summaries.append(
                    DatasetSummary(
                        id=dataset_id,
                        filename=data.get("filename", ""),
                        original_name=data.get("original_name", ""),
                        file_format=data.get("file_format", "CSV"),
                        file_size_formatted=data.get("file_size_formatted", "0 B"),
                        row_count=data.get("row_count", 0),
                        column_count=data.get("column_count", 0),
                        missing_values_count=data.get("missing_values_count", 0),
                        duplicate_rows_count=data.get("duplicate_rows_count", 0),
                        created_at=data.get("created_at", ""),
                        is_active=(dataset_id == active_id),
                    )
                )
            except Exception:
                continue

        # Sort by creation time descending
        summaries.sort(key=lambda s: s.created_at, reverse=True)
        return summaries

    def get_active_dataset(self) -> Optional[DatasetMetadata]:
        active_id = self._get_active_id()
        if not active_id:
            # Default to the most recent dataset if available
            all_datasets = self.list_datasets()
            if all_datasets:
                active_id = all_datasets[0].id
                self.set_active_id(active_id)
            else:
                return None

        try:
            return self.get_metadata(active_id)
        except DatasetNotFoundError:
            self.set_active_id(None)
            return None

    def activate_dataset(self, dataset_id: str) -> DatasetMetadata:
        meta = self.get_metadata(dataset_id)
        self.set_active_id(dataset_id)
        meta.is_active = True
        return meta

    def delete_dataset(self, dataset_id: str) -> bool:
        meta_path = settings.METADATA_DIR / f"{dataset_id}.json"
        if not meta_path.exists():
            raise DatasetNotFoundError(dataset_id)

        try:
            data = json.loads(meta_path.read_text(encoding="utf-8"))
            filename = data.get("filename")
            if filename:
                raw_path = settings.DATASETS_DIR / filename
                if raw_path.exists():
                    raw_path.unlink()
        except Exception:
            pass

        # Remove parquet/csv
        for path in [
            settings.DATASETS_DIR / f"{dataset_id}.parquet",
            settings.DATASETS_DIR / f"{dataset_id}.csv",
            meta_path,
        ]:
            if path.exists():
                path.unlink()

        # Remove from cache
        self._cache.pop(dataset_id, None)

        # Clear active if this was active
        if self._get_active_id() == dataset_id:
            self.set_active_id(None)

        return True

dataset_store = DatasetStore()

