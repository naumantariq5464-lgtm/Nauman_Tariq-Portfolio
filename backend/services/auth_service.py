"""
services/auth_service.py — JWT creation/verification + bcrypt password hashing.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import settings

# ── bcrypt context ────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password helpers ──────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token helpers ─────────────────────────────────────────────
def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        {"sub": subject, "type": "access"},
        timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        {"sub": subject, "type": "refresh"},
        timedelta(days=settings.jwt_refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: str = "access") -> Optional[str]:
    """
    Decodes a JWT and returns the subject (username) if valid.
    Returns None if token is invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != expected_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None
