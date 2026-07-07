"""
routers/contact.py — Contact form submission (public) + admin message management.
Rate limited: 3 submissions per hour per IP.
"""

import bleach
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional

from database import get_db
from models.message import Message
from models.admin import Admin
from schemas.message import MessageCreate, MessageOut, MessageListOut, MessageStatusUpdate
from services.resend_service import send_contact_notification
from middleware.auth_middleware import get_current_admin

router = APIRouter(prefix="/contact", tags=["Contact"])
limiter = Limiter(key_func=get_remote_address)

ALLOWED_TAGS: list = []


def sanitize(text: str) -> str:
    return bleach.clean(text, tags=ALLOWED_TAGS, strip=True)


# ── Public ────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Submit contact form")
@limiter.limit("3/hour")
async def submit_contact(
    request: Request,
    body: MessageCreate,
    db: Session = Depends(get_db),
):
    """
    Saves message to DB AND sends email via Resend.
    Returns success regardless of email status (email is best-effort).
    """
    msg = Message(
        full_name=sanitize(body.full_name),
        email=body.email.lower().strip(),
        subject=sanitize(body.subject),
        message=sanitize(body.message),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Send email notification (non-blocking — failure won't affect response)
    send_contact_notification(
        full_name=msg.full_name,
        email=msg.email,
        subject=msg.subject,
        message=msg.message,
    )

    return {"detail": "Your message has been sent successfully."}


# ── Admin Only ────────────────────────────────────────────────

@router.get("/messages", response_model=MessageListOut, summary="List all messages (admin)")
def list_messages(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(Message)
    if unread_only:
        q = q.filter(Message.is_read == False)

    total = q.count()
    unread_count = db.query(Message).filter(Message.is_read == False).count()
    messages = q.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    return MessageListOut(total=total, unread=unread_count, messages=messages)


@router.get("/messages/{message_id}", response_model=MessageOut,
            summary="Get message detail (admin)")
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return msg


@router.patch("/messages/{message_id}/status", response_model=MessageOut,
              summary="Update read/unread status (admin)")
def update_message_status(
    message_id: int,
    body: MessageStatusUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    msg.is_read = body.is_read
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete message (admin)")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    db.delete(msg)
    db.commit()
