"""
middleware/auth_middleware.py — JWT authentication dependency for protected routes.
Usage: add `admin: Admin = Depends(get_current_admin)` to any protected endpoint.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.admin import Admin
from services.auth_service import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    """
    Validates Bearer JWT token and returns the Admin object.
    Raises 401 if token is missing, invalid, or expired.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_error

    username = decode_token(credentials.credentials, expected_type="access")
    if not username:
        raise credentials_error

    admin = db.query(Admin).filter(
        Admin.username == username,
        Admin.is_active == True,
    ).first()

    if not admin:
        raise credentials_error

    return admin
