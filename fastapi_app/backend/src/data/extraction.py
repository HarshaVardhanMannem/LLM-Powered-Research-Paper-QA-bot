"""Structured PDF extraction using pymupdf4llm with fallback to flat extraction."""

import logging
from typing import List, Union

from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def extract_pdf_with_structure(
    pdf_bytes: bytes,
    filename: str,
    use_structure: bool = True,
) -> Union[Document, List[Document]]:
    """
    Extract PDF content with optional structure preservation via pymupdf4llm.

    When use_structure is True, uses pymupdf4llm.to_markdown for markdown output
    that preserves headings and section structure. Falls back to flat extraction
    if pymupdf4llm fails or is unavailable.

    Args:
        pdf_bytes: Raw PDF file bytes.
        filename: Original filename for metadata.
        use_structure: If True, attempt structured extraction; else use flat.

    Returns:
        Single Document with page_content (markdown when structured, plain text otherwise)
        and metadata (Title, source).
    """
    import fitz

    doc_reader = None
    try:
        doc_reader = fitz.open(stream=pdf_bytes, filetype="pdf")
        metadata = {"Title": filename, "source": filename}

        if use_structure:
            try:
                import pymupdf4llm

                markdown = pymupdf4llm.to_markdown(doc_reader)
                if markdown and markdown.strip():
                    return Document(page_content=markdown, metadata=metadata)
            except ImportError:
                logger.debug("pymupdf4llm not installed, falling back to flat extraction")
            except Exception as e:
                logger.warning(
                    "pymupdf4llm extraction failed (%s), falling back to flat extraction",
                    str(e),
                )

        # Flat extraction fallback
        text = ""
        for page in doc_reader:
            text += page.get_text()
        if not text.strip():
            raise ValueError("No text content found in PDF")
        return Document(page_content=text, metadata=metadata)

    except Exception as e:
        logger.error("Failed to extract PDF %s: %s", filename, str(e), exc_info=True)
        raise
    finally:
        if doc_reader:
            doc_reader.close()
