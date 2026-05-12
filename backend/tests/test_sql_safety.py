"""SQL 安全校验测试

运行: cd backend && python -m pytest tests/ -v
或不依赖 pytest: python tests/test_sql_safety.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.sql_safety import UnsafeSQLError, assert_read_only


def _expect_pass(sql: str) -> None:
    try:
        assert_read_only(sql)
    except UnsafeSQLError as e:
        raise AssertionError(f"期望通过但抛出异常: {sql!r} -> {e}") from e


def _expect_fail(sql: str) -> None:
    try:
        assert_read_only(sql)
    except UnsafeSQLError:
        return
    raise AssertionError(f"期望拦截但通过了: {sql!r}")


def run_tests() -> None:
    # 应通过
    _expect_pass("SELECT * FROM products")
    _expect_pass("  select  count(*) from orders  ")
    _expect_pass("SELECT * FROM orders LIMIT 10;")
    _expect_pass("WITH t AS (SELECT 1) SELECT * FROM t")
    _expect_pass("SELECT product_name FROM products WHERE price > 1000")

    # 应拦截
    _expect_fail("")
    _expect_fail("DELETE FROM products")
    _expect_fail("UPDATE products SET price = 0")
    _expect_fail("INSERT INTO products VALUES (1, 'x', 'y', 0, 0)")
    _expect_fail("DROP TABLE products")
    _expect_fail("ALTER TABLE products ADD COLUMN x TEXT")
    _expect_fail("SELECT * FROM products; DELETE FROM products")
    _expect_fail("PRAGMA table_info(products)")
    _expect_fail("ATTACH DATABASE 'evil.db' AS evil")

    print("[OK] SQL 安全校验全部用例通过")


if __name__ == "__main__":
    run_tests()
