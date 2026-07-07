"""
routers/auth.py — Admin login and token refresh endpoints.
Rate limited to 5 requests per 15 minutes per IP.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models.admin import Admin
from schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from services.auth_service import (
    verify_password, create_access_token,
    create_refresh_token, decode_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse, summary="Admin Login")
@limiter.limit("5/15minutes")
async def login(
    request: Request,
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate admin and return JWT access + refresh tokens.
    Rate limited: 5 attempts per 15 minutes per IP.
    """
    admin = db.query(Admin).filter(Admin.username == body.username).first()

    # Always check password (even if admin not found) to prevent timing attacks
    if not admin or not verify_password(body.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    # Update last login timestamp
    admin.last_login = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(
        access_token=create_access_token(admin.username),
        refresh_token=create_refresh_token(admin.username),
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh Access Token")
async def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    username = decode_token(body.refresh_token, expected_type="refresh")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    admin = db.query(Admin).filter(
        Admin.username == username,
        Admin.is_active == True,
    ).first()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account not found or disabled",
        )

    return TokenResponse(
        access_token=create_access_token(username),
        refresh_token=create_refresh_token(username),
    )
