"""/api/query 路由：接收自然语言问题，返回 SQL + 数据 + 解释"""
from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, HTTPException

from app.core.agent import SQLAgent
from app.core.sql_safety import UnsafeSQLError
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter(prefix="/api", tags=["query"])


@lru_cache(maxsize=1)
def _agent() -> SQLAgent:
    return SQLAgent()


@router.post("/query", response_model=QueryResponse)
def post_query(payload: QueryRequest) -> QueryResponse:
    agent = _agent()
    try:
        result = agent.query(payload.question)
    except UnsafeSQLError as e:
        raise HTTPException(status_code=400, detail=f"SQL 安全校验失败: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {e}") from e

    return QueryResponse(
        question=result.question,
        sql=result.sql,
        columns=result.columns,
        rows=result.rows,
        explanation=result.explanation,
    )
