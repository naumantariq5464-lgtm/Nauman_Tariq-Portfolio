"""schemas/category.py — Category request/response schemas."""

import re
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be 2–100 characters")
        return v

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info) -> str:
        if not v:
            name = info.data.get("name", "")
            return slugify(name)
        return slugify(v)


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}
