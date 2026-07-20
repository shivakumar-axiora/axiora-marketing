"""Axiora WhatsApp Marketing — FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

limiter = Limiter(key_func=get_remote_address, default_limits=["600/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For SQLite/dev we create tables automatically; production uses Alembic migrations.
    if settings.DATABASE_URL.startswith("sqlite"):
        import app.models  # noqa: F401  ensure metadata is populated

        Base.metadata.create_all(bind=engine)
    if settings.STORAGE_BACKEND == "local":
        Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    description="Official WhatsApp Business Platform marketing automation API.",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.getLogger("axiora").exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Static media (only relevant for the local storage backend; S3 URLs are served
# directly from the bucket/CDN and never touch this app).
if settings.STORAGE_BACKEND == "local":
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "version": "1.0.0", "docs": "/docs"}
