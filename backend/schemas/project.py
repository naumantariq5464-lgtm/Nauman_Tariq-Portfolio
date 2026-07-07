"""schemas/project.py — Project request/response schemas."""

from pydantic import BaseModel, HttpUrl, field_validator
from datetime import datetime
from typing import Optional, List
from .category import CategoryOut


class ProjectCreate(BaseModel):
    title: str
    category_id: Optional[int] = None
    description: str
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    demo_link: Optional[str] = None
    skills_tags: Optional[str] = None   # comma-separated
    display_order: int = 0
    is_featured: bool = False

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError("Title must be 2–200 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Description must be at least 10 characters")
        return v


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    demo_link: Optional[str] = None
    skills_tags: Optional[str] = None
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None


class ProjectOut(BaseModel):
    id: int
    title: str
    category_id: Optional[int]
    category: Optional[CategoryOut] = None
    description: str
    image_url: Optional[str]
    github_link: Optional[str]
    linkedin_link: Optional[str]
    demo_link: Optional[str]
    skills_tags: Optional[str]
    display_order: int
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    @property
    def tags_list(self) -> List[str]:
        if not self.skills_tags:
            return []
        return [t.strip() for t in self.skills_tags.split(",") if t.strip()]

    model_config = {"from_attributes": True}


class ProjectListOut(BaseModel):
    total: int
    projects: List[ProjectOut]
