from backend.services.chunking_service import ChunkingService
from backend.services.knowledge_extraction_service import KnowledgeExtractionService


class ExtractionAgent:

    def __init__(self):

        self.chunker = ChunkingService()
        self.knowledge_service = KnowledgeExtractionService()

    def process(self, text: str):

        chunks = self.chunker.split_text(text)

        results = []

        for chunk in chunks:

            try:
                knowledge = self.knowledge_service.extract_knowledge(chunk)
                results.append(
                    {
                        "chunk": chunk,
                        "entities": knowledge.get("entities", []),
                        "relationships": knowledge.get("relationships", [])
                    }
                )
            except Exception as e:
                print(f"   [WARNING] Knowledge extraction failed for chunk due to API error: {e}")

        return results