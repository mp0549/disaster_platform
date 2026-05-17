import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Database — use direct (non-pooled) connection for long-lived worker process
    DATABASE_URL: str = os.getenv("DATABASE_URL_DIRECT") or os.getenv("DATABASE_URL", "")

    # Optional API keys
    NASA_API_KEY: str | None = os.getenv("NASA_API_KEY") or None
    FIRMS_MAP_KEY: str | None = os.getenv("FIRMS_MAP_KEY") or None

    # Worker HTTP port
    WORKER_PORT: int = int(os.getenv("WORKER_PORT", "8000"))

    @classmethod
    def validate(cls) -> None:
        if not cls.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL_DIRECT (or DATABASE_URL) environment variable is required. "
                "Copy .env.example to .env and configure your database connection."
            )


config = Config()
