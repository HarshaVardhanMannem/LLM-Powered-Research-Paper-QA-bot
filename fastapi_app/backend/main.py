import hashlib
import logging
import sys
import uuid
from pathlib import Path
from typing import List

import fitz  # PyMuPDF
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain.schema import Document
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from pydantic import BaseModel

from config.settings import LLM_MODEL, PAPER_IDS
from src.data.document_loader import (
    create_document_chunks,
    create_metadata_chunks,
    create_text_splitter,
    load_arxiv_documents,
    load_single_arxiv_document,
    preprocess_documents,
)
from src.prompts.chat_prompts import create_chat_prompt
from src.retrieval.vector_store import (
    add_documents_to_vector_store,
    aggregate_vector_stores,
    create_default_faiss,
    create_vector_stores,
    docs_to_string,
    reorder_documents,
)
from src.utils.feedback_store import FeedbackStore

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the root directory to Python path
root_dir = str(Path(__file__).parent.parent.parent)
sys.path.append(root_dir)
logger.debug(f"Added root directory to Python path: {root_dir}")

# Load environment variables
load_dotenv()

app = FastAPI(title="Research Papers QA API")

# Configuration constants
UPLOAD_FOLDER = "uploads/papers"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Create upload directory
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize feedback store
feedback_store = FeedbackStore()


# Initialize resources
def initialize_resources():
    logger.info("Starting resource initialization")
    try:
        logger.debug("Loading arXiv documents")
        docs = load_arxiv_documents()
        logger.debug(f"Loaded {len(docs)} documents")

        logger.debug("Preprocessing documents")
        docs = preprocess_documents(docs)
        logger.debug("Documents preprocessed successfully")

        logger.debug("Creating document chunks")
        docs_chunks = create_document_chunks(docs)
        logger.debug(f"Created {len(docs_chunks)} document chunks")

        logger.debug("Creating metadata chunks")
        extra_chunks, doc_string = create_metadata_chunks(docs_chunks)
        logger.debug("Metadata chunks created successfully")

        logger.debug("Creating vector stores")
        vecstores = create_vector_stores(docs_chunks, extra_chunks)
        logger.debug("Vector stores created successfully")

        logger.debug("Aggregating vector stores")
        docstore = aggregate_vector_stores(vecstores)
        logger.debug("Vector stores aggregated successfully")

        logger.debug("Creating conversation store")
        convstore = create_default_faiss()
        logger.debug("Conversation store created successfully")

        logger.debug(f"Initializing LLM with model: {LLM_MODEL}")
        llm = ChatNVIDIA(model=LLM_MODEL)
        logger.debug("LLM initialized successfully")

        logger.debug("Creating chat prompt")
        chat_prompt = create_chat_prompt()
        logger.debug("Chat prompt created successfully")

        loaded_papers = []
        for paper_id, doc_chunks in zip(PAPER_IDS, docs_chunks):
            # Use the paper_id from config, and get the title from the first chunk's
            # metadata
            title = "Untitled"
            if doc_chunks and len(doc_chunks) > 0:
                metadata = getattr(doc_chunks[0], "metadata", {})
                title = metadata.get("Title", "Untitled")
                loaded_papers.append({"id": paper_id, "title": title})
        logger.info(
            f"Resource initialization completed. Loaded {len(loaded_papers)} papers"
        )

        return {
            "docstore": docstore,
            "convstore": convstore,
            "llm": llm,
            "chat_prompt": chat_prompt,
            "doc_string": doc_string,
            "loaded_papers": loaded_papers,
        }
    except Exception as e:
        logger.error(f"Error during resource initialization: {str(e)}", exc_info=True)
        raise


# Initialize resources at startup
resources = initialize_resources()


# Pydantic models
class Question(BaseModel):
    text: str


class PaperAdd(BaseModel):
    paper_id: str


class Feedback(BaseModel):
    question: str
    answer: str
    feedback_type: str


class PaperInfo(BaseModel):
    id: str
    title: str


class ChatResponse(BaseModel):
    response: str
    papers: List[PaperInfo]


# API endpoints
@app.get("/")
async def root():
    return {"message": "Research Papers QA API"}


@app.get("/papers")
async def get_papers():
    return {"papers": resources["loaded_papers"]}


