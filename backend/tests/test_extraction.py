import sys
from types import SimpleNamespace

import pytest

from backend.src.data.extraction import extract_pdf_with_structure


class FakePage:
    def __init__(self, text):
        self._text = text

    def get_text(self):
        return self._text


class FakeDoc:
    def __init__(self, pages):
        self._pages = pages
        self.closed = False

    def __iter__(self):
        return iter(self._pages)

    def close(self):
        self.closed = True


def _install_fake_fitz(monkeypatch, pages):
    fake_fitz = SimpleNamespace(open=lambda **_: FakeDoc(pages))
    monkeypatch.setitem(sys.modules, "fitz", fake_fitz)


def test_extract_pdf_with_structure_uses_markdown(monkeypatch):
    _install_fake_fitz(monkeypatch, [FakePage("flat")])
    monkeypatch.setitem(
        sys.modules,
        "pymupdf4llm",
        SimpleNamespace(to_markdown=lambda *_: "# Title\nContent"),
    )

    doc = extract_pdf_with_structure(b"%PDF", "file.pdf", use_structure=True)

    assert doc.page_content.startswith("# Title")
    assert doc.metadata["Title"] == "file.pdf"
    assert doc.metadata["source"] == "file.pdf"


def test_extract_pdf_with_structure_falls_back_to_flat(monkeypatch):
    _install_fake_fitz(monkeypatch, [FakePage("page1"), FakePage("page2")])
    monkeypatch.setitem(sys.modules, "pymupdf4llm", None)

    doc = extract_pdf_with_structure(b"%PDF", "file.pdf", use_structure=True)

    assert doc.page_content == "page1page2"


def test_extract_pdf_with_structure_raises_on_empty_text(monkeypatch):
    _install_fake_fitz(monkeypatch, [FakePage(""), FakePage(" ")])

    with pytest.raises(ValueError):
        extract_pdf_with_structure(b"%PDF", "file.pdf", use_structure=False)
