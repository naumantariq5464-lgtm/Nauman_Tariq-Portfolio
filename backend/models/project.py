"""
models/project.py — Project model.
Images stored on Cloudinary; only the URL is saved in DB.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String(200), nullable=False)
    category_id     = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    description     = Column(Text, nullable=False)
    image_url       = Column(String(500), nullable=True)      # Cloudinary URL
    image_public_id = Column(String(200), nullable=True)      # Cloudinary public_id for deletion
    github_link     = Column(String(500), nullable=True)
    linkedin_link   = Column(String(500), nullable=True)
    demo_link       = Column(String(500), nullable=True)
    skills_tags     = Column(String(500), nullable=True)      # Comma-separated e.g. "Python,FastAPI,React"
    display_order   = Column(Integer, default=0, nullable=False)
    is_featured     = Column(Boolean, default=False, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    category = relationship("Category", back_populates="projects")

    def __repr__(self):
        return f"<Project id={self.id} title={self.title}>"