@app.post("/chat")
async def chat(question: Question):
    logger.info(f"Received chat request with question: {question.text[:100]}...")
    try:
        logger.debug("Creating retrieval chain")
        retrieval = {
            "input": question.text,
            "history": docs_to_string(
                reorder_documents(
                    resources["convstore"].as_retriever().invoke(question.text)
                )
            ),
            "context": docs_to_string(
                reorder_documents(
                    resources["docstore"].as_retriever().invoke(question.text)
                )
            ),
        }
        logger.debug("Retrieval chain created successfully")

        logger.debug("Generating response using chat prompt")
        response = resources["chat_prompt"].invoke(retrieval)
        logger.debug("Chat prompt generated successfully")

        logger.debug("Invoking LLM for final response")
        response = resources["llm"].invoke(response)
        logger.debug("LLM response generated successfully")

        logger.info("Chat request completed successfully")
        return ChatResponse(
            response=response.content,
            papers=[
                PaperInfo(id=paper["id"], title=paper["title"])
                for paper in resources["loaded_papers"]
            ],
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/papers/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload request for: {file.filename}")

    try:
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            logger.warning(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        # Read file contents
        contents = await file.read()

        # Validate file size
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds the limit of "
                f"{MAX_FILE_SIZE / (1024*1024)}MB.",
            )

        # Generate content hash to check for duplicates
        content_hash = hashlib.md5(contents).hexdigest()

        # Check if this file (by hash) has already been uploaded
        existing_paper = next(
            (
                p
                for p in resources["loaded_papers"]
                if p.get("content_hash") == content_hash
            ),
            None,
        )
        if existing_paper:
            logger.info(f"File already exists: {existing_paper['title']}")
            return {
                "message": f"File already uploaded: {existing_paper['title']}",
                "papers": resources["loaded_papers"],
            }

        # Load and process the document directly from memory
        logger.debug("Attempting to load PDF document from memory")
        doc = load_pdf_from_bytes(contents, filename=file.filename)

        # We get a single Document object back, not a list
        text_splitter = create_text_splitter()
        chunks = text_splitter.split_documents([doc])  # split_documents expects a list

        if not chunks:
            logger.error("Document processed but no chunks were created.")
            raise HTTPException(
                status_code=500, detail="Failed to process document into chunks."
            )

        # Add to vector store
        add_documents_to_vector_store(resources["docstore"], chunks)
        logger.debug("Documents added to vector store successfully.")

        # Update resources
        title = doc.metadata.get("Title", file.filename)
        paper_id = str(uuid.uuid4())

        # Add with content hash for duplicate detection
        resources["loaded_papers"].append(
            {"id": paper_id, "title": title, "content_hash": content_hash}
        )
        resources["doc_string"] += f"\n - {title}"

        logger.info(f"Successfully uploaded and processed paper: {title}")
        return {
            "message": f"Successfully uploaded and processed paper: {title}",
            "papers": resources["loaded_papers"],
        }

    except HTTPException as e:
        logger.warning(f"HTTP Exception during file upload: {e.detail}")
        raise e
    except Exception as e:
        logger.error(
            f"An unexpected error occurred during file upload: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


def add_paper_to_resources(paper_id, resources):
    """Add a new paper to existing resources."""
    try:
        # Check if paper already exists BEFORE processing
        if any(p["id"] == paper_id for p in resources["loaded_papers"]):
            existing_paper = next(
                p for p in resources["loaded_papers"] if p["id"] == paper_id
            )
            return True, f"Paper already loaded: {existing_paper['title']}"

        # Load single document
        new_doc = load_single_arxiv_document(paper_id)
        if not new_doc or len(new_doc) == 0:
            return False, f"Failed to load paper with ID: {paper_id}"

        # Preprocess
        new_doc = preprocess_documents([new_doc])
        new_doc_chunks = create_document_chunks(new_doc)

        # Validate chunks
        if (
            not new_doc_chunks
            or not new_doc_chunks[0]
            or len(new_doc_chunks[0]) == 0
        ):
            return (
                False,
                f"Paper loaded but no valid content chunks were created for: "
                f"{paper_id}",
            )

        # Add to vector store
        add_documents_to_vector_store(resources["docstore"], new_doc_chunks[0])

        # Update document string and loaded_papers
        metadata = getattr(new_doc_chunks[0][0], "metadata", {})
        title = metadata.get("Title", "Untitled")
        resources["doc_string"] += f"\n - {title}"
        resources["loaded_papers"].append({"id": paper_id, "title": title})

        return True, f"Successfully added paper: {title}"
    except Exception as e:
        return False, f"Error processing paper {paper_id}: {str(e)}"


@app.post("/papers/add")
async def add_paper(paper: PaperAdd):
    logger.info(f"Received request to add paper: {paper.paper_id}")
    try:
        success, message = add_paper_to_resources(paper.paper_id, resources)
        if success:
            logger.info(f"Successfully added paper: {paper.paper_id}")
            return {"message": message, "papers": resources["loaded_papers"]}
        else:
            logger.warning(f"Failed to add paper {paper.paper_id}: {message}")
            raise HTTPException(status_code=400, detail=message)
    except Exception as e:
        logger.error(f"Error adding paper: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
async def submit_feedback(feedback: Feedback):
    logger.info(
        f"Received feedback submission for question: {feedback.question[:100]}..."
    )
    try:
        feedback_store.save_feedback(
            feedback.question, feedback.answer, feedback.feedback_type
        )
        logger.info("Feedback saved successfully")
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def load_pdf_from_bytes(pdf_bytes, filename):
    """Loads a PDF from bytes and extracts text, returns a single Document object."""
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
        logger.error(f"Failed to load or read PDF {filename}: {str(e)}", exc_info=True)
        raise
    finally:
        if doc_reader:
            doc_reader.close()


@app.get("/feedback/stats")
async def get_feedback_stats():
    logger.info("Received request for feedback statistics")
    try:
        stats = feedback_store.get_feedback_stats()
        logger.info("Successfully retrieved feedback statistics")
        return stats
    except Exception as e:
        logger.error(f"Error retrieving feedback statistics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    logger.info("Starting FastAPI application")
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
