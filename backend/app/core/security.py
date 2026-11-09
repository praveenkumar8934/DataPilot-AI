import re
from pathlib import Path

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename to prevent directory traversal or invalid characters on Windows/Linux."""
    # Remove directory separators
    clean_name = Path(filename).name
    # Strip dangerous characters
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    # Ensure not empty
    if not clean_name or clean_name.startswith('.'):
        clean_name = f"dataset_{clean_name}"
    return clean_name

