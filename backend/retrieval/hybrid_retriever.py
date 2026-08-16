from backend.retrieval.vector_retriever import VectorRetriever
from backend.retrieval.graph_retriever import GraphRetriever


class HybridRetriever:
    """
    Combines vector-based semantic search with knowledge graph
    traversal to provide richer context for answer generation.

    Vector retrieval finds semantically similar document chunks.
    Graph retrieval finds structurally related entities and relationships.
    Together they give the LLM both textual evidence and relational context.
    """

    def __init__(self):

        self.vector_retriever = VectorRetriever()
        self.graph_retriever = GraphRetriever()

    def retrieve(self, question: str, entities: list) -> dict:
        """
        Perform hybrid retrieval using both vector search and
        graph traversal.

        Args:
            question: The user's natural-language question.
            entities: List of entity names extracted from the question.

        Returns:
            Dictionary with 'vector_results' and 'graph_results'.
        """

        # Step 1 — Vector retrieval (semantic search)
        print("\n[SEARCH] Hybrid Retriever — Vector Search")

        vector_results = self.vector_retriever.retrieve(question)

        print(f"   Found {len(vector_results)} vector results")

        # Step 2 — Graph retrieval (entity traversal)
        print("[SEARCH] Hybrid Retriever — Graph Traversal")

        graph_results = []

        for entity in entities:

            try:
                entity_results = self.graph_retriever.retrieve(entity)
                graph_results.extend(entity_results)

                print(f"   Entity '{entity}' -> {len(entity_results)} relations")

            except Exception as e:
                err_msg = str(e).encode('ascii', 'replace').decode('ascii')
                print(f"   [WARNING] Graph lookup failed for '{entity}': {err_msg}")

        print(f"   Total graph results: {len(graph_results)}")

        return {
            "vector_results": vector_results,
            "graph_results": graph_results
        }

    def format_vector_context(self, vector_results: list) -> str:
        """
        Format vector retrieval results into a readable text block
        for the LLM prompt.
        """

        if not vector_results:
            return "No document context available."

        parts = []

        for i, result in enumerate(vector_results):

            source_parts = []
            if result.metadata.get("document"):
                source_parts.append(f"document: {result.metadata['document']}")
            if result.metadata.get("page"):
                source_parts.append(f"page: {result.metadata['page']}")
            if result.metadata.get("sheet"):
                source_parts.append(f"sheet: {result.metadata['sheet']}")
            if result.metadata.get("similarity") is not None:
                source_parts.append(f"similarity: {result.metadata['similarity']:.2f}")

            source = f" (Source: {', '.join(source_parts)})" if source_parts else ""

            parts.append(
                f"[Document Chunk {result.metadata.get('chunk_id') or i}]{source}\n{result.content}"
            )

        return "\n\n".join(parts)

    def format_graph_context(self, graph_results: list) -> str:
        """
        Format graph retrieval results into a readable text block
        for the LLM prompt.
        """

        if not graph_results:
            return "No graph context available."

        parts = []

        for i, result in enumerate(graph_results):

            content = result.content

            if isinstance(content, dict):

                source = content.get("source", "?")
                relationship = content.get("relationship", "?")
                target = content.get("target", "?")

                parts.append(
                    f"[Relation {i + 1}] "
                    f"{source} —[{relationship}]→ {target}"
                )
            else:
                parts.append(f"[Relation {i + 1}] {content}")

        return "\n".join(parts)
