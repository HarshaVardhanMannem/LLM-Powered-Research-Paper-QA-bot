"""Chunking strategy factory: recursive, section, and semantic chunkers."""

import logging
import re
from typing import Any, List, Optional

from langchain_core.documents import BaseDocumentTransformer, Document
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)

from backend.config.settings import (
    CHUNK_OVERLAP,
    CHUNK_SEPARATORS,
    CHUNK_SIZE,
    MIN_CHUNK_LENGTH,
)

logger = logging.getLogger(__name__)

RESEARCH_SECTION_PATTERN = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*\.?\s+)?"
    r"(abstract|introduction|background|related work|methodology|methods?|"
    r"experiments?|experimental setup|results?|discussion|limitations?|"
    r"conclusion|future work|appendix|acknowledgements?)\s*$",
    re.IGNORECASE,
)


class SectionChunker(BaseDocumentTransformer):
    """
    Section-aware chunker: splits markdown by headers, then sub-splits long sections.
    Preserves section_title and section_level in chunk metadata.
    """

    def __init__(
        self,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
        min_chunk_length: int = MIN_CHUNK_LENGTH,
        headers_to_split_on: Optional[List[tuple]] = None,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_length = min_chunk_length
        self.headers_to_split_on = headers_to_split_on or [
            ("#", "header_1"),
            ("##", "header_2"),
            ("###", "header_3"),
        ]
        self._header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=self.headers_to_split_on,
            strip_headers=True,
        )
        self._recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=CHUNK_SEPARATORS,
            add_start_index=True,
        )

    def _markdownize_research_sections(self, text: str) -> str:
        """Promote common research-paper headings so section splitting works on PDFs."""
        lines = []
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("#") or not RESEARCH_SECTION_PATTERN.match(stripped):
                lines.append(line)
                continue
            lines.append(f"## {stripped.title()}")
        return "\n".join(lines)

    def _merge_section_metadata(self, meta: dict) -> tuple[str, int]:
        """Derive section_title and section_level from header metadata."""
        section_title = ""
        section_level = 0
        for i in range(1, 4):
            key = f"header_{i}"
            if key in meta and meta[key]:
                section_title = meta[key]
                section_level = i
        return section_title or "Unknown", section_level

    def transform_documents(
        self,
        documents: List[Document],
        **kwargs: Any,
    ) -> List[Document]:
        """Split documents by markdown headers, then sub-split long chunks."""
        all_chunks: List[Document] = []
        for doc in documents:
            if not doc.page_content or not doc.page_content.strip():
                continue
            try:
                content = self._markdownize_research_sections(doc.page_content)
                splits = self._header_splitter.split_text(content)
            except Exception as e:
                logger.warning(
                    "MarkdownHeaderTextSplitter failed, falling back to recursive: %s",
                    str(e),
                )
                splits = self._recursive_splitter.split_documents([doc])
                all_chunks.extend(splits)
                continue

            for split in splits:
                section_title, section_level = self._merge_section_metadata(
                    getattr(split, "metadata", {}) or {}
                )
                meta = {
                    **doc.metadata,
                    "section_title": section_title,
                    "section_level": section_level,
                }

                if len(split.page_content) <= self.chunk_size:
                    if len(split.page_content) >= self.min_chunk_length:
                        meta["chunk_index"] = 0
                        meta["chunk_total"] = 1
                        all_chunks.append(
                            Document(
                                page_content=split.page_content,
                                metadata={**meta, **split.metadata},
                            )
                        )
                else:
                    sub_chunks = self._recursive_splitter.split_documents([split])
                    for idx, sub in enumerate(sub_chunks):
                        if len(sub.page_content) >= self.min_chunk_length:
                            sub_meta = {**meta, **sub.metadata}
                            sub_meta["chunk_index"] = idx
                            sub_meta["chunk_total"] = len(sub_chunks)
                            all_chunks.append(
                                Document(
                                    page_content=sub.page_content,
                                    metadata=sub_meta,
                                )
                            )
        return all_chunks


def get_chunker(
    strategy: str = "recursive",
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    min_chunk_length: int = MIN_CHUNK_LENGTH,
    embeddings: Optional[Any] = None,
    **kwargs: Any,
) -> BaseDocumentTransformer:
    """
    Factory for document chunkers.

    Args:
        strategy: One of "recursive", "section", "semantic".
        chunk_size: Max chunk size in characters.
        chunk_overlap: Overlap between chunks.
        min_chunk_length: Minimum chunk length to keep.
        embeddings: Required for "semantic" strategy.
        **kwargs: Extra args passed to chunker constructors.

    Returns:
        A document transformer with transform_documents().
    """
    if strategy == "recursive":
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=kwargs.get("separators", CHUNK_SEPARATORS),
            add_start_index=True,
        )
    if strategy == "section":
        return SectionChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            min_chunk_length=min_chunk_length,
            headers_to_split_on=kwargs.get("headers_to_split_on"),
        )
    if strategy == "semantic":
        if embeddings is None:
            logger.warning(
                "SemanticChunker requires embeddings; falling back to recursive"
            )
            return RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=kwargs.get("separators", CHUNK_SEPARATORS),
                add_start_index=True,
            )
        try:
            from langchain_experimental.text_splitter import SemanticChunker

            return SemanticChunker(
                embeddings=embeddings,
                breakpoint_threshold_type=kwargs.get(
                    "breakpoint_threshold_type", "percentile"
                ),
                breakpoint_threshold_amount=kwargs.get(
                    "breakpoint_threshold_amount", 95
                ),
            )
        except ImportError:
            logger.warning(
                "langchain_experimental not installed; falling back to recursive"
            )
            return RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=kwargs.get("separators", CHUNK_SEPARATORS),
                add_start_index=True,
            )
    logger.warning("Unknown chunking strategy %r, using recursive", strategy)
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=kwargs.get("separators", CHUNK_SEPARATORS),
        add_start_index=True,
    )
