from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.chat import router as chat_router
from app.api.routes.discovery import router as discovery_router
from app.api.routes.websocket import router as websocket_router
from app.api.deps.services import get_translation_service
from app.core.config import get_settings
from app.core.firebase import get_firestore_client, shutdown_firebase
from app.core.logging import configure_logging, get_logger


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Eager warmup at startup; if credentials are invalid, fail fast.
    get_firestore_client()
    await get_translation_service().preload_common_models()
    try:
        yield
    finally:
        shutdown_firebase()


settings = get_settings()
configure_logging(log_level=settings.log_level, json_output=settings.log_format.lower() == "json")
logger = get_logger(__name__)

app = FastAPI(title=settings.app_name, lifespan=lifespan)

allowed_origins = [origin.strip() for origin in settings.cors_allow_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(discovery_router)
app.include_router(chat_router)
app.include_router(websocket_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"service": settings.app_name, "status": "running"}
