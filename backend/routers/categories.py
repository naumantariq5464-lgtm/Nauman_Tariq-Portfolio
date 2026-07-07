"""
routers/categories.py — Category CRUD endpoints.
Public: GET (list, single)
Admin only: POST, PUT, DELETE
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.category import Category
from models.admin import Admin
from schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from middleware.auth_middleware import get_current_admin

router = APIRouter(prefix="/categories", tags=["Categories"])


# ── Public ────────────────────────────────────────────────────

@router.get("/", response_model=List[CategoryOut], summary="List all categories")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()


@router.get("/{slug}", response_model=CategoryOut, summary="Get category by slug")
def get_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat


# ── Admin Only ────────────────────────────────────────────────

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED,
             summary="Create category (admin)")
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    # Check uniqueness
    if db.query(Category).filter(
        (Category.name == body.name) | (Category.slug == body.slug)
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name or slug already exists",
        )
    cat = Category(name=body.name, slug=body.slug)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategoryOut, summary="Update category (admin)")
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if body.name is not None:
        cat.name = body.name.strip()
    if body.slug is not None:
        cat.slug = body.slug.strip()

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete category (admin)")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(cat)
    db.commit()
