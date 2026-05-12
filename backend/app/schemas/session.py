"""会话相关 Schema"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=120)


class SessionRenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)


class SessionResponse(BaseModel):
    session_id: str
    title: str
    created_at: str
    updated_at: str


class SessionDetailResponse(BaseModel):
    session: SessionResponse
    messages: list[dict[str, Any]]
