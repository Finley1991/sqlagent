"""会话管理 REST API"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.session import (
    SessionCreateRequest,
    SessionDetailResponse,
    SessionRenameRequest,
    SessionResponse,
)
from app.services.chat_service import get_chat_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionResponse])
def list_sessions() -> list[SessionResponse]:
    svc = get_chat_service()
    return [SessionResponse(**s) for s in svc.list_sessions()]


@router.post("", response_model=SessionResponse)
def create_session(payload: SessionCreateRequest) -> SessionResponse:
    svc = get_chat_service()
    data = svc.create_session(title=payload.title)
    return SessionResponse(**data)


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str) -> SessionDetailResponse:
    svc = get_chat_service()
    sessions = {s["session_id"]: s for s in svc.list_sessions()}
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="会话不存在")
    return SessionDetailResponse(
        session=SessionResponse(**sessions[session_id]),
        messages=svc.list_messages(session_id),
    )


@router.put("/{session_id}", response_model=dict[str, bool])
def rename_session(session_id: str, payload: SessionRenameRequest) -> dict[str, bool]:
    svc = get_chat_service()
    ok = svc.rename_session(session_id, payload.title.strip())
    if not ok:
        raise HTTPException(status_code=404, detail="会话不存在")
    return {"ok": True}


@router.delete("/{session_id}", response_model=dict[str, bool])
def delete_session(session_id: str) -> dict[str, bool]:
    svc = get_chat_service()
    ok = svc.delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="会话不存在")
    return {"ok": True}
