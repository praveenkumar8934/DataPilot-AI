import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add app to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.config import settings

@pytest.fixture(scope="session")
def client():
    # Ensure test directories
    settings.init_storage()
    with TestClient(app) as c:
        yield c

