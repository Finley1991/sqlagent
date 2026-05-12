"""阿里云百炼 Qwen3 LLM 封装

百炼平台兼容 OpenAI Chat Completions 协议，因此直接复用 ChatOpenAI。
"""
from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI

from app.config import settings


@lru_cache(maxsize=1)
def get_llm(temperature: float = 0.0) -> ChatOpenAI:
    """返回一个进程内共享的 LLM 实例。

    temperature 设为 0 以提高 SQL 生成的稳定性。
    """
    return ChatOpenAI(
        model=settings.qwen_model,
        api_key=settings.dashscope_api_key,
        base_url=settings.qwen_base_url,
        temperature=temperature,
    )
