#!/usr/bin/env python3
"""Bulk ingest documents into a knowledge base. Usage:
  python -m scripts.bulk_ingest --kb-id <id> --input-dir <path> [--limit 10000]
  python -m scripts.bulk_ingest --kb-id <id> --manifest <csv_path> [--limit 10000]

Input: Directory of PDFs (--input-dir) or manifest CSV with columns: path or arxiv_id, title (optional)
"""

import argparse
import csv
import hashlib
import logging
import sys
from pathlib import Path

# Add backend root to path
_backend = Path(__file__).resolve().parent.parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

from dotenv import load_dotenv

load_dotenv(_backend / ".env")

from config.settings import EXTRACTION_MODE
from src.data.chunking import get_chunker
from src.data.document_loader import load_single_arxiv_document, preprocess_documents
from src.data.extraction import extract_pdf_with_structure
from src.db.models import KnowledgeBase, KnowledgeBaseDocument
from src.db.session import SessionLocal, init_db
from src.embedding.embeddings import get_embedder
from src.retrieval.qdrant_setup import init_qdrant_collection
from src.retrieval.qdrant_store import QdrantStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

BATCH_SIZE = 64


def load_kb(db, kb_id: int) -> KnowledgeBase | None:
    return db.get(KnowledgeBase, kb_id)


def process_pdf(
    path: Path,
    store: QdrantStore,
    kb: KnowledgeBase,
    chunker,
    use_structure: bool,
) -> tuple[int, str, str]:
    """Process a single PDF and return (chunk_count, paper_id, title)."""
    with path.open("rb") as f:
        contents = f.read()
    content_hash = hashlib.md5(contents).hexdigest()
    paper_id = f"upload-{content_hash[:12]}"
    if store.document_exists_in_kb(kb.id, paper_id):
        return 0, paper_id, path.stem
    doc = extract_pdf_with_structure(contents, path.name, use_structure=use_structure)
    title = doc.metadata.get("Title", path.stem)
    source = str(path)
    if hasattr(chunker, "split_documents"):
        chunks = chunker.split_documents([doc])
    else:
        chunks = chunker.transform_documents([doc])
    valid = [c for c in chunks if getattr(c, "page_content", "").strip()]
    if not valid:
        return 0, paper_id, title
    store.add_documents(
        chunks=valid,
        user_id=0,
        paper_id=paper_id,
        paper_title=title,
        source=source,
        kb_id=kb.id,
        domain=kb.domain,
    )
    return len(valid), paper_id, title


def process_arxiv(
    arxiv_id: str,
    store: QdrantStore,
    kb: KnowledgeBase,
    chunker,
) -> tuple[int, str, str]:
    """Process a single ArXiv paper and return (chunk_count, paper_id, title)."""
    arxiv_id = arxiv_id.strip()
    if arxiv_id.startswith(("arXiv:", "arxiv:")):
        arxiv_id = arxiv_id.split(":")[-1].strip()
    if store.document_exists_in_kb(kb.id, arxiv_id):
        return 0, arxiv_id, ""
    new_doc = load_single_arxiv_document(arxiv_id)
    if not new_doc or len(new_doc) == 0:
        return 0, arxiv_id, ""
    processed = preprocess_documents([new_doc])
    if not processed or not processed[0]:
        return 0, arxiv_id, ""
    doc = processed[0][0]
    title = getattr(doc, "metadata", {}).get("Title", "Untitled")
    source = f"arxiv:{arxiv_id}"
    if hasattr(chunker, "split_documents"):
        chunks = chunker.split_documents([doc])
    else:
        chunks = chunker.transform_documents([doc])
    valid = [c for c in chunks if getattr(c, "page_content", "").strip()]
    if not valid:
        return 0, arxiv_id, title
    store.add_documents(
        chunks=valid,
        user_id=0,
        paper_id=arxiv_id,
        paper_title=title,
        source=source,
        kb_id=kb.id,
        domain=kb.domain,
    )
    return len(valid), arxiv_id, title


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk ingest documents into a KB")
    parser.add_argument("--kb-id", type=int, required=True, help="Knowledge base ID")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--input-dir", type=Path, help="Directory of PDF files")
    group.add_argument("--manifest", type=Path, help="CSV with path or arxiv_id column")
    parser.add_argument(
        "--limit", type=int, default=10000, help="Max documents (default 10000)"
    )
    args = parser.parse_args()

    init_db()
    init_qdrant_collection()
    db = SessionLocal()
    store = QdrantStore()

    kb = load_kb(db, args.kb_id)
    if not kb:
        logger.error("Knowledge base %s not found", args.kb_id)
        sys.exit(1)

    use_structure = EXTRACTION_MODE == "structure"
    embeddings = get_embedder() if kb.chunking_strategy.value == "semantic" else None
    chunker = get_chunker(
        strategy=kb.chunking_strategy.value,
        embeddings=embeddings,
    )

    docs_to_process: list[tuple[str, str | None]] = []  # (type, path_or_id)
    if args.input_dir:
        if not args.input_dir.is_dir():
            logger.error("Input dir %s is not a directory", args.input_dir)
            sys.exit(1)
        for p in sorted(args.input_dir.glob("**/*.pdf")):
            docs_to_process.append(("pdf", str(p)))
    else:
        with args.manifest.open(newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if "path" in row and row["path"].strip():
                    docs_to_process.append(("pdf", row["path"].strip()))
                elif "arxiv_id" in row and row["arxiv_id"].strip():
                    docs_to_process.append(("arxiv", row["arxiv_id"].strip()))

    if args.limit < len(docs_to_process):
        docs_to_process = docs_to_process[: args.limit]

    logger.info(
        "Ingesting up to %d documents into KB %s (%s)",
        len(docs_to_process),
        args.kb_id,
        kb.name,
    )
    total_chunks = 0
    success = 0
    for i, (dtype, val) in enumerate(docs_to_process):
        try:
            if dtype == "pdf":
                count, pid, title = process_pdf(
                    Path(val), store, kb, chunker, use_structure
                )
            else:
                count, pid, title = process_arxiv(val, store, kb, chunker)
            if count > 0:
                total_chunks += count
                success += 1
                kbdoc = KnowledgeBaseDocument(
                    kb_id=kb.id,
                    document_id=pid,
                    title=title or pid,
                    source=val,
                    chunk_count=count,
                )
                db.add(kbdoc)
                db.commit()
        except Exception as e:
            logger.warning("Failed %s: %s", val, e)
            db.rollback()
        if (i + 1) % 100 == 0:
            logger.info("Processed %d/%d documents", i + 1, len(docs_to_process))

    db.close()
    logger.info("Done. Ingested %d documents, %d chunks total", success, total_chunks)


if __name__ == "__main__":
    main()
