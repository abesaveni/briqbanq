"""
BrickBanq Backend — Main Application Entry Point

FastAPI modular monolith for regulated financial workflow platform.
Manages case lifecycle, document verification, auctions, bidding,
escrow, wallet, contract signing, settlement, and audit logging.
"""

import uuid
import pathlib
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import BrickBanqException
from app.infrastructure.database import init_db, close_db
from app.infrastructure.redis import redis_client


# ─── Structured Logging Setup ────────────────────────────────────────────────

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        structlog.get_config()["wrapper_class"]._min_level
        if hasattr(structlog.get_config().get("wrapper_class", object), "_min_level")
        else 0
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


# ─── Application Lifespan ────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    logger.info("starting_application", app_name=settings.app_name, env=settings.app_env)

    # Initialize database
    await init_db()
    logger.info("database_initialized")

    # Connect Redis
    try:
        await redis_client.connect()
        logger.info("redis_connected")
    except Exception as e:
        logger.warning("redis_connection_failed", error=str(e))

    yield

    # Shutdown
    logger.info("shutting_down_application")
    await close_db()
    await redis_client.disconnect()
    logger.info("application_shutdown_complete")


# ─── FastAPI Application ─────────────────────────────────────────────────────

app = FastAPI(
    title="BrickBanq API",
    description=(
        "Regulated financial workflow platform for Mortgage-in-Possession (MIP) cases. "
        "Manages case lifecycle, document verification, auctions, bidding, escrow, "
        "wallet balances, contract signing, settlement, and audit logging."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    redirect_slashes=False,
)





# ─── Global Exception Handler ────────────────────────────────────────────────

@app.exception_handler(BrickBanqException)
async def brickbanq_exception_handler(request: Request, exc: BrickBanqException):
    """Standardized error response for all BrickBanq exceptions."""
    trace_id = request.headers.get("x-trace-id", str(uuid.uuid4()))

    logger.error(
        "application_error",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        trace_id=trace_id,
        path=str(request.url),
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "trace_id": trace_id,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions. No raw tracebacks in production."""
    trace_id = request.headers.get("x-trace-id", str(uuid.uuid4()))

    logger.error(
        "unhandled_error",
        error=str(exc),
        trace_id=trace_id,
        path=str(request.url),
    )

    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "An internal error occurred" if not settings.debug else str(exc),
            "trace_id": trace_id,
        },
    )

# ─── Request Tracing Middleware ───────────────────────────────────────────────

@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    """Inject trace_id into every request for audit trail."""
    trace_id = request.headers.get("x-trace-id", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(trace_id=trace_id)

    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    return response


# ─── CORS Middleware (added before routes so it wraps everything) ─────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include API Routes ──────────────────────────────────────────────────────

app.include_router(api_router)

# ─── Serve uploaded files as static assets ───────────────────────────────────
_uploads_dir = pathlib.Path(__file__).parent.parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Application health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "application": "BrickBanq API",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else "Disabled in production",
    }
