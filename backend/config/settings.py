"""Configuration settings for the application."""

import os

from dotenv import load_dotenv

load_dotenv()

# Model configurations
EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5"
LLM_MODEL = "meta/llama-3.3-70b-instruct"

# Extraction mode: "structure" (pymupdf4llm markdown) | "flat" (plain text)
EXTRACTION_MODE = os.getenv("EXTRACTION_MODE", "structure")

# Chunking parameters
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100
CHUNK_SEPARATORS = ["\n\n", "\n", ".", ";", ",", " "]
MIN_CHUNK_LENGTH = 200

# Arxiv paper IDs
PAPER_IDS = [
    "1706.03762",  # Attention Is All You Need Paper
    # "1810.04805",  # BERT Paper
    # "2005.11401",  # RAG Paper
    # "2205.00445",  # MRKL Paper
    # "2310.06825",  # Mistral Paper
    # "2306.05685",
    # "2110.15521",  # LLM-as-a-Judge
]

# System message for the chatbot
SYSTEM_MESSAGE = """You are a document chatbot. Help the user as they ask questions \
about documents.
User messaged just asked: {input}

From this, we have retrieved the following potentially-useful info:
Conversation History Retrieval:
{history}

Document Retrieval:
{context}

(Answer only from retrieval. Only cite sources that are used. Make your response \
conversational.)"""

# JWT / Auth
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
