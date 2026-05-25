"""Knowledge base CRUD and document management routes."""

import hashlib
import logging
from typing import Annotated, List, Optional

from backend.config.settings import EXTRACTION_MODE
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.auth.deps import get_current_user
from backend.src.data.chunking import get_chunker
from backend.src.data.document_loader import (
    load_single_arxiv_document,
    preprocess_documents,
)
from backend.src.data.extraction import extract_pdf_with_structure
from backend.src.db.models import (
    ChunkingStrategy,
    KnowledgeBase,
    KnowledgeBaseDocument,
    User,
)
from backend.src.db.session import get_db
from backend.src.embedding.embeddings import get_embedder
from backend.src.knowledge.schemas import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
)
from backend.src.retrieval.qdrant_store import QdrantStore

logger = logging.getLogger(__name__)

router = APIRouter(tags=["knowledge-bases"])


def _get_store() -> QdrantStore:
    from backend.main import ensure_resources

    res = ensure_resources()
    return res["qdrant_store"]


def _kb_to_response(
    kb: KnowledgeBase, db: Session, store: QdrantStore
) -> KnowledgeBaseResponse:
    docs = store.get_kb_documents(kb.id)
    return KnowledgeBaseResponse(
        id=kb.id,
        name=kb.name,
        description=kb.description,
        domain=kb.domain,
        owner_id=kb.owner_id,
        is_system=kb.is_system,
        chunking_strategy=kb.chunking_strategy.value,
        document_count=len(docs),
    )


def _user_can_access_kb(kb: KnowledgeBase, user: User) -> bool:
    if kb.is_system:
        return True
    return kb.owner_id == user.id


def _user_can_modify_kb(kb: KnowledgeBase, user: User) -> bool:
    return not kb.is_system and kb.owner_id == user.id


