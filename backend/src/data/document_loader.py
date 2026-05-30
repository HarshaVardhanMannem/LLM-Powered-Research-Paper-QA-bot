"""Document loading and preprocessing utilities."""

import json
import tempfile
import urllib.request
from typing import Any

from backend.config.settings import (
    CHUNK_OVERLAP,
    CHUNK_SEPARATORS,
    CHUNK_SIZE,
    MIN_CHUNK_LENGTH,
    PAPER_IDS,
)
from backend.src.data.chunking import get_chunker

import fitz
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def normalize_paper_metadata(metadata: dict[str, Any] | None) -> dict[str, Any]:
    """Return consistent paper metadata keys used for retrieval and display."""
    metadata = metadata or {}
    published = (
        metadata.get("Published")
        or metadata.get("published")
        or metadata.get("published_first_time")
        or metadata.get("Date")
        or ""
    )
    authors = metadata.get("Authors") or metadata.get("authors") or ""
    if isinstance(authors, list):
        authors = ", ".join(str(author) for author in authors)
    categories = metadata.get("Categories") or metadata.get("categories") or ""
    if isinstance(categories, list):
        categories = ", ".join(str(category) for category in categories)

    return {
        "title": metadata.get("Title") or metadata.get("title") or "Untitled",
        "authors": str(authors),
        "summary": metadata.get("Summary") or metadata.get("summary") or "",
        "published": str(published),
        "primary_category": metadata.get("primary_category")
        or metadata.get("Primary Category")
        or "",
        "categories": str(categories),
        "entry_id": metadata.get("entry_id") or metadata.get("Entry ID") or "",
        "doi": metadata.get("doi") or metadata.get("DOI") or "",
    }


def enrich_chunk_metadata(chunks):
    """Attach stable chunk indexes, totals, and normalized paper metadata."""
    total = len(chunks)
    for index, chunk in enumerate(chunks):
        meta = getattr(chunk, "metadata", {}) or {}
        paper_meta = normalize_paper_metadata(meta)
        meta.update(
            {
                "chunk_index": meta.get("chunk_index", index),
                "chunk_total": meta.get("chunk_total", total),
                "paper_metadata": paper_meta,
            }
        )
        chunk.metadata = meta
    return chunks


def create_text_splitter():
    """Create and return a text splitter for chunking documents."""
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=CHUNK_SEPARATORS,
    )


def load_arxiv_documents():
    """Load documents from Arxiv based on configured paper IDs."""
    print("Loading Documents")
    docs = []
    for paper_id in PAPER_IDS:
        try:
            if not paper_id or paper_id.strip() == "":
                print("Skipping empty paper ID")
                continue

            doc = load_single_arxiv_document(paper_id)
            if doc and len(doc) > 0:
                docs.append(doc)
            else:
                print(f"No document content returned for paper ID: {paper_id}")
        except Exception as e:
            print(f"Error loading paper {paper_id}: {e}")

    return docs


def load_single_arxiv_document(paper_id):
    """Load a single document from Arxiv based on paper ID."""
    if not paper_id or paper_id.strip() == "":
        print("Error: Empty paper ID provided")
        return None

    print(f"Loading paper {paper_id}")
    try:
        # Clean paper ID format if needed
        if paper_id.startswith(("arXiv:", "arxiv:")):
            paper_id = paper_id.split(":")[-1].strip()

        import arxiv

        client = arxiv.Client(page_size=1, delay_seconds=3, num_retries=3)
        search = arxiv.Search(id_list=[paper_id], max_results=1)
        result = next(client.results(search), None)
        if result is None:
            print(f"No arXiv result returned for paper ID: {paper_id}")
            return None

        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = f"{tmpdir}/{paper_id}.pdf"
            urllib.request.urlretrieve(result.pdf_url, pdf_path)
            with fitz.open(pdf_path) as pdf:
                text = "\n".join(page.get_text() for page in pdf)

        metadata = {
            "Title": result.title or "Untitled",
            "Authors": ", ".join(str(author) for author in result.authors),
            "Summary": result.summary or "",
            "Published": result.published.isoformat() if result.published else "",
            "primary_category": result.primary_category or "",
            "Categories": ", ".join(result.categories or []),
            "entry_id": result.entry_id or "",
            "doi": result.doi or "",
            "source": f"arxiv:{paper_id}",
        }
        doc = [Document(page_content=text, metadata=metadata)]

        # Validate document content
        if not doc or len(doc) == 0:
            print(f"No document content returned for paper ID: {paper_id}")
            return None

        if not hasattr(doc[0], "page_content") or not doc[0].page_content:
            print(f"Document has no page content for paper ID: {paper_id}")
            return None

        return doc
    except Exception as e:
        print(f"Error loading paper {paper_id}: {e}")
        return None


def preprocess_documents(docs):
    """Preprocess documents by truncating at References section."""
    processed_docs = []

    for doc in docs:
        if not doc or len(doc) == 0 or not hasattr(doc[0], "page_content"):
            continue

        content = json.dumps(doc[0].page_content)
        if "References" in content:
            doc[0].page_content = content[: content.index("References")]
        processed_docs.append(doc)

    return processed_docs


def create_document_chunks(docs):
    """Split documents into section-aware chunks and filter out short chunks."""
    chunker = get_chunker(strategy="section")
    print("Chunking Documents")

    docs_chunks = []
    for doc in docs:
        if (
            not doc
            or len(doc) == 0
            or not hasattr(doc[0], "page_content")
            or not doc[0].page_content
        ):
            docs_chunks.append([])
            continue

        if hasattr(chunker, "transform_documents"):
            chunks = chunker.transform_documents(doc)
        else:
            chunks = chunker.split_documents(doc)
        valid_chunks = [c for c in chunks if len(c.page_content) > MIN_CHUNK_LENGTH]
        docs_chunks.append(enrich_chunk_metadata(valid_chunks))

    return docs_chunks


def create_metadata_chunks(docs_chunks):
    """Create additional chunks with document metadata."""
    doc_string = "Available Documents:"
    doc_metadata = []

    for chunks in docs_chunks:
        if chunks and len(chunks) > 0:
            metadata = getattr(chunks[0], "metadata", {})
            title = metadata.get("Title", "Untitled")
            doc_string += f"\n - {title}"
            doc_metadata.append(str(metadata))

    if len(doc_metadata) == 0:
        doc_string += "\n - No documents loaded yet."

    return [doc_string] + doc_metadata, doc_string
