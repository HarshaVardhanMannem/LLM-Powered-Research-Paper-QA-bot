"""Qdrant configuration (URL, collection name, vector size)."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

# nv-embedqa-e5-v5 produces 1024-dimensional vectors
DEFAULT_VECTOR_SIZE = 1024


@dataclass(frozen=True)
class QdrantConfig:
    """Qdrant connection and collection configuration."""

    host: str
    port: int
    collection_name: str
    vector_size: int
    use_https: bool = False

    @property
    def url(self) -> str:
        """Base URL for Qdrant (e.g. http://localhost:6333)."""
        scheme = "https" if self.use_https else "http"
        return f"{scheme}://{self.host}:{self.port}"


def get_qdrant_config() -> QdrantConfig:
    """Load Qdrant configuration from environment."""
    return QdrantConfig(
        host=os.getenv("QDRANT_HOST", "localhost"),
        port=int(os.getenv("QDRANT_PORT", "6333")),
        collection_name=os.getenv("QDRANT_COLLECTION_NAME", "research_papers"),
        vector_size=int(os.getenv("QDRANT_VECTOR_SIZE", str(DEFAULT_VECTOR_SIZE))),
        use_https=os.getenv("QDRANT_USE_HTTPS", "false").lower()
        in ("1", "true", "yes"),
    )
