"""
main.py — FastAPI application entry point.
Includes: CORS, rate limiting, security headers, all routers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from routers import auth_router, categories_router, projects_router, contact_router, ai_router

# ── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── FastAPI App ───────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Production-grade portfolio CMS API for Nauman Tariq.",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

# ── Attach rate limiter ───────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Security Headers Middleware ───────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

# ── Include Routers ───────────────────────────────────────────
app.include_router(auth_router,       prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(projects_router,   prefix="/api/v1")
app.include_router(contact_router,    prefix="/api/v1")
app.include_router(ai_router,         prefix="/api/v1")

# ── Health Check ──────────────────────────────────────────────
@app.get("/health", tags=["Health"], summary="Health check")
def health_check():
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}


# ── Root ──────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {"message": f"Welcome to {settings.app_name}"}
