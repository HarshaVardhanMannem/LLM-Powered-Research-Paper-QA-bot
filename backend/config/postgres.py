"""PostgreSQL configuration and connection settings."""

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class PostgresConfig:
    """PostgreSQL configuration loaded from environment."""

    host: str
    port: int
    user: str
    password: str
    database: str
    schema: Optional[str] = None

    @property
    def url(self) -> str:
        """Build synchronous SQLAlchemy database URL."""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

    @property
    def url_async(self) -> str:
        """Build async SQLAlchemy database URL (for asyncpg)."""
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


def get_postgres_config() -> PostgresConfig:
    """Load PostgreSQL configuration from environment variables."""
    host = os.getenv("POSTGRES_HOST", "localhost")
    # Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
    if host == "localhost":
        host = "127.0.0.1"
    return PostgresConfig(
        host=host,
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        database=os.getenv("POSTGRES_DB", "research_qa"),
        schema=os.getenv("POSTGRES_SCHEMA"),
    )
