"""应用配置，从 .env 加载"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """全局配置"""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    dashscope_api_key: str
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
