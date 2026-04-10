"""
Shadow API Tester — Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DB_PATH: str = str(Path(__file__).parent / "shadow_api.db")

    # AI Configuration
    AI_PROVIDER: str = "gemini"  # "gemini" or "ollama"
    GEMINI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"

    # Shadow Worker
    SHADOW_INTERVAL_SECONDS: float = 10.0
    SHADOW_TIMEOUT_SECONDS: float = 15.0
    MAX_RETRIES: int = 3

    # Rate Limiter Thresholds
    CPU_THROTTLE_THRESHOLD: float = 80.0
    CPU_PAUSE_THRESHOLD: float = 95.0
    RAM_THROTTLE_THRESHOLD: float = 85.0

    # Stress Test
    STRESS_CONCURRENCY: int = 500

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
