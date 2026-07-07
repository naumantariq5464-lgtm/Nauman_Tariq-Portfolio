"""
models/message.py — Contact form message model (lightweight CRM).
Every submitted message is saved to DB AND emailed via Resend.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Message(Base):
    __tablename__ = "messages"

    id         = Column(Integer, primary_key=True, index=True)
    full_name  = Column(String(150), nullable=False)
    email      = Column(String(255), nullable=False)
    subject    = Column(String(300), nullable=False)
    message    = Column(Text, nullable=False)
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Message id={self.id} from={self.email} subject={self.subject[:30]}>"
