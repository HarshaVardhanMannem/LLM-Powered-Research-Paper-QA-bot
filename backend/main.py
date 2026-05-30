import hashlib
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, List, Optional

# flake8: noqa: E402
# Add the repository root to Python path before package imports. This lets
# `python main.py` work from inside the backend directory.
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.config.settings import LLM_MODEL
from backend.src.auth.deps import get_current_user
from backend.src.data.document_loader import (
    create_document_chunks,
    create_text_splitter,
    enrich_chunk_metadata,
    load_single_arxiv_document,
    normalize_paper_metadata,
    preprocess_documents,
)
from backend.src.db.models import KnowledgeBase, User
from backend.src.db.session import get_db, init_db
from backend.src.prompts.chat_prompts import create_chat_prompt
from backend.src.retrieval.qdrant_setup import init_qdrant_collection
from backend.src.retrieval.qdrant_store import QdrantStore
from backend.src.auth.routes import router as auth_router
from backend.src.knowledge.routes import router as kb_router
from backend.src.utils.conversation_store import (
    get_recent_conversation_history,
    save_conversation_turn,
)
from backend.src.utils.feedback_store_postgres import FeedbackStorePostgres

import fitz  # PyMuPDF
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.documents import Document
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

logger.debug(f"Added root directory to Python path: {root_dir}")

# Load environment variables
load_dotenv()

# Global resources (LLM, prompt, qdrant_store)
resources = None


def initialize_resources():
    """Initialize LLM, prompt, and Qdrant store (no per-user data loaded here)."""
    logger.info("Starting resource initialization")
    try:
        logger.debug(f"Initializing LLM with model: {LLM_MODEL}")
        llm = ChatNVIDIA(model=LLM_MODEL)
        logger.debug("LLM initialized successfully")

        logger.debug("Creating chat prompt")
        chat_prompt = create_chat_prompt()
        logger.debug("Chat prompt created successfully")

        logger.debug("Creating Qdrant store")
        qdrant_store = QdrantStore()
        logger.debug("Qdrant store created successfully")

        return {
            "llm": llm,
            "chat_prompt": chat_prompt,
            "qdrant_store": qdrant_store,
        }
    except Exception as e:
        logger.error(f"Error during resource initialization: {str(e)}", exc_info=True)
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    global resources
    logger.info("Starting application...")

    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(
            f"Database initialization failed: {e}\n"
            f"Please ensure PostgreSQL is running.\n"
            f"To start PostgreSQL: cd docker/postgres && docker-compose up -d\n"
            f"Or update POSTGRES_* variables in .env to match your PostgreSQL instance."
        )
        raise

    logger.info("Initializing Qdrant...")
    try:
        init_qdrant_collection()
        logger.info("Qdrant initialized successfully")
    except Exception as e:
        logger.error(f"Qdrant initialization failed: {e}")
        raise

    logger.info("Initializing resources...")
    resources = initialize_resources()
    logger.info("Application startup complete")

    yield

    logger.info("Shutting down application...")


app = FastAPI(title="Research Papers QA API", lifespan=lifespan)

UPLOAD_FOLDER = "uploads/papers"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

feedback_store_pg = FeedbackStorePostgres()

app.include_router(auth_router)
app.include_router(kb_router, prefix="/knowledge-bases")


def ensure_resources():
    """Ensure resources are initialized, raise HTTPException if not."""
    if resources is None:
        raise HTTPException(
            status_code=503,
            detail="Service is still initializing. Please try again in a moment.",
        )
    return resources


def docs_to_string(docs: list[Document]) -> str:
    """Convert document list to string representation."""
    if not docs:
        return "No relevant documents found."
    result = []
    for doc in docs:
        content = getattr(doc, "page_content", "")
        if not content or content.strip() == "":
            continue
        metadata = getattr(doc, "metadata", {})
        source = metadata.get("source", "")
        title = metadata.get("Title", "")
        section = metadata.get("section_title", "")
        authors = metadata.get("authors", "")
        published = metadata.get("published", "")
        header = f"Source: {source}" if source else ""
        header += f" Title: {title}" if title else ""
        header += f" Section: {section}" if section else ""
        header += f" Authors: {authors}" if authors else ""
        header += f" Published: {published}" if published else ""
        if header:
            result.append(f"{header}\n{content}\n")
        else:
            result.append(content)
    if not result:
        return "No relevant document content found."
    return "\n\n".join(result)


