from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.src.data.chunking import SectionChunker, get_chunker


def test_section_chunker_merges_metadata():
    chunker = SectionChunker(chunk_size=50, chunk_overlap=0, min_chunk_length=1)
    doc = Document(page_content="# Title\n\nBody text.", metadata={"source": "x"})

    chunks = chunker.transform_documents([doc])

    assert chunks
    first = chunks[0]
    assert first.metadata["section_title"] == "Title"
    assert first.metadata["section_level"] == 1
    assert first.metadata["chunk_index"] == 0


def test_section_chunker_falls_back_when_header_split_fails(monkeypatch):
    chunker = SectionChunker(chunk_size=1000, chunk_overlap=0, min_chunk_length=1)
    monkeypatch.setattr(
        chunker._header_splitter,
        "split_text",
        lambda *_: (_ for _ in ()).throw(ValueError("fail")),
    )

    doc = Document(page_content="# Title\n\nBody text.", metadata={"source": "x"})
    chunks = chunker.transform_documents([doc])

    assert chunks
    assert chunks[0].page_content


def test_get_chunker_returns_section_chunker():
    chunker = get_chunker(strategy="section")

    assert isinstance(chunker, SectionChunker)


def test_get_chunker_semantic_missing_embeddings_falls_back():
    chunker = get_chunker(strategy="semantic", embeddings=None)

    assert isinstance(chunker, RecursiveCharacterTextSplitter)


def test_get_chunker_unknown_strategy_falls_back():
    chunker = get_chunker(strategy="unknown")

    assert isinstance(chunker, RecursiveCharacterTextSplitter)
