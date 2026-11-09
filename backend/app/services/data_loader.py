"""DataLoader Service for parsing and inspecting uploaded datasets."""
import io
from pathlib import Path
from typing import Tuple, List, Any
import pandas as pd
import numpy as np

from app.core.exceptions import InvalidFileError, ParsingError
from app.schemas.dataset import ColumnInfo, DatasetMetadata
from app.utils.helpers import format_bytes, sanitize_value

class DataLoader:
    """Handles parsing of CSV, Excel, and JSON files into Pandas DataFrames and generates metadata."""

    @staticmethod
    def load_from_bytes(file_bytes: bytes, filename: str) -> pd.DataFrame:
        """Parse raw file bytes into a Pandas DataFrame based on file extension."""
        if not file_bytes or len(file_bytes) == 0:
            raise InvalidFileError(f"Uploaded file '{filename}' is empty.")

        extension = Path(filename).suffix.lower()

        try:
            if extension == ".csv":
                return DataLoader._parse_csv(file_bytes)
            elif extension in (".xlsx", ".xls"):
                return DataLoader._parse_excel(file_bytes)
            elif extension == ".json":
                return DataLoader._parse_json(file_bytes)
            else:
                raise InvalidFileError(
                    f"Unsupported file format '{extension}'. Supported formats are: .csv, .xlsx, .xls, .json"
                )
        except InvalidFileError:
            raise
        except Exception as e:
            raise ParsingError(f"Failed to parse '{filename}': {str(e)}")

    @staticmethod
    def _parse_csv(file_bytes: bytes) -> pd.DataFrame:
        """Parse CSV bytes trying multiple encodings."""
        encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252", "iso-8859-1"]
        last_error = None

        for encoding in encodings:
            try:
                stream = io.BytesIO(file_bytes)
                df = pd.read_csv(stream, encoding=encoding)
                # Ensure column names are strings
                df.columns = [str(c).strip() for c in df.columns]
                return df
            except Exception as e:
                last_error = e
                continue

        raise ParsingError(f"Unable to decode CSV file with supported encodings. Error: {last_error}")

    @staticmethod
    def _parse_excel(file_bytes: bytes) -> pd.DataFrame:
        """Parse Excel workbook bytes."""
        try:
            stream = io.BytesIO(file_bytes)
            df = pd.read_excel(stream, engine="openpyxl")
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            raise ParsingError(f"Failed to read Excel file: {str(e)}")

    @staticmethod
    def _parse_json(file_bytes: bytes) -> pd.DataFrame:
        """Parse JSON bytes."""
        try:
            stream = io.BytesIO(file_bytes)
            df = pd.read_json(stream)
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            raise ParsingError(f"Failed to read JSON file: {str(e)}")

    @staticmethod
    def extract_metadata(
        dataset_id: str,
        filename: str,
        original_name: str,
        df: pd.DataFrame,
        file_size_bytes: int,
        created_at: str,
        is_active: bool = False,
    ) -> DatasetMetadata:
        """Compute comprehensive metadata from a Pandas DataFrame."""
        row_count = int(len(df))
        col_count = int(len(df.columns))
        extension = Path(original_name).suffix.lower()

        # Missing values
        total_missing = int(df.isna().sum().sum())
        total_cells = row_count * col_count if (row_count > 0 and col_count > 0) else 1
        missing_percentage = round((total_missing / total_cells) * 100, 2)

        # Duplicate rows count
        duplicate_count = int(df.duplicated().sum()) if row_count > 0 else 0

        # Memory usage
        memory_bytes = int(df.memory_usage(deep=True).sum()) if row_count > 0 else 0

        # Column info list
        columns_info: List[ColumnInfo] = []
        for col in df.columns:
            series = df[col]
            col_missing = int(series.isna().sum())
            col_missing_pct = round((col_missing / row_count) * 100, 2) if row_count > 0 else 0.0
            unique_count = int(series.nunique(dropna=True))

            # Sample non-null values
            non_null = series.dropna()
            samples: List[Any] = []
            if len(non_null) > 0:
                sample_count = min(3, len(non_null))
                samples = [sanitize_value(v) for v in non_null.head(sample_count).tolist()]

            columns_info.append(
                ColumnInfo(
                    name=str(col),
                    data_type=str(series.dtype),
                    missing_count=col_missing,
                    missing_percentage=col_missing_pct,
                    unique_count=unique_count,
                    sample_values=samples,
                )
            )

        return DatasetMetadata(
            id=dataset_id,
            filename=filename,
            original_name=original_name,
            file_format=extension.replace(".", "").upper(),
            file_size_bytes=file_size_bytes,
            file_size_formatted=format_bytes(file_size_bytes),
            row_count=row_count,
            column_count=col_count,
            columns=columns_info,
            missing_values_count=total_missing,
            missing_percentage=missing_percentage,
            duplicate_rows_count=duplicate_count,
            memory_usage_bytes=memory_bytes,
            memory_usage_formatted=format_bytes(memory_bytes),
            created_at=created_at,
            updated_at=created_at,
            is_active=is_active,
        )

