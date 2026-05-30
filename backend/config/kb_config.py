"""Configuration for predefined knowledge bases."""

import json
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class PredefinedKBSpec:
    """A system KB definition, optionally backed by an arXiv search."""

    key: str
    name: str
    description: str
    domain: str
    arxiv_categories: List[str]
    year: Optional[int] = None
    max_papers: int = 5

    @property
    def arxiv_query(self) -> str:
        category_query = " OR ".join(f"cat:{cat}" for cat in self.arxiv_categories)
        if self.year is None:
            return f"({category_query})"
        start = f"{self.year}01010000"
        end = f"{self.year}12312359"
        return f"({category_query}) AND submittedDate:[{start} TO {end}]"

# Comma-separated domain names for predefined KBs
PREDEFINED_KB_DOMAINS: List[str] = [
    d.strip()
    for d in os.getenv("PREDEFINED_KB_DOMAINS", "ML,NLP,Computer Vision").split(",")
    if d.strip()
]

DEFAULT_DOMAIN_CATEGORIES: Dict[str, List[str]] = {
    "ML": ["cs.LG", "stat.ML"],
    "NLP": ["cs.CL"],
    "Computer Vision": ["cs.CV"],
    "AI": ["cs.AI"],
    "Information Retrieval": ["cs.IR"],
}

PREDEFINED_KB_ARXIV_CATEGORIES: Dict[str, List[str]] = DEFAULT_DOMAIN_CATEGORIES
_raw_categories = os.getenv("PREDEFINED_KB_ARXIV_CATEGORIES")
if _raw_categories and _raw_categories.strip():
    try:
        parsed = json.loads(_raw_categories)
        PREDEFINED_KB_ARXIV_CATEGORIES = {
            str(domain): [str(cat) for cat in categories]
            for domain, categories in parsed.items()
        }
    except (TypeError, json.JSONDecodeError):
        pass

_current_year = datetime.utcnow().year
PREDEFINED_KB_YEARS: List[int] = [
    int(y.strip())
    for y in os.getenv(
        "PREDEFINED_KB_YEARS",
        f"{_current_year},{_current_year - 1}",
    ).split(",")
    if y.strip().isdigit()
]
PREDEFINED_KB_INCLUDE_LATEST = os.getenv(
    "PREDEFINED_KB_INCLUDE_LATEST", "true"
).lower() in {"1", "true", "yes"}
PREDEFINED_KB_MAX_PAPERS = int(os.getenv("PREDEFINED_KB_MAX_PAPERS", "5"))

# Optional: JSON mapping domain -> list of arXiv paper IDs
# e.g. PREDEFINED_KB_PAPER_IDS='{"ML":["1706.03762","2005.11401"],"NLP":["1810.04805"]}'
PREDEFINED_KB_PAPER_IDS: Dict[str, List[str]] = {}
_raw = os.getenv("PREDEFINED_KB_PAPER_IDS")
if _raw and _raw.strip():
    try:
        PREDEFINED_KB_PAPER_IDS = json.loads(_raw)
    except json.JSONDecodeError:
        pass


def get_domain_paper_ids(domain: str) -> List[str]:
    """Return arXiv paper IDs for a predefined domain."""
    return PREDEFINED_KB_PAPER_IDS.get(domain, [])


def _domain_categories(domain: str) -> List[str]:
    return PREDEFINED_KB_ARXIV_CATEGORIES.get(domain, [])


def get_predefined_kb_specs() -> List[PredefinedKBSpec]:
    """Build predefined KB specs from configured domains, categories, and years."""
    specs: List[PredefinedKBSpec] = []
    for domain in PREDEFINED_KB_DOMAINS:
        categories = _domain_categories(domain)
        if not categories:
            categories = [domain]
        if PREDEFINED_KB_INCLUDE_LATEST:
            specs.append(
                PredefinedKBSpec(
                    key=f"{domain}:latest",
                    name=f"{domain} Latest Research",
                    description=(
                        f"Latest arXiv papers for {domain} "
                        f"({', '.join(categories)})."
                    ),
                    domain=domain,
                    arxiv_categories=categories,
                    max_papers=PREDEFINED_KB_MAX_PAPERS,
                )
            )
        for year in PREDEFINED_KB_YEARS:
            specs.append(
                PredefinedKBSpec(
                    key=f"{domain}:{year}",
                    name=f"{domain} Research {year}",
                    description=(
                        f"arXiv papers for {domain} published in {year} "
                        f"({', '.join(categories)})."
                    ),
                    domain=domain,
                    arxiv_categories=categories,
                    year=year,
                    max_papers=PREDEFINED_KB_MAX_PAPERS,
                )
            )
    return specs


def load_custom_predefined_specs(raw: str | None = None) -> List[PredefinedKBSpec]:
    """Parse optional JSON custom KB specs from PREDEFINED_KB_SPECS."""
    raw = raw if raw is not None else os.getenv("PREDEFINED_KB_SPECS")
    if not raw or not raw.strip():
        return []
    try:
        values: list[dict[str, Any]] = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return []
    specs = []
    for item in values:
        domain = str(item.get("domain", "")).strip()
        categories = [str(cat) for cat in item.get("arxiv_categories", []) if cat]
        if not domain or not categories:
            continue
        year = item.get("year")
        specs.append(
            PredefinedKBSpec(
                key=str(item.get("key") or f"{domain}:{year or 'latest'}"),
                name=str(item.get("name") or f"{domain} Research"),
                description=str(item.get("description") or ""),
                domain=domain,
                arxiv_categories=categories,
                year=int(year) if year else None,
                max_papers=int(item.get("max_papers", PREDEFINED_KB_MAX_PAPERS)),
            )
        )
    return specs
