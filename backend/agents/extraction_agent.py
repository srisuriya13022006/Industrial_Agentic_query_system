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

            knowledge = self.knowledge_service.extract_knowledge(chunk)

            results.append(
                {
                    "chunk": chunk,
                    "entities": knowledge["entities"],
                    "relationships": knowledge["relationships"]
                }
            )

        return results