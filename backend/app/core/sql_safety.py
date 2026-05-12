"""SQL 安全校验：只允许 SELECT 查询。

设计目标：
- 阻止任何会修改数据或结构的语句（INSERT/UPDATE/DELETE/DROP/ALTER/...）
- 阻止多语句注入（用 `;` 分号串接）
- 容忍 CTE 写法（WITH ... SELECT ...）
- 仅在最外层语句类型上判定，不假设解析 SQL 语义
"""
from __future__ import annotations

import re

_FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
    "CREATE", "TRUNCATE", "REPLACE", "MERGE",
    "ATTACH", "DETACH", "PRAGMA", "VACUUM", "REINDEX",
}

_COMMENT_PATTERN = re.compile(r"--[^\n]*|/\*.*?\*/", re.DOTALL)


class UnsafeSQLError(ValueError):
    """检测到非只读 SQL 时抛出"""


def assert_read_only(sql: str) -> None:
    """如果 sql 不是单条只读查询则抛出 UnsafeSQLError"""
    if not sql or not sql.strip():
        raise UnsafeSQLError("SQL 为空")

    cleaned = _COMMENT_PATTERN.sub(" ", sql).strip().rstrip(";")

    # 多语句拦截：去掉注释和末尾分号之后不应再含分号
    if ";" in cleaned:
        raise UnsafeSQLError("禁止多语句执行")

    head = cleaned.lstrip("(").lstrip().split(None, 1)[0].upper()
    if head not in {"SELECT", "WITH"}:
        raise UnsafeSQLError(f"仅允许 SELECT/WITH 查询，检测到: {head}")

    upper = cleaned.upper()
    pattern = re.compile(r"\b(" + "|".join(_FORBIDDEN_KEYWORDS) + r")\b")
    found = pattern.search(upper)
    if found:
        raise UnsafeSQLError(f"禁止的关键字: {found.group(1)}")
