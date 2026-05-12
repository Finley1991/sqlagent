"""SQL Agent：自然语言 → SQL → 执行 → 自然语言解释

Phase 1 采用"两阶段链式"实现，比 create_sql_agent 更可控、更易调试：

    阶段 A: LLM 接收 schema + 用户问题，返回单条 SELECT
    阶段 B: 执行 SQL（先经过 assert_read_only 安全校验）
    阶段 C: LLM 接收原问题 + SQL + 结果，生成自然语言解释

后续 Phase 2 可在此基础上扩展工具调用、错误自纠等能力。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from langchain_community.utilities import SQLDatabase
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings
from app.core.llm import get_llm
from app.core.sql_safety import UnsafeSQLError, assert_read_only

_SQL_GEN_SYSTEM_PROMPT = """你是一个 SQLite 数据分析专家。
根据用户的自然语言问题，生成一条能直接执行的 SELECT 查询。

严格规则：
1. 只能生成 SELECT 语句，禁止任何写操作（INSERT/UPDATE/DELETE/DROP/ALTER 等）
2. 只能使用下面给出的表和字段，不要臆造
3. 若需要排序的结果，给出明确的 ORDER BY
4. 限制返回行数：默认追加 LIMIT 100，除非用户明确要求更多
5. 直接返回 SQL 语句本身，不要使用 markdown 代码块，不要解释

数据库 Schema:
{schema}
"""

_EXPLAIN_SYSTEM_PROMPT = """你是数据分析助手。用简洁的中文向用户解释查询结果。
- 不要复述 SQL
- 给出关键数字与洞察
- 如果结果为空，说明"未查询到符合条件的数据"
"""


@dataclass
class QueryResult:
    """SQL Agent 查询返回值"""

    question: str
    sql: str
    columns: list[str]
    rows: list[list[Any]]
    explanation: str


def _strip_sql(text: str) -> str:
    """去掉 LLM 偶尔包裹的 markdown 代码块"""
    s = text.strip()
    if s.startswith("```"):
        s = s.strip("`")
        if s.lower().startswith("sql"):
            s = s[3:]
    return s.strip().rstrip(";").strip()


class SQLAgent:
    """封装一次完整的 NL → SQL → 结果 → 解释 流程"""

    def __init__(self, db_uri: str | None = None) -> None:
        self.db = SQLDatabase.from_uri(
            db_uri or settings.db_uri,
            sample_rows_in_table_info=2,
        )
        self.llm = get_llm()

    def _schema(self) -> str:
        return self.db.get_table_info()

    def generate_sql(self, question: str) -> str:
        messages = [
            SystemMessage(content=_SQL_GEN_SYSTEM_PROMPT.format(schema=self._schema())),
            HumanMessage(content=question),
        ]
        response = self.llm.invoke(messages)
        return _strip_sql(str(response.content))

    def run_sql(self, sql: str) -> tuple[list[str], list[list[Any]]]:
        """安全执行 SELECT，返回 (列名, 行)"""
        assert_read_only(sql)

        engine = self.db._engine
        from sqlalchemy import text as sa_text

        with engine.connect() as conn:
            cursor = conn.execute(sa_text(sql))
            columns = list(cursor.keys())
            rows = [list(row) for row in cursor.fetchall()]
        return columns, rows

    def explain(self, question: str, sql: str, columns: list[str], rows: list[list[Any]]) -> str:
        preview = rows[:20]
        messages = [
            SystemMessage(content=_EXPLAIN_SYSTEM_PROMPT),
            HumanMessage(
                content=(
                    f"用户问题: {question}\n"
                    f"执行 SQL:\n{sql}\n"
                    f"列名: {columns}\n"
                    f"结果前 {len(preview)} 行: {preview}\n"
                    f"总行数: {len(rows)}"
                )
            ),
        ]
        response = self.llm.invoke(messages)
        return str(response.content).strip()

    def query(self, question: str) -> QueryResult:
        sql = self.generate_sql(question)
        try:
            columns, rows = self.run_sql(sql)
        except UnsafeSQLError:
            raise
        explanation = self.explain(question, sql, columns, rows)
        return QueryResult(
            question=question,
            sql=sql,
            columns=columns,
            rows=rows,
            explanation=explanation,
        )
