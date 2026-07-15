"""
database.py — SQLAlchemy engine, session factory, and Base declarative class.
Uses psycopg (v3) driver which is compatible with Python 3.14.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from config import settings


# ── Engine ────────────────────────────────────────────────────
engine = create_engine(
    settings.database_url,
    poolclass=NullPool,
    echo=settings.debug,
)

# ── Session factory ───────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# ── Base class for all models ─────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── DB dependency ─────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Test connection ───────────────────────────────────────────
def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[DB] Connection failed: {e}")
        return False
