"""聊天编排服务：连接会话存储、SQLAgent、图表服务"""
from __future__ import annotations

from dataclasses import asdict
from functools import lru_cache
from typing import Any

from app.core.agent import SQLAgent
from app.services.chart_service import ChartService
from app.services.session_service import SessionService


class ChatService:
    def __init__(self) -> None:
        self.session_service = SessionService()
        self.agent = SQLAgent()
        self.chart_service = ChartService()

    def ensure_session(self, session_id: str) -> None:
        if not self.session_service.get_session(session_id):
            raise ValueError("会话不存在")

    def list_sessions(self) -> list[dict[str, Any]]:
        return [asdict(s) for s in self.session_service.list_sessions()]

    def create_session(self, title: str | None = None) -> dict[str, Any]:
        return asdict(self.session_service.create_session(title=title))

    def rename_session(self, session_id: str, title: str) -> bool:
        return self.session_service.rename_session(session_id, title)

    def delete_session(self, session_id: str) -> bool:
        return self.session_service.delete_session(session_id)

    def list_messages(self, session_id: str) -> list[dict[str, Any]]:
        return self.session_service.list_messages(session_id)

    def process_query(self, session_id: str, question: str) -> list[dict[str, Any]]:
        self.ensure_session(session_id)
        self.session_service.append_message(session_id=session_id, role="user", content=question)

        context = self.session_service.recent_context(session_id=session_id, limit=8)
        result = self.agent.query(question=question, context=context)
        chart_config = self.chart_service.build_config(result.columns, result.rows)

        self.session_service.append_message(
            session_id=session_id,
            role="assistant",
            content=result.explanation,
            sql_query=result.sql,
            chart_config=chart_config,
        )

        return [
            {"type": "sql", "content": result.sql},
            {"type": "text", "content": result.explanation},
            {"type": "chart", "config": chart_config},
            {"type": "complete"},
        ]


@lru_cache(maxsize=1)
def get_chat_service() -> ChatService:
    return ChatService()
