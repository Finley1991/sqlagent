"""应用配置，从 .env 加载"""
from __future__ import annotations

import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - fallback for lightweight environments
    BaseSettings = object  # type: ignore[assignment]
    SettingsConfigDict = dict  # type: ignore[assignment]

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """全局配置"""

    model_config = SettingsConfigDict(  # type: ignore[call-arg]
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    dashscope_api_key: str = ""
    qwen_model: str = "qwen-plus"
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    db_path: str = "data/sample.db"
    port: int = 8000

    @property
    def db_uri(self) -> str:
        """SQLAlchemy 风格的 SQLite URI"""
        abs_path = (BACKEND_DIR / self.db_path).resolve()
        return f"sqlite:///{abs_path}"


settings = Settings()  # type: ignore[call-arg]
if not getattr(settings, "db_path", None):
    # pydantic_settings 不可用时，兜底走环境变量/默认值
    settings.dashscope_api_key = os.getenv("DASHSCOPE_API_KEY", "")
    settings.qwen_model = os.getenv("QWEN_MODEL", "qwen-plus")
    settings.qwen_base_url = os.getenv(
        "QWEN_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    settings.db_path = os.getenv("DB_PATH", "data/sample.db")
    settings.port = int(os.getenv("PORT", "8000"))
