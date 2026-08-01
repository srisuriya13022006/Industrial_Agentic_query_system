from backend.agents.ingestion_agent import IngestionAgent
from backend.agents.extraction_agent import ExtractionAgent

from backend.services.graph_service import GraphService
from backend.services.vector_service import VectorService
import os

class ProcessingPipeline:

    def __init__(self):

        self.ingestion_agent = IngestionAgent()

        self.extraction_agent = ExtractionAgent()

        self.graph_service = GraphService()

        self.vector_service = VectorService()

    def process(self, file_path: str):

        print("\n========== PIPELINE STARTED ==========")

        # Step 1
        text = self.ingestion_agent.ingest(file_path)

        print("✓ Text Extracted")

        # Step 2
        knowledge = self.extraction_agent.process(text)

        print("✓ Knowledge Extracted")

        # Step 3
        for chunk in knowledge:

            self.graph_service.store(chunk)

        print("✓ Stored in Neo4j")

        # Step 4
        chunks = [
            item["chunk"]
            for item in knowledge
        ]

        document_name = os.path.basename(file_path)

        self.vector_service.store_chunks(
        chunks,
        document_name
                        )
        print("✓ Stored in FAISS")

        print("\n========== PIPELINE COMPLETED ==========")

        return knowledge