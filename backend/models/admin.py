"""
models/admin.py — Admin user model (only Nauman can log in).
Password is stored as bcrypt hash — never plaintext.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class Admin(Base):
    __tablename__ = "admins"

    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Admin id={self.id} username={self.username}>"
