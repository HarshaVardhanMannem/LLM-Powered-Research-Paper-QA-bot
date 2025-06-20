from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
import logging
from pathlib import Path
import shutil
from datetime import datetime
import uuid
import fitz  # PyMuPDF
from langchain.schema import Document

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the root directory to Python path
root_dir = str(Path(__file__).parent.parent.parent)
sys.path.append(root_dir)
logger.debug(f"Added root directory to Python path: {root_dir}")

from dotenv import load_dotenv
from src.utils.feedback_store import FeedbackStore
from src.data.document_loader import (
    load_arxiv_documents,
    preprocess_documents,
    create_document_chunks,
    create_metadata_chunks,
    load_single_arxiv_document
)
from src.embedding.embeddings import get_embedder
from src.retrieval.vector_store import (
    create_default_faiss,
    create_vector_stores,
    aggregate_vector_stores,
    reorder_documents,
    docs_to_string,
    add_documents_to_vector_store
)
from src.prompts.chat_prompts import create_chat_prompt
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from config.settings import LLM_MODEL, PAPER_IDS

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
            # Use the paper_id from config, and get the title from the first chunk's metadata
            title = "Untitled"
            if doc_chunks and len(doc_chunks) > 0:
                metadata = getattr(doc_chunks[0], 'metadata', {})
                title = metadata.get('Title', 'Untitled')
                loaded_papers.append({'id': paper_id, 'title': title})
        logger.info(f"Resource initialization completed. Loaded {len(loaded_papers)} papers")
        
        return {
            "docstore": docstore,
            "convstore": convstore,
            "llm": llm,
            "chat_prompt": chat_prompt,
            "doc_string": doc_string,
            "loaded_papers": loaded_papers
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
            "history": docs_to_string(reorder_documents(resources["convstore"].as_retriever().invoke(question.text))),
            "context": docs_to_string(reorder_documents(resources["docstore"].as_retriever().invoke(question.text)))
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
            papers=[PaperInfo(id=paper['id'], title=paper['title']) for paper in resources["loaded_papers"]]
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def add_paper_to_resources(paper_id, resources):
    """Add a new paper to existing resources."""
    try:
        # Load single document
        new_doc = load_single_arxiv_document(paper_id)
        if not new_doc or len(new_doc) == 0:
            return False, f"Failed to load paper with ID: {paper_id}"
        
        # Preprocess
        new_doc = preprocess_documents([new_doc])
        new_doc_chunks = create_document_chunks(new_doc)
        
        # Validate chunks
        if not new_doc_chunks or not new_doc_chunks[0] or len(new_doc_chunks[0]) == 0:
            return False, f"Paper loaded but no valid content chunks were created for: {paper_id}"
        
        # Add to vector store
        add_documents_to_vector_store(resources["docstore"], new_doc_chunks[0])
        
        # Update document string and loaded_papers
        metadata = getattr(new_doc_chunks[0][0], 'metadata', {})
        title = metadata.get('Title', 'Untitled')
        resources["doc_string"] += f"\n - {title}"
        if not any(p['id'] == paper_id for p in resources["loaded_papers"]):
            resources["loaded_papers"].append({'id': paper_id, 'title': title})
        
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
    logger.info(f"Received feedback submission for question: {feedback.question[:100]}...")
    try:
        feedback_store.save_feedback(
            feedback.question,
            feedback.answer,
            feedback.feedback_type
        )
        logger.info("Feedback saved successfully")
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
# Replace your upload_file function with this fixed version:

@app.post("/papers/upload")
async def upload_file(file: UploadFile = File(...)):
    logger.info(f"Received file upload request for: {file.filename}")
    logger.debug(f"File content type: {file.content_type}")
    file_path = None
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            logger.warning(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Create uploads directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save the uploaded file
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            logger.debug(f"File saved successfully at: {file_path}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(status_code=500, detail="Error saving uploaded file")
        
        # Load the PDF document
        try:
            logger.debug("Attempting to load PDF document")
            docs = load_pdf_as_document(file_path)  # Returns [Document]
            if not docs:
                logger.error("No documents were loaded from the PDF")
                raise HTTPException(status_code=400, detail="Failed to load PDF document")
            logger.debug(f"Successfully loaded {len(docs)} documents from PDF")
        except Exception as e:
            logger.error(f"Error loading PDF: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")
            
        # Preprocess the document - FIXED: wrap docs in another list
        try:
            logger.debug("Starting document preprocessing")
            # docs is [Document], but preprocess_documents expects [[Document]]
            docs_wrapped = [docs]  # Now it's [[Document]]
            docs_processed = preprocess_documents(docs_wrapped)  # Returns [[Document]]
            logger.debug("Document preprocessing completed")
            logger.debug("Creating document chunks")
            doc_chunks = create_document_chunks(docs_processed)  # Now gets correct format
            logger.debug(f"Created {len(doc_chunks)} document chunks")
        except Exception as e:
            logger.error(f"Error preprocessing document: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
        
        # Add to vector store
        try:
            logger.debug("Adding documents to vector store")
            # doc_chunks is now [chunks_for_paper1], so we use doc_chunks[0]
            add_documents_to_vector_store(resources["docstore"], doc_chunks[0])
            logger.debug("Documents added to vector store successfully")
        except Exception as e:
            logger.error(f"Error adding to vector store: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error adding document to vector store: {str(e)}")
        
        # Update document string and loaded_papers
        try:
            metadata = getattr(doc_chunks[0][0], 'metadata', {})
            title = metadata.get('Title', file.filename)  # Fallback to filename
            resources["doc_string"] += f"\n - {title}"
            
            # Generate a unique ID for the uploaded paper
            paper_id = str(uuid.uuid4())
            resources["loaded_papers"].append({'id': paper_id, 'title': title})
            logger.debug(f"Successfully added paper: {title} with ID: {paper_id}")
        except Exception as e:
            logger.error(f"Error updating resources: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error updating resources: {str(e)}")
        
        return {"message": f"Successfully uploaded and processed paper: {title}", "papers": resources["loaded_papers"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the file if it was created and there was an error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.debug(f"Cleaned up temporary file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file: {str(e)}")


# Also update your load_pdf_as_document function:
def load_pdf_as_document(file_path):
    try:
        logger.debug(f"Opening PDF file: {file_path}")
        doc = fitz.open(file_path)
        logger.debug(f"PDF opened successfully, number of pages: {len(doc)}")
        
        # Extract text from all pages
        text = ""
        for page in doc:
            page_text = page.get_text()
            if page_text.strip():  # Only add non-empty pages
                text += page_text + "\n"
        
        if not text.strip():
            raise ValueError("No readable text found in PDF")
            
        logger.debug(f"Extracted text length: {len(text)} characters")
        filename = os.path.basename(file_path)
        
        # Return list of Document objects (matching arxiv format)
        return [Document(page_content=text, metadata={"Title": filename, "source": file_path})]
        
    except Exception as e:
        logger.error(f"Error in load_pdf_as_document: {str(e)}", exc_info=True)
        raise
    finally:
        if 'doc' in locals():
            doc.close()

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