from fastapi import HTTPException, status

class DatasetNotFoundError(HTTPException):
    def __init__(self, dataset_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset with ID '{dataset_id}' was not found.",
        )

class InvalidFileError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

class FileSizeLimitExceededError(HTTPException):
    def __init__(self, size_bytes: int, max_bytes: int):
        max_mb = max_bytes / (1024 * 1024)
        size_mb = size_bytes / (1024 * 1024)
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file size ({size_mb:.2f} MB) exceeds maximum allowed size ({max_mb:.0f} MB).",
        )

class ParsingError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error parsing dataset file: {message}",
        )

