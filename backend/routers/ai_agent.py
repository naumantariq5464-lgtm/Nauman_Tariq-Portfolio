"""
routers/ai_agent.py — AI Portfolio Assistant endpoint.
Rate limited: 20 requests per hour per IP.
Max message length: 500 characters.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, field_validator

from database import get_db
from services.ai_service import chat, clear_session
from config import settings

router  = APIRouter(prefix="/ai", tags=["AI Assistant"])
limiter = Limiter(key_func=get_remote_address)


# ── Schemas ───────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message:    str
    session_id: str = ""

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 500:
            raise ValueError("Message too long (max 500 characters)")
        return v


class ChatResponse(BaseModel):
    reply:      str
    session_id: str


class ClearRequest(BaseModel):
    session_id: str


# ── Chat Endpoint ─────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse, summary="AI Portfolio Assistant chat")
@limiter.limit("20/hour")
async def ai_chat(
    request: Request,
    body: ChatRequest,
    db: Session = Depends(get_db),
):
    # Check Groq API key is configured
    if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Assistant is not configured yet.",
        )

    # Generate session_id if not provided
    session_id = body.session_id.strip() if body.session_id.strip() else str(uuid.uuid4())

    # Process through AI agent
    reply = chat(
        session_id=session_id,
        user_message=body.message,
        db=db,
    )

    return ChatResponse(reply=reply, session_id=session_id)


# ── Clear Session ─────────────────────────────────────────────
@router.post("/clear", summary="Clear AI chat session history")
async def clear_chat(body: ClearRequest):
    if body.session_id:
        clear_session(body.session_id)
    return {"detail": "Session cleared."}
