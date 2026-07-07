"""Initial schema — admins, categories, projects, messages

Revision ID: 001
Revises: 
Create Date: 2026-07-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── admins ────────────────────────────────────────────────
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_admins_username", "admins", ["username"])

    # ── categories ────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"])

    # ── projects ──────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("image_public_id", sa.String(200), nullable=True),
        sa.Column("github_link", sa.String(500), nullable=True),
        sa.Column("linkedin_link", sa.String(500), nullable=True),
        sa.Column("demo_link", sa.String(500), nullable=True),
        sa.Column("skills_tags", sa.String(500), nullable=True),
        sa.Column("display_order", sa.Integer, default=0, nullable=False),
        sa.Column("is_featured", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # ── messages ──────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("projects")
    op.drop_index("ix_categories_slug", "categories")
    op.drop_table("categories")
    op.drop_index("ix_admins_username", "admins")
    op.drop_table("admins")
