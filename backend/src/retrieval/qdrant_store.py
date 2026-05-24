"""Qdrant-backed vector store: store and retrieve documents per user and knowledge base."""

import logging
import uuid
from typing import List, Optional

from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    PointStruct,
)

from config.qdrant_config import get_qdrant_config
from src.embedding.embeddings import get_embedder
from src.retrieval.qdrant_setup import get_qdrant_client

logger = logging.getLogger(__name__)


class QdrantStore:
    """User-scoped vector store backed by Qdrant."""

    def __init__(
        self,
        client: Optional[QdrantClient] = None,
        collection_name: Optional[str] = None,
    ):
        config = get_qdrant_config()
        self.client = client or get_qdrant_client()
        self.collection_name = collection_name or config.collection_name
        self.embedder = get_embedder()

    def add_documents(
        self,
        chunks: list[Document],
        user_id: int,
        paper_id: str,
        paper_title: str,
        source: str = "",
        *,
        kb_id: Optional[int] = None,
        domain: Optional[str] = None,
    ) -> int:
        """Embed and upsert document chunks with user/paper or KB metadata."""
        valid = [
            c for c in chunks if hasattr(c, "page_content") and c.page_content.strip()
        ]
        if not valid:
            logger.warning("No valid chunks to add")
            return 0

        texts = [c.page_content for c in valid]
        vectors = self.embedder.embed_documents(texts)

        points = []
        for idx, (text, vector, chunk) in enumerate(zip(texts, vectors, valid)):
            chunk_meta = getattr(chunk, "metadata", {})
            payload = {
                "user_id": user_id,
                "paper_id": paper_id,
                "paper_title": paper_title,
                "source": source or chunk_meta.get("source", ""),
                "title": chunk_meta.get("Title", paper_title),
                "page_content": text,
            }
            if kb_id is not None:
                payload["kb_id"] = kb_id
            if domain:
                payload["domain"] = domain
            payload["section_title"] = chunk_meta.get("section_title", "")
            payload["section_level"] = chunk_meta.get("section_level", 0)
            payload["page_number"] = chunk_meta.get("page_number", 0)
            payload["chunk_index"] = chunk_meta.get("chunk_index", idx)
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload=payload,
                )
            )

        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info(
            "Added %d chunks for user=%s paper=%s (%s) kb_id=%s",
            len(points),
            user_id,
            paper_id,
            paper_title,
            kb_id,
        )
        return len(points)

    def search(
        self,
        query: str,
        user_id: Optional[int] = None,
        limit: int = 5,
        *,
        kb_ids: Optional[List[int]] = None,
        section_filter: Optional[str] = None,
        domain_filter: Optional[str] = None,
    ) -> list[Document]:
        """Retrieve documents relevant to query, with optional filters."""
        query_vector = self.embedder.embed_query(query)

        must_conditions = []
        if kb_ids:
            must_conditions.append(
                FieldCondition(key="kb_id", match=MatchAny(any=kb_ids))
            )
        elif user_id is not None:
            must_conditions.append(
                FieldCondition(key="user_id", match=MatchValue(value=user_id))
            )
        if section_filter:
            must_conditions.append(
                FieldCondition(
                    key="section_title",
                    match=MatchValue(value=section_filter),
                )
            )
        if domain_filter:
            must_conditions.append(
                FieldCondition(key="domain", match=MatchValue(value=domain_filter))
            )

        if not must_conditions:
            must_conditions.append(
                FieldCondition(key="user_id", match=MatchValue(value=user_id or 0))
            )

        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=Filter(must=must_conditions),
            limit=limit,
            with_payload=True,
        )

        docs = []
        for point in results.points:
            payload = point.payload or {}
            meta = {
                "source": payload.get("source", ""),
                "Title": payload.get("title", ""),
                "paper_id": payload.get("paper_id", ""),
                "paper_title": payload.get("paper_title", ""),
                "score": point.score,
            }
            if payload.get("section_title"):
                meta["section_title"] = payload["section_title"]
            if payload.get("domain"):
                meta["domain"] = payload["domain"]
            docs.append(
                Document(page_content=payload.get("page_content", ""), metadata=meta)
            )
        return docs

    def get_user_papers(self, user_id: int) -> list[dict]:
        """Get distinct papers uploaded by a user."""
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
            ),
            limit=1000,
            with_payload=["paper_id", "paper_title"],
        )

        seen = {}
        for point in results[0]:
            pid = point.payload.get("paper_id", "")
            if pid and pid not in seen:
                seen[pid] = point.payload.get("paper_title", "Untitled")

        return [{"id": pid, "title": title} for pid, title in seen.items()]

    def paper_exists_for_user(self, user_id: int, paper_id: str) -> bool:
        """Check if a paper already exists for a user."""
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    FieldCondition(key="paper_id", match=MatchValue(value=paper_id)),
                ]
            ),
            limit=1,
        )
        return len(results[0]) > 0

    def delete_user_paper(self, user_id: int, paper_id: str) -> None:
        """Delete all chunks for a specific user's paper."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    FieldCondition(key="paper_id", match=MatchValue(value=paper_id)),
                ]
            ),
        )
        logger.info("Deleted paper %s for user %s", paper_id, user_id)

    def get_kb_documents(self, kb_id: int) -> list[dict]:
        """Get distinct documents (papers) in a knowledge base."""
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[FieldCondition(key="kb_id", match=MatchValue(value=kb_id))]
            ),
            limit=10000,
            with_payload=["paper_id", "paper_title"],
        )
        seen = {}
        for point in results[0]:
            pid = point.payload.get("paper_id", "")
            if pid and pid not in seen:
                seen[pid] = point.payload.get("paper_title", "Untitled")
        return [{"id": pid, "title": title} for pid, title in seen.items()]

    def delete_kb(self, kb_id: int) -> None:
        """Delete all chunks for a knowledge base."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[FieldCondition(key="kb_id", match=MatchValue(value=kb_id))]
            ),
        )
        logger.info("Deleted all chunks for kb_id=%s", kb_id)

    def document_exists_in_kb(self, kb_id: int, paper_id: str) -> bool:
        """Check if a document already exists in a knowledge base."""
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="kb_id", match=MatchValue(value=kb_id)),
                    FieldCondition(key="paper_id", match=MatchValue(value=paper_id)),
                ]
            ),
            limit=1,
        )
        return len(results[0]) > 0
