"""
database.py — SQLAlchemy engine, session factory, and Base declarative class.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from config import settings


# ── Engine ────────────────────────────────────────────────────────────────────
# NullPool used for serverless/Neon PostgreSQL to avoid stale connections
engine = create_engine(
    settings.database_url,
    poolclass=NullPool,
    echo=settings.debug,           # Log SQL in dev, silent in prod
    connect_args={"sslmode": "require"} if settings.is_production else {},
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# ── Base class for all models ─────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency — yields a DB session, always closes it ───────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
