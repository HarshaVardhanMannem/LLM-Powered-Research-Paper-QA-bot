from dataclasses import dataclass

from backend.src.retrieval import vector_store as vector_store_module


class DummyStore:
    def __init__(self):
        self.added_docs = []
        self.merged_from = []

    def add_documents(self, docs):
        self.added_docs.extend(docs)

    def merge_from(self, store):
        self.merged_from.append(store)


class DummyFAISS:
    @staticmethod
    def from_texts(texts, embedder):
        return DummyStore()

    @staticmethod
    def from_documents(docs, embedder):
        store = DummyStore()
        store.add_documents(docs)
        return store


@dataclass
class DummyDoc:
    page_content: str
    metadata: dict


class DocWithScore:
    def __init__(self, relevance_score):
        self.relevance_score = relevance_score


class DocWithoutScore:
    pass


def test_create_default_faiss(monkeypatch):
    monkeypatch.setattr(vector_store_module, "FAISS", DummyFAISS)
    monkeypatch.setattr(vector_store_module, "get_embedder", lambda: "embedder")

    store = vector_store_module.create_default_faiss()

    assert isinstance(store, DummyStore)


def test_create_vector_store_empty_uses_default(monkeypatch):
    sentinel = DummyStore()
    monkeypatch.setattr(vector_store_module, "create_default_faiss", lambda: sentinel)

    store = vector_store_module.create_vector_store([], embedder="embedder")

    assert store is sentinel


def test_create_vector_stores_handles_extra_docs(monkeypatch):
    monkeypatch.setattr(vector_store_module, "FAISS", DummyFAISS)
    monkeypatch.setattr(vector_store_module, "get_embedder", lambda: "embedder")

    docs_a = [DummyDoc(page_content="a", metadata={})]
    docs_b = [DummyDoc(page_content="b", metadata={})]

    stores = vector_store_module.create_vector_stores(
        [docs_a, [], docs_b],
        extra_docs_list=[" ", "extra"],
    )

    assert len(stores) == 3


def test_aggregate_vector_stores_merges(monkeypatch):
    store_a = DummyStore()
    store_b = DummyStore()
    store_c = DummyStore()

    aggregated = vector_store_module.aggregate_vector_stores(
        [store_a, store_b, store_c]
    )

    assert aggregated is store_a
    assert store_a.merged_from == [store_b, store_c]


def test_aggregate_vector_stores_empty_uses_default(monkeypatch):
    sentinel = DummyStore()
    monkeypatch.setattr(vector_store_module, "create_default_faiss", lambda: sentinel)

    assert vector_store_module.aggregate_vector_stores([]) is sentinel


def test_add_documents_to_vector_store_filters_invalid_chunks():
    store = DummyStore()
    valid = DummyDoc(page_content="content", metadata={})
    invalid = DummyDoc(page_content=" ", metadata={})

    result = vector_store_module.add_documents_to_vector_store(
        store,
        [valid, invalid],
    )

    assert result is store
    assert store.added_docs == [valid]


def test_add_documents_to_vector_store_empty_noop():
    store = DummyStore()

    result = vector_store_module.add_documents_to_vector_store(store, [])

    assert result is store
    assert store.added_docs == []


def test_reorder_documents_by_score():
    docs = [DocWithScore(1), DocWithScore(5), DocWithScore(3)]

    ordered = vector_store_module.reorder_documents(docs)

    assert [doc.relevance_score for doc in ordered] == [5, 3, 1]


def test_reorder_documents_missing_score_defaults_zero():
    docs = [DocWithScore(2), DocWithoutScore()]

    ordered = vector_store_module.reorder_documents(docs)

    assert ordered[0].relevance_score == 2


def test_docs_to_string_formats_headers():
    docs = [
        DummyDoc(page_content="content", metadata={"source": "src", "Title": "Title"})
    ]

    result = vector_store_module.docs_to_string(docs)

    assert "Source: src" in result
    assert "Title: Title" in result
    assert "content" in result


def test_docs_to_string_empty_returns_message():
    assert vector_store_module.docs_to_string([]) == "No relevant documents found."
