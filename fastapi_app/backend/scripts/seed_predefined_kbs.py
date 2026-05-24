#!/usr/bin/env python3
"""Seed predefined/system knowledge bases from config. Usage:
  python -m scripts.seed_predefined_kbs [--ingest]
  When --ingest is passed, also runs bulk ingest for each KB using PREDEFINED_KB_PAPER_IDS.
"""

import argparse
import sys
from pathlib import Path

# Add backend root to path
_backend = Path(__file__).resolve().parent.parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

from dotenv import load_dotenv

load_dotenv(_backend / ".env")

from config.kb_config import PREDEFINED_KB_DOMAINS, get_domain_paper_ids
from src.db.models import ChunkingStrategy, KnowledgeBase
from src.db.session import SessionLocal, init_db

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed predefined KBs")
    parser.add_argument(
        "--ingest",
        action="store_true",
        help="Also bulk ingest papers from PREDEFINED_KB_PAPER_IDS",
    )
    args = parser.parse_args()

    init_db()
    db = SessionLocal()

    try:
        for domain in PREDEFINED_KB_DOMAINS:
            existing = db.query(KnowledgeBase).filter(
                KnowledgeBase.domain == domain,
                KnowledgeBase.is_system == True,
            ).first()
            if existing:
                logger.info("Predefined KB for domain %s already exists (id=%s)", domain, existing.id)
                continue
            kb = KnowledgeBase(
                name=f"{domain} Knowledge Base",
                description=f"Predefined knowledge base for {domain}",
                domain=domain,
                owner_id=None,
                is_system=True,
                chunking_strategy=ChunkingStrategy.section,
            )
            db.add(kb)
            db.commit()
            db.refresh(kb)
            logger.info("Created predefined KB for domain %s (id=%s)", domain, kb.id)

        if args.ingest:
            import csv
            import subprocess
            import tempfile

            for domain in PREDEFINED_KB_DOMAINS:
                kb = db.query(KnowledgeBase).filter(
                    KnowledgeBase.domain == domain,
                    KnowledgeBase.is_system == True,
                ).first()
                if not kb:
                    continue
                paper_ids = get_domain_paper_ids(domain)
                if not paper_ids:
                    logger.info("No paper IDs for domain %s, skipping ingest", domain)
                    continue
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
                            "scripts.bulk_ingest",
                            "--kb-id",
                            str(kb.id),
                            "--manifest",
                            str(manifest_path),
                        ],
                        cwd=str(_backend),
                        check=True,
                    )
                finally:
                    manifest_path.unlink(missing_ok=True)
    finally:
        db.close()


if __name__ == "__main__":
    main()
