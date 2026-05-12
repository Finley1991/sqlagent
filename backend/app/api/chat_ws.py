"""WebSocket 聊天接口"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.chat_service import get_chat_service

router = APIRouter(tags=["chat-ws"])


@router.websocket("/ws/chat/{session_id}")
async def chat_ws(websocket: WebSocket, session_id: str) -> None:
    svc = get_chat_service()
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            if payload.get("type") != "query":
                await websocket.send_json({"type": "error", "message": "仅支持 type=query"})
                continue

            question = str(payload.get("content", "")).strip()
            if not question:
                await websocket.send_json({"type": "error", "message": "问题不能为空"})
                continue

            try:
                events = svc.process_query(session_id=session_id, question=question)
            except ValueError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
                continue
            except Exception as e:
                await websocket.send_json({"type": "error", "message": f"处理失败: {e}"})
                continue

            for event in events:
                await websocket.send_json(event)
    except WebSocketDisconnect:
        return
