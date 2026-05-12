#!/usr/bin/env python3
"""HTTP 冒烟：健康检查 + 会话创建与读取（不调用大模型）。"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


def base_url() -> str:
    return os.environ.get("SQLAGENT_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


def request_json(method: str, path: str, body: dict | None = None) -> dict:
    url = base_url() + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if body is not None else {}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def main() -> int:
    try:
        health = request_json("GET", "/api/health")
        if health.get("status") != "ok":
            print("[FAIL] /api/health unexpected:", health, file=sys.stderr)
            return 1

        created = request_json("POST", "/api/sessions", {"title": "e2e-smoke"})
        sid = created.get("session_id")
        if not sid:
            print("[FAIL] POST /api/sessions missing session_id:", created, file=sys.stderr)
            return 1

        detail = request_json("GET", f"/api/sessions/{sid}")
        if "session" not in detail or "messages" not in detail:
            print("[FAIL] GET session detail unexpected keys:", detail.keys(), file=sys.stderr)
            return 1

        print("[OK] e2e_http_smoke passed", sid)
        return 0
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print("[FAIL] HTTP", e.code, e.reason, body, file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print("[FAIL]", e.reason, file=sys.stderr)
        return 1
    except Exception as e:  # noqa: BLE001 — smoke script
        print("[FAIL]", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