@router.get("", response_model=List[KnowledgeBaseResponse])
async def list_knowledge_bases(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List system KBs and KBs owned by the current user."""
    store = _get_store()
    rows = (
        db.execute(
            select(KnowledgeBase).where(
                KnowledgeBase.is_system.is_(True)
                | (KnowledgeBase.owner_id == current_user.id)
            )
        )
        .scalars()
        .all()
    )
    return [_kb_to_response(kb, db, store) for kb in rows]


@router.post("", response_model=KnowledgeBaseResponse)
async def create_knowledge_base(
    body: KnowledgeBaseCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a user-owned knowledge base."""
    kb = KnowledgeBase(
        name=body.name,
        description=body.description,
        domain=body.domain,
        owner_id=current_user.id,
        is_system=False,
        chunking_strategy=ChunkingStrategy(body.chunking_strategy),
    )
    db.add(kb)
    db.commit()
    db.refresh(kb)
    store = _get_store()
    return _kb_to_response(kb, db, store)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(
    kb_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a knowledge base by ID."""
    kb = db.get(KnowledgeBase, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if not _user_can_access_kb(kb, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    store = _get_store()
    return _kb_to_response(kb, db, store)


@router.patch("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: int,
    body: KnowledgeBaseUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update a user-owned knowledge base."""
    kb = db.get(KnowledgeBase, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if not _user_can_modify_kb(kb, current_user):
        raise HTTPException(status_code=403, detail="Cannot modify this knowledge base")
    if body.name is not None:
        kb.name = body.name
    if body.description is not None:
        kb.description = body.description
    if body.chunking_strategy is not None:
        kb.chunking_strategy = ChunkingStrategy(body.chunking_strategy)
    db.commit()
    db.refresh(kb)
    store = _get_store()
    return _kb_to_response(kb, db, store)


@router.delete("/{kb_id}")
async def delete_knowledge_base(
    kb_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a user-owned knowledge base and all its documents."""
    kb = db.get(KnowledgeBase, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if not _user_can_modify_kb(kb, current_user):
        raise HTTPException(status_code=403, detail="Cannot delete this knowledge base")
    store = _get_store()
    store.delete_kb(kb_id)
    db.delete(kb)
    db.commit()
    return {"message": f"Knowledge base {kb_id} deleted"}


@router.post("/{kb_id}/documents")
async def add_document_to_kb(
    kb_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: Optional[UploadFile] = File(None),
    paper_id: Optional[str] = Form(None),
):
    """Add a document to a KB via ArXiv ID or PDF upload."""
    kb = db.get(KnowledgeBase, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if not _user_can_modify_kb(kb, current_user):
        raise HTTPException(status_code=403, detail="Cannot add documents to this KB")

    if file and paper_id:
        raise HTTPException(
            status_code=400,
            detail="Provide either paper_id or file upload, not both.",
        )
    if not file and not paper_id:
        raise HTTPException(
            status_code=400,
            detail="Provide paper_id or file upload.",
        )

    store = _get_store()
    use_structure = EXTRACTION_MODE == "structure"
    strategy = kb.chunking_strategy.value
    embeddings = get_embedder() if strategy == "semantic" else None
    chunker = get_chunker(
        strategy=strategy,
        embeddings=embeddings,
    )

    try:
        if paper_id:
            paper_id = paper_id.strip()
            if paper_id.startswith(("arXiv:", "arxiv:")):
                paper_id = paper_id.split(":")[-1].strip()
            if store.document_exists_in_kb(kb.id, paper_id):
                docs = store.get_kb_documents(kb.id)
                return {"message": f"Paper {paper_id} already in KB", "documents": docs}

            new_doc = load_single_arxiv_document(paper_id)
            if not new_doc or len(new_doc) == 0:
                raise HTTPException(
                    status_code=400, detail=f"Failed to load paper {paper_id}"
                )
            processed = preprocess_documents([new_doc])
            if not processed or not processed[0]:
                raise HTTPException(status_code=400, detail="No document content")
            doc = processed[0][0]
            title = getattr(doc, "metadata", {}).get("Title", "Untitled")
            source = f"arxiv:{paper_id}"
        else:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF files allowed")
            contents = await file.read()
            MAX_SIZE = 10 * 1024 * 1024
            if len(contents) > MAX_SIZE:
                raise HTTPException(status_code=413, detail="File too large")
            content_hash = hashlib.md5(contents).hexdigest()
            paper_id = f"upload-{content_hash[:12]}"
            if store.document_exists_in_kb(kb.id, paper_id):
                docs = store.get_kb_documents(kb.id)
                return {"message": "File already in KB", "documents": docs}
            doc = extract_pdf_with_structure(
                contents, file.filename, use_structure=use_structure
            )
            title = doc.metadata.get("Title", file.filename)
            source = file.filename

        if hasattr(chunker, "split_documents"):
            chunks = chunker.split_documents([doc])
        elif hasattr(chunker, "transform_documents"):
            chunks = chunker.transform_documents([doc])
        else:
            raise HTTPException(
                status_code=500, detail="Chunker has no split/transform method"
            )

        valid = [c for c in chunks if getattr(c, "page_content", "").strip()]
        if not valid:
            raise HTTPException(status_code=400, detail="No valid chunks from document")

        store.add_documents(
            chunks=valid,
            user_id=0,
            paper_id=paper_id,
            paper_title=title,
            source=source,
            kb_id=kb.id,
            domain=kb.domain,
        )
        kbdoc = KnowledgeBaseDocument(
            kb_id=kb.id,
            document_id=paper_id,
            title=title,
            source=source,
            chunk_count=len(valid),
        )
        db.add(kbdoc)
        db.commit()

        docs = store.get_kb_documents(kb.id)
        return {"message": f"Added {title}", "documents": docs}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error adding document to KB: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{kb_id}/documents/{doc_id}")
async def remove_document_from_kb(
    kb_id: int,
    doc_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Remove a document from a knowledge base."""
    kb = db.get(KnowledgeBase, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    if not _user_can_modify_kb(kb, current_user):
        raise HTTPException(status_code=403, detail="Cannot modify this KB")

    store = _get_store()
    if not store.document_exists_in_kb(kb.id, doc_id):
        raise HTTPException(status_code=404, detail="Document not found in KB")

    from qdrant_client.http.models import FieldCondition, Filter, MatchValue

    store.client.delete(
        collection_name=store.collection_name,
        points_selector=Filter(
            must=[
                FieldCondition(key="kb_id", match=MatchValue(value=kb_id)),
                FieldCondition(key="paper_id", match=MatchValue(value=doc_id)),
            ]
        ),
    )
    kbdoc = (
        db.execute(
            select(KnowledgeBaseDocument).where(
                KnowledgeBaseDocument.kb_id == kb_id,
                KnowledgeBaseDocument.document_id == doc_id,
            )
        )
        .scalars()
        .first()
    )
    if kbdoc:
        db.delete(kbdoc)
        db.commit()

    docs = store.get_kb_documents(kb.id)
    return {"message": f"Document {doc_id} removed", "documents": docs}
