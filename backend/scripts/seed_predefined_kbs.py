#!/usr/bin/env python3
"""Seed predefined/system knowledge bases from config. Usage:
  python -m scripts.seed_predefined_kbs [--ingest]
  When --ingest is passed, also runs bulk ingest using configured static paper IDs
  and arXiv category/year searches.
"""

import argparse
import logging
import sys
from pathlib import Path

# Add backend root to path
_backend = Path(__file__).resolve().parent.parent
_repo_root = _backend.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(_backend / ".env")

from backend.config.kb_config import (  # noqa: E402
    PREDEFINED_KB_DOMAINS,
    get_predefined_kb_specs,
    get_domain_paper_ids,
    load_custom_predefined_specs,
)
from backend.src.data.arxiv_search import search_latest_arxiv_ids  # noqa: E402
from backend.src.db.models import ChunkingStrategy, KnowledgeBase  # noqa: E402
from backend.src.db.session import SessionLocal, init_db  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def _find_existing_system_kb(db, name: str, domain: str) -> KnowledgeBase | None:
    return (
        db.query(KnowledgeBase)
        .filter(
            KnowledgeBase.name == name,
            KnowledgeBase.domain == domain,
            KnowledgeBase.is_system.is_(True),
        )
        .first()
    )


def _create_or_get_system_kb(db, name: str, description: str, domain: str) -> KnowledgeBase:
    existing = _find_existing_system_kb(db, name=name, domain=domain)
    if existing:
        logger.info("System KB already exists: %s (id=%s)", name, existing.id)
        return existing

    kb = KnowledgeBase(
        name=name,
        description=description,
        domain=domain,
        owner_id=None,
        is_system=True,
        chunking_strategy=ChunkingStrategy.section,
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)
    logger.info("Created system KB: %s (id=%s)", name, kb.id)
    return kb


def _ingest_arxiv_ids(kb: KnowledgeBase, paper_ids: list[str], limit: int | None) -> None:
    if not paper_ids:
        logger.info("No paper IDs for %s, skipping ingest", kb.name)
        return

    import csv
    import subprocess
    import tempfile

    if limit is not None:
        paper_ids = paper_ids[:limit]

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".csv", delete=False, newline=""
    ) as f:
        writer = csv.DictWriter(f, fieldnames=["arxiv_id"])
        writer.writeheader()
        for pid in paper_ids:
            writer.writerow({"arxiv_id": pid})
        manifest_path = Path(f.name)

    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "backend.scripts.bulk_ingest",
                "--kb-id",
                str(kb.id),
                "--manifest",
                str(manifest_path),
            ],
            cwd=str(_repo_root),
            check=True,
        )
    finally:
        manifest_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed predefined KBs")
    parser.add_argument(
        "--ingest",
        action="store_true",
        help="Also bulk ingest papers from PREDEFINED_KB_PAPER_IDS",
    )
    parser.add_argument(
        "--latest-from-arxiv",
        action="store_true",
        help="Resolve paper IDs from arXiv category/year searches before ingesting.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Override max papers per KB for this run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print KBs and arXiv queries without writing or ingesting.",
    )
    args = parser.parse_args()

    specs = get_predefined_kb_specs() + load_custom_predefined_specs()

    if args.dry_run:
        for spec in specs:
            max_papers = args.limit or spec.max_papers
            logger.info(
                "KB: %s | domain=%s | max=%s | query=%s",
                spec.name,
                spec.domain,
                max_papers,
                spec.arxiv_query,
            )
        return

    init_db()
    db = SessionLocal()

    try:
        for spec in specs:
            kb = _create_or_get_system_kb(
                db,
                name=spec.name,
                description=spec.description,
                domain=spec.domain,
            )
            if not args.ingest:
                continue

            max_papers = args.limit or spec.max_papers
            paper_ids = get_domain_paper_ids(spec.domain)
            if args.latest_from_arxiv:
                logger.info("Searching arXiv for %s: %s", spec.name, spec.arxiv_query)
                paper_ids = search_latest_arxiv_ids(
                    query=spec.arxiv_query,
                    max_results=max_papers,
                )
                logger.info("Resolved %d papers for %s", len(paper_ids), spec.name)
            _ingest_arxiv_ids(kb, paper_ids, limit=max_papers)
    finally:
        db.close()


if __name__ == "__main__":
    main()
