"""Configuration for predefined knowledge bases."""

import json
import os
from typing import Dict, List

from dotenv import load_dotenv

load_dotenv()

# Comma-separated domain names for predefined KBs
PREDEFINED_KB_DOMAINS: List[str] = [
    d.strip()
    for d in os.getenv("PREDEFINED_KB_DOMAINS", "ML,NLP,Computer Vision").split(",")
    if d.strip()
]

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
