"""Qdrant database setup: client and collection initialization."""

import logging
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PayloadSchemaType, VectorParams

from config.qdrant_config import get_qdrant_config

logger = logging.getLogger(__name__)


def get_qdrant_client() -> QdrantClient:
    """Create and return a Qdrant client from config."""
    config = get_qdrant_config()
    client = QdrantClient(host=config.host, port=config.port, prefer_grpc=False)
    return client


def init_qdrant_collection(
    client: Optional[QdrantClient] = None,
    *,
    recreate: bool = False,
) -> QdrantClient:
    """
    Ensure the Qdrant collection exists with the correct vector size
    and payload indexes for efficient user-scoped filtering.
    Returns the Qdrant client.
    """
    config = get_qdrant_config()
    if client is None:
        client = get_qdrant_client()

    if recreate and client.collection_exists(config.collection_name):
        client.delete_collection(config.collection_name)
        logger.info("Deleted existing Qdrant collection: %s", config.collection_name)

    if client.collection_exists(config.collection_name):
        collection_info = client.get_collection(config.collection_name)
        existing_size = collection_info.config.params.vectors.size
        if existing_size != config.vector_size:
            logger.warning(
                "Qdrant collection %s has vector size %s but expected %s. Recreating...",
                config.collection_name,
                existing_size,
                config.vector_size,
            )
            client.delete_collection(config.collection_name)
        else:
            logger.debug("Qdrant collection already exists: %s", config.collection_name)
            _ensure_payload_indexes(client, config.collection_name)
            return client

    client.create_collection(
        collection_name=config.collection_name,
        vectors_config=VectorParams(
            size=config.vector_size,
            distance=Distance.COSINE,
        ),
    )
    logger.info(
        "Created Qdrant collection %s with vector size %s",
        config.collection_name,
        config.vector_size,
    )

    _ensure_payload_indexes(client, config.collection_name)
    return client


def _ensure_payload_indexes(client: QdrantClient, collection_name: str) -> None:
    """Create payload indexes for efficient user and KB filtering."""
    for field, schema_type in [
        ("user_id", PayloadSchemaType.INTEGER),
        ("paper_id", PayloadSchemaType.KEYWORD),
        ("kb_id", PayloadSchemaType.INTEGER),
        ("section_title", PayloadSchemaType.KEYWORD),
        ("domain", PayloadSchemaType.KEYWORD),
        ("page_number", PayloadSchemaType.INTEGER),
    ]:
        try:
            client.create_payload_index(
                collection_name=collection_name,
                field_name=field,
                field_schema=schema_type,
            )
            logger.debug("Created payload index: %s (%s)", field, schema_type)
        except Exception:
            logger.debug("Payload index already exists: %s", field)
