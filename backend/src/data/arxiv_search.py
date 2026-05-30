"""arXiv search helpers for predefined knowledge-base seeding."""

import logging
import re
from typing import List

logger = logging.getLogger(__name__)

ARXIV_ID_PATTERN = re.compile(r"(\d{4}\.\d{4,5})(?:v\d+)?")


def extract_arxiv_id(entry_id: str) -> str:
    """Extract a stable arXiv ID from an arXiv result URL or raw ID."""
    match = ARXIV_ID_PATTERN.search(entry_id)
    return match.group(1) if match else entry_id.rstrip("/").split("/")[-1]


def search_latest_arxiv_ids(query: str, max_results: int = 5) -> List[str]:
    """Return latest arXiv paper IDs for a query, sorted by submitted date."""
    try:
        import arxiv
    except ImportError:
        logger.error("The arxiv package is not installed.")
        return []

    client = arxiv.Client(page_size=max_results, delay_seconds=3, num_retries=3)
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending,
    )
    ids: List[str] = []
    for result in client.results(search):
        paper_id = extract_arxiv_id(getattr(result, "entry_id", ""))
        if paper_id and paper_id not in ids:
            ids.append(paper_id)
        if len(ids) >= max_results:
            break
    return ids
