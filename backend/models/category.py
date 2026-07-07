"""
models/category.py — Project category model.
Examples: Website, AI Agents, AI Automation, Machine Learning, Mobile Apps, Python Projects
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), unique=True, nullable=False)
    slug       = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    projects = relationship("Project", back_populates="category", lazy="select")

    def __repr__(self):
        return f"<Category id={self.id} name={self.name}>"