def history_to_string(history: list[tuple[str, str]]) -> str:
    """Convert conversation history to string for the prompt."""
    if not history:
        return "No conversation history."
    parts = []
    for role, content in history:
        prefix = "User" if role == "user" else "Assistant"
        parts.append(f"{prefix}: {content}")
    return "\n".join(parts)


# Pydantic models
class Question(BaseModel):
    text: str
    knowledge_base_ids: Optional[List[int]] = None


class PaperAdd(BaseModel):
    paper_id: str


class Feedback(BaseModel):
    question: str
    answer: str
    feedback_type: str


class PaperInfo(BaseModel):
    id: str
    title: str
    source: Optional[str] = None
    authors: Optional[str] = None
    published: Optional[str] = None
    primary_category: Optional[str] = None
    categories: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    papers: List[PaperInfo]


# API endpoints
@app.get("/")
async def root():
    return {"message": "Research Papers QA API"}


@app.get("/papers")
async def get_papers(current_user: Annotated[User, Depends(get_current_user)]):
    """Get papers belonging to the current user."""
    res = ensure_resources()
    papers = res["qdrant_store"].get_user_papers(current_user.id)
    return {"papers": papers}


@app.post("/chat")
async def chat(
    question: Question,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Chat with the user's papers or selected knowledge bases."""
    logger.info(f"User {current_user.id} asked: {question.text[:100]}...")
    res = ensure_resources()
    store: QdrantStore = res["qdrant_store"]
    try:
        if question.knowledge_base_ids:
            accessible = (
                db.query(KnowledgeBase.id)
                .filter(
                    KnowledgeBase.id.in_(question.knowledge_base_ids),
                    (KnowledgeBase.is_system.is_(True))
                    | (KnowledgeBase.owner_id == current_user.id),
                )
                .all()
            )
            accessible_ids = {row[0] for row in accessible}
            requested_ids = set(question.knowledge_base_ids)
            if accessible_ids != requested_ids:
                raise HTTPException(
                    status_code=403,
                    detail="One or more selected knowledge bases are not accessible.",
                )
            context_docs = store.search(
                query=question.text,
                user_id=None,
                limit=5,
                kb_ids=question.knowledge_base_ids,
            )
        else:
            context_docs = store.search(
                query=question.text,
                user_id=current_user.id,
                limit=5,
            )
        context_str = docs_to_string(context_docs)

        history = get_recent_conversation_history(db, current_user.id, limit=10)
        history_str = history_to_string(history)

        retrieval = {
            "input": question.text,
            "history": history_str,
            "context": context_str,
        }

        response = res["chat_prompt"].invoke(retrieval)
        response = res["llm"].invoke(response)

        save_conversation_turn(db, current_user.id, question.text, response.content)

        papers = store.get_user_papers(current_user.id)

        return ChatResponse(
            response=response.content,
            papers=[PaperInfo(**p) for p in papers],
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/papers/add")
async def add_paper(
    paper: PaperAdd,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Add an arXiv paper by ID. Each user gets their own copy."""
    logger.info(f"User {current_user.id} adding paper: {paper.paper_id}")
    res = ensure_resources()
    store: QdrantStore = res["qdrant_store"]

    if store.paper_exists_for_user(current_user.id, paper.paper_id):
        papers = store.get_user_papers(current_user.id)
        return {"message": f"Paper already loaded: {paper.paper_id}", "papers": papers}

    try:
        new_doc = load_single_arxiv_document(paper.paper_id)
        if not new_doc or len(new_doc) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to load paper with ID: {paper.paper_id}",
            )

        new_doc = preprocess_documents([new_doc])
        doc_chunks = create_document_chunks(new_doc)

        if not doc_chunks or not doc_chunks[0]:
            raise HTTPException(
                status_code=400,
                detail=f"No content chunks created for paper: {paper.paper_id}",
            )

        metadata = getattr(doc_chunks[0][0], "metadata", {})
        title = metadata.get("Title", "Untitled")

        store.add_documents(
            chunks=doc_chunks[0],
            user_id=current_user.id,
            paper_id=paper.paper_id,
            paper_title=title,
            source=f"arxiv:{paper.paper_id}",
        )

        papers = store.get_user_papers(current_user.id)
        return {"message": f"Successfully added paper: {title}", "papers": papers}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding paper: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/papers/upload")
async def upload_file(
    file: UploadFile,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Upload a PDF paper. Requires authentication; scoped to user."""
    logger.info(f"User {current_user.id} uploading file: {file.filename}")
    res = ensure_resources()
    store: QdrantStore = res["qdrant_store"]

    try:
        filename = file.filename or "uploaded.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024)}MB limit.",
            )

        content_hash = hashlib.md5(contents).hexdigest()
        paper_id = f"upload-{content_hash[:12]}"

        if store.paper_exists_for_user(current_user.id, paper_id):
            papers = store.get_user_papers(current_user.id)
            return {
                "message": f"File already uploaded: {filename}",
                "papers": papers,
            }

        doc = load_pdf_from_bytes(contents, filename=filename)
        doc.metadata["paper_metadata"] = normalize_paper_metadata(doc.metadata)
        text_splitter = create_text_splitter()
        chunks = enrich_chunk_metadata(text_splitter.split_documents([doc]))

        if not chunks:
            raise HTTPException(
                status_code=500, detail="Failed to process document into chunks."
            )

        title = str(doc.metadata.get("Title", filename))

        store.add_documents(
            chunks=chunks,
            user_id=current_user.id,
            paper_id=paper_id,
            paper_title=title,
            source=filename,
        )

        papers = store.get_user_papers(current_user.id)
        return {
            "message": f"Successfully uploaded: {title}",
            "papers": papers,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/papers/{paper_id}")
async def delete_paper(
    paper_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a paper from the current user's collection."""
    res = ensure_resources()
    store: QdrantStore = res["qdrant_store"]

    if not store.paper_exists_for_user(current_user.id, paper_id):
        raise HTTPException(status_code=404, detail="Paper not found")

    store.delete_user_paper(current_user.id, paper_id)
    papers = store.get_user_papers(current_user.id)
    return {"message": f"Paper {paper_id} deleted", "papers": papers}


@app.post("/feedback")
async def submit_feedback(
    feedback: Feedback,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Submit feedback. Requires authentication."""
    logger.info(f"User {current_user.id} feedback for: {feedback.question[:100]}...")
    try:
        feedback_store_pg.save_feedback(
            feedback.question,
            feedback.answer,
            feedback.feedback_type,
            db=db,
            user_id=current_user.id,
        )
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/feedback/stats")
async def get_feedback_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get feedback stats for the current user."""
    try:
        stats = feedback_store_pg.get_feedback_stats(db, user_id=current_user.id)
        return stats
    except Exception as e:
        logger.error(f"Error retrieving feedback stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations")
async def get_conversations(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get conversation history for the current user."""
    history = get_recent_conversation_history(db, current_user.id, limit=50)
    return {
        "conversations": [
            {"role": role, "content": content} for role, content in history
        ]
    }


def load_pdf_from_bytes(pdf_bytes, filename):
    """Loads a PDF from bytes and extracts text, returns a single Document."""
    doc_reader = None
    try:
        doc_reader = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc_reader:
            text += page.get_text()
        if not text.strip():
            raise ValueError("No text content found in PDF")
        return Document(
            page_content=text, metadata={"Title": filename, "source": filename}
        )
    except Exception as e:
        logger.error(f"Failed to read PDF {filename}: {str(e)}", exc_info=True)
        raise
    finally:
        if doc_reader:
            doc_reader.close()


if __name__ == "__main__":
    logger.info("Starting FastAPI application")
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
