from backend.services.chunking_service import ChunkingService
from backend.services.knowledge_extraction_service import KnowledgeExtractionService


class ExtractionAgent:

    def __init__(self):

        self.chunker = ChunkingService()
        self.knowledge_service = KnowledgeExtractionService()

    def process(self, pages: list):

        results = []

        for page in pages:
            page_text = page["text"]
            page_meta = page["metadata"]

            chunks = self.chunker.split_text(page_text)

            for chunk in chunks:

                try:
                    knowledge = self.knowledge_service.extract_knowledge(chunk)
                    results.append(
                        {
                            "chunk": chunk,
                            "metadata": page_meta,
                            "entities": knowledge.get("entities", []),
                            "relationships": knowledge.get("relationships", [])
                        }
                    )
                except Exception as e:
                    print(f"   [WARNING] Knowledge extraction failed for chunk due to API error: {e}")

        return results