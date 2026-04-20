from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from langchain_core.documents import Document


def split_documents(documents: list[Document]) -> list[Document]:
    return documents
