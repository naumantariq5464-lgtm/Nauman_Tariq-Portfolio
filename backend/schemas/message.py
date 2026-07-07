"""schemas/message.py — Contact message request/response schemas."""

import re
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List


class MessageCreate(BaseModel):
    full_name: str
    email: str
    subject: str
    message: str

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 150:
            raise ValueError("Name must be 2–150 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 300:
            raise ValueError("Subject must be 2–300 characters")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10 or len(v) > 5000:
            raise ValueError("Message must be 10–5000 characters")
        return v


class MessageOut(BaseModel):
    id: int
    full_name: str
    email: str
    subject: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListOut(BaseModel):
    total: int
    unread: int
    messages: List[MessageOut]


class MessageStatusUpdate(BaseModel):
    is_read: bool
