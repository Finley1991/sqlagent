"""会话管理与消息持久化服务（SQLite）"""
from __future__ import annotations

import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

from app.config import settings


def _utc_now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


@dataclass
class ChatSession:
    session_id: str
    title: str
    created_at: str
    updated_at: str


class SessionService:
    """会话 CRUD + 消息持久化"""

    def __init__(self) -> None:
        self._lock = Lock()
        self._db_path = str((Path(__file__).resolve().parents[2] / settings.db_path).resolve())
        self._init_tables()

    def _connect(self) -> sqlite3.Connection:
        Path(self._db_path).parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self) -> None:
        with self._lock:
            conn = self._connect()
            try:
                conn.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS chat_sessions (
                        session_id  TEXT PRIMARY KEY,
                        title       TEXT NOT NULL,
                        created_at  TEXT NOT NULL,
                        updated_at  TEXT NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS chat_messages (
                        message_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id   TEXT NOT NULL,
                        role         TEXT NOT NULL,
                        content      TEXT NOT NULL,
                        sql_query    TEXT,
                        chart_config TEXT,
                        created_at   TEXT NOT NULL,
                        FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
                    );
                    """
                )
                conn.commit()
            finally:
                conn.close()

    def create_session(self, title: str | None = None) -> ChatSession:
        session_id = str(uuid.uuid4())
        now = _utc_now()
        final_title = title.strip() if title and title.strip() else "新会话"
        with self._lock:
            conn = self._connect()
            try:
                conn.execute(
                    "INSERT INTO chat_sessions(session_id, title, created_at, updated_at) VALUES (?,?,?,?)",
                    (session_id, final_title, now, now),
                )
                conn.commit()
            finally:
                conn.close()
        return ChatSession(session_id=session_id, title=final_title, created_at=now, updated_at=now)

    def list_sessions(self) -> list[ChatSession]:
        conn = self._connect()
        try:
            rows = conn.execute(
                "SELECT session_id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
            ).fetchall()
        finally:
            conn.close()
        return [ChatSession(**dict(row)) for row in rows]

    def get_session(self, session_id: str) -> ChatSession | None:
        conn = self._connect()
        try:
            row = conn.execute(
                "SELECT session_id, title, created_at, updated_at FROM chat_sessions WHERE session_id = ?",
                (session_id,),
            ).fetchone()
        finally:
            conn.close()
        if not row:
            return None
        return ChatSession(**dict(row))

    def rename_session(self, session_id: str, title: str) -> bool:
        now = _utc_now()
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.execute(
                    "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE session_id = ?",
                    (title, now, session_id),
                )
                conn.commit()
                return cur.rowcount > 0
            finally:
                conn.close()

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            conn = self._connect()
            try:
                conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
                cur = conn.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
                conn.commit()
                return cur.rowcount > 0
            finally:
                conn.close()

    def append_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sql_query: str | None = None,
        chart_config: dict[str, Any] | None = None,
    ) -> None:
        now = _utc_now()
        chart_text = json.dumps(chart_config, ensure_ascii=False) if chart_config else None
        with self._lock:
            conn = self._connect()
            try:
                conn.execute(
                    """
                    INSERT INTO chat_messages(session_id, role, content, sql_query, chart_config, created_at)
                    VALUES (?,?,?,?,?,?)
                    """,
                    (session_id, role, content, sql_query, chart_text, now),
                )
                conn.execute(
                    "UPDATE chat_sessions SET updated_at = ? WHERE session_id = ?",
                    (now, session_id),
                )
                conn.commit()
            finally:
                conn.close()

    def list_messages(self, session_id: str) -> list[dict[str, Any]]:
        conn = self._connect()
        try:
            rows = conn.execute(
                """
                SELECT message_id, session_id, role, content, sql_query, chart_config, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY message_id ASC
                """,
                (session_id,),
            ).fetchall()
        finally:
            conn.close()

        out: list[dict[str, Any]] = []
        for row in rows:
            data = dict(row)
            if data.get("chart_config"):
                data["chart_config"] = json.loads(data["chart_config"])
            out.append(data)
        return out

    def recent_context(self, session_id: str, limit: int = 8) -> str:
        conn = self._connect()
        try:
            rows = conn.execute(
                """
                SELECT role, content FROM chat_messages
                WHERE session_id = ?
                ORDER BY message_id DESC
                LIMIT ?
                """,
                (session_id, limit),
            ).fetchall()
        finally:
            conn.close()
        rows = list(reversed(rows))
        if not rows:
            return ""
        lines = [f"{row['role']}: {row['content']}" for row in rows]
        return "\n".join(lines)
