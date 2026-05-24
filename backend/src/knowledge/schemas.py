"""Pydantic schemas for knowledge base API."""

from typing import Optional

from pydantic import BaseModel, Field


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    domain: str = Field(..., min_length=1, max_length=100)
    chunking_strategy: str = Field(
        default="recursive", pattern="^(recursive|section|semantic)$"
    )


class KnowledgeBaseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    chunking_strategy: Optional[str] = Field(
        None, pattern="^(recursive|section|semantic)$"
    )


class KnowledgeBaseResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    domain: str
    owner_id: Optional[int] = None
    is_system: bool
    chunking_strategy: str
    document_count: int = 0

    class Config:
        from_attributes = True


class KBDocumentAdd(BaseModel):
    paper_id: Optional[str] = None
