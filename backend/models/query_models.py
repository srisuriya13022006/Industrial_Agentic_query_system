from pydantic import BaseModel
from typing import List, Optional


class QueryRequest(BaseModel):
    """Request model for the /query endpoint."""

    question: str


class SourceReference(BaseModel):
    """A single source citation in the query response."""

    document: str
    detail: str


class QueryResponse(BaseModel):
    """Response model for the /query endpoint."""

    answer: str
    confidence: float
    sources: List[SourceReference]
    graph_context: List[str]
    key_entities: List[str]
    follow_up_suggestions: Optional[List[str]] = []
