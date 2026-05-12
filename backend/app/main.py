"""FastAPI 应用入口"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.query import router as query_router
from app.config import settings

app = FastAPI(
    title="SQL Agent 智能数据分析系统",
    description="自然语言查询数据库，Phase 1 - 基础架构",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": settings.qwen_model}
