"""Phase 2 冒烟测试（不依赖外部 LLM）"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.chart_service import ChartService
from app.services.session_service import SessionService


def test_chart_service() -> None:
    cols = ["product_name", "total_sales"]
    rows = [["A", 100], ["B", 80], ["C", 30]]
    cfg = ChartService.build_config(cols, rows)
    assert cfg["type"] in {"bar", "pie"}
    assert "series" in cfg


def test_session_service_crud() -> None:
    svc = SessionService()
    sess = svc.create_session("phase2-test")
    assert sess.session_id

    svc.append_message(sess.session_id, role="user", content="你好")
    msgs = svc.list_messages(sess.session_id)
    assert len(msgs) >= 1
    assert msgs[0]["role"] == "user"

    ok = svc.rename_session(sess.session_id, "phase2-test-renamed")
    assert ok is True

    all_sessions = svc.list_sessions()
    assert any(s.session_id == sess.session_id for s in all_sessions)

    deleted = svc.delete_session(sess.session_id)
    assert deleted is True


def main() -> None:
    test_chart_service()
    test_session_service_crud()
    print("[OK] Phase 2 smoke tests passed")


if __name__ == "__main__":
    main()
