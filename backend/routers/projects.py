"""
routers/projects.py — Project CRUD with Cloudinary image upload.
Public: GET list + GET single
Admin only: POST, PUT, DELETE
"""

import bleach
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from database import get_db
from models.project import Project
from models.admin import Admin
from schemas.project import ProjectOut, ProjectListOut
from services.cloudinary_service import upload_image, delete_image
from middleware.auth_middleware import get_current_admin

router = APIRouter(prefix="/projects", tags=["Projects"])

ALLOWED_TAGS: list = []  # strip all HTML from text fields


def sanitize(text: str) -> str:
    return bleach.clean(text, tags=ALLOWED_TAGS, strip=True)


# ── Public ────────────────────────────────────────────────────

@router.get("/", response_model=ProjectListOut, summary="List all projects")
def list_projects(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    featured: Optional[bool] = Query(None, description="Filter featured projects only"),
    db: Session = Depends(get_db),
):
    q = db.query(Project).options(joinedload(Project.category))

    if featured is not None:
        q = q.filter(Project.is_featured == featured)

    if category:
        from models.category import Category
        q = q.join(Category).filter(Category.slug == category)

    projects = q.order_by(Project.display_order.asc(), Project.created_at.desc()).all()
    return ProjectListOut(total=len(projects), projects=projects)


@router.get("/{project_id}", response_model=ProjectOut, summary="Get project by ID")
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).options(joinedload(Project.category)).filter(
        Project.id == project_id
    ).first()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return proj


# ── Admin Only ────────────────────────────────────────────────

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED,
             summary="Create project (admin)")
async def create_project(
    title: str = Form(...),
    description: str = Form(...),
    category_id: Optional[int] = Form(None),
    github_link: Optional[str] = Form(None),
    linkedin_link: Optional[str] = Form(None),
    demo_link: Optional[str] = Form(None),
    skills_tags: Optional[str] = Form(None),
    display_order: int = Form(0),
    is_featured: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    image_url = None
    image_public_id = None

    # Upload image to Cloudinary if provided
    if image and image.filename:
        result = await upload_image(image)
        image_url = result["url"]
        image_public_id = result["public_id"]

    proj = Project(
        title=sanitize(title),
        description=sanitize(description),
        category_id=category_id,
        image_url=image_url,
        image_public_id=image_public_id,
        github_link=github_link,
        linkedin_link=linkedin_link,
        demo_link=demo_link,
        skills_tags=sanitize(skills_tags) if skills_tags else None,
        display_order=display_order,
        is_featured=is_featured,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # Reload with category relationship
    return db.query(Project).options(joinedload(Project.category)).filter(
        Project.id == proj.id
    ).first()


@router.put("/{project_id}", response_model=ProjectOut, summary="Update project (admin)")
async def update_project(
    project_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    github_link: Optional[str] = Form(None),
    linkedin_link: Optional[str] = Form(None),
    demo_link: Optional[str] = Form(None),
    skills_tags: Optional[str] = Form(None),
    display_order: Optional[int] = Form(None),
    is_featured: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if title is not None:         proj.title = sanitize(title)
    if description is not None:   proj.description = sanitize(description)
    if category_id is not None:   proj.category_id = category_id
    if github_link is not None:   proj.github_link = github_link
    if linkedin_link is not None: proj.linkedin_link = linkedin_link
    if demo_link is not None:     proj.demo_link = demo_link
    if skills_tags is not None:   proj.skills_tags = sanitize(skills_tags)
    if display_order is not None: proj.display_order = display_order
    if is_featured is not None:   proj.is_featured = is_featured

    # Replace image if new one provided
    if image and image.filename:
        if proj.image_public_id:
            delete_image(proj.image_public_id)   # Remove old from Cloudinary
        result = await upload_image(image)
        proj.image_url = result["url"]
        proj.image_public_id = result["public_id"]

    db.commit()
    db.refresh(proj)
    return db.query(Project).options(joinedload(Project.category)).filter(
        Project.id == proj.id
    ).first()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete project (admin)")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if proj.image_public_id:
        delete_image(proj.image_public_id)

    db.delete(proj)
    db.commit()
