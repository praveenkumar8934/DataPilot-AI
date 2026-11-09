from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api import (
    datasets,
    operations,
    cleaning,
    analytics,
    visualization,
    database,
    exports,
)
from app.core.exceptions import (
    DatasetNotFoundError,
    InvalidFileError,
    FileSizeLimitExceededError,
    ParsingError,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure directories exist on startup
    settings.init_storage()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Your Intelligent Data Analysis Workspace - Local Backend API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(DatasetNotFoundError)
async def dataset_not_found_handler(request: Request, exc: DatasetNotFoundError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(InvalidFileError)
async def invalid_file_handler(request: Request, exc: InvalidFileError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(FileSizeLimitExceededError)
async def file_size_handler(request: Request, exc: FileSizeLimitExceededError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(ParsingError)
async def parsing_error_handler(request: Request, exc: ParsingError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

# Health Check
@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for DataPilot AI backend."""
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "storage": {
            "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
            "allowed_extensions": sorted(list(settings.ALLOWED_EXTENSIONS)),
        },
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/api/health",
    }

# Include API Routers
app.include_router(datasets.router, prefix="/api")
app.include_router(operations.router, prefix="/api")
app.include_router(cleaning.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(visualization.router, prefix="/api")
app.include_router(database.router, prefix="/api")
app.include_router(exports.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

