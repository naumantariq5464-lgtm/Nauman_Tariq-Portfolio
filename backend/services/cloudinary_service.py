"""
services/cloudinary_service.py — Image upload and deletion via Cloudinary.
Only jpg, jpeg, png, webp allowed. Max 5MB.
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status
from config import settings

# ── Configure Cloudinary ──────────────────────────────────────
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def upload_image(file: UploadFile, folder: str = "portfolio/projects") -> dict:
    """
    Upload an image to Cloudinary.
    Returns dict with 'url' and 'public_id'.
    Raises HTTPException on validation failure.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit",
        )

    # Upload to Cloudinary
    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
            transformation=[
                {"width": 1200, "height": 800, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"},
            ],
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}",
        )


def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by its public_id. Returns True on success."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception:
        return False
