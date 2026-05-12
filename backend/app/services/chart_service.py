"""图表配置生成服务"""
from __future__ import annotations

from numbers import Number
from typing import Any


class ChartService:
    """将 SQL 结果转换为前端可用的图表配置"""

    @staticmethod
    def _is_number(value: Any) -> bool:
        return isinstance(value, Number) and not isinstance(value, bool)

    @classmethod
    def detect_chart_type(cls, columns: list[str], rows: list[list[Any]]) -> str:
        if not rows or len(columns) < 2:
            return "table"

        second_col_values = [row[1] for row in rows if len(row) > 1]
        if second_col_values and all(cls._is_number(v) for v in second_col_values):
            first_col_name = columns[0].lower()
            if any(k in first_col_name for k in ["date", "time", "month", "day", "year"]):
                return "line"
            if len(rows) <= 8:
                return "pie"
            return "bar"
        return "table"

    @classmethod
    def build_config(cls, columns: list[str], rows: list[list[Any]]) -> dict[str, Any]:
        chart_type = cls.detect_chart_type(columns, rows)
        if chart_type == "table":
            return {
                "type": "table",
                "columns": columns,
                "data": [dict(zip(columns, row)) for row in rows],
            }

        x_data = [row[0] for row in rows]
        y_data = [row[1] for row in rows]

        if chart_type == "line":
            return {
                "type": "line",
                "title": {"text": "趋势分析"},
                "xAxis": {"type": "category", "data": x_data},
                "yAxis": {"type": "value"},
                "series": [{"type": "line", "data": y_data, "smooth": True, "name": columns[1]}],
            }

        if chart_type == "pie":
            return {
                "type": "pie",
                "title": {"text": "占比分析"},
                "series": [
                    {
                        "type": "pie",
                        "data": [{"name": x, "value": y} for x, y in zip(x_data, y_data)],
                    }
                ],
            }

        return {
            "type": "bar",
            "title": {"text": "分类对比"},
            "xAxis": {"type": "category", "data": x_data},
            "yAxis": {"type": "value"},
            "series": [{"type": "bar", "data": y_data, "name": columns[1]}],
        }
