from backend.services.embedding_service import EmbeddingService
from backend.vectorstore.faiss_manager import FaissManager


class VectorService:

    def __init__(self):
        print("[INFO] VectorService initialized")

        self.embedding_service = EmbeddingService()
        self.faiss = FaissManager()

    def store_chunks(self, chunks, document_name="Unknown"):

        print("\n================ VECTOR SERVICE ================")
        print(f"Document Name : {document_name}")
        print(f"Total Chunks  : {len(chunks)}")

        for idx, chunk in enumerate(chunks):

            print(f"\n-> Adding Chunk {idx}")

            embedding = self.embedding_service.create_embedding(chunk)

            metadata = {
                "chunk_id": idx,
                "document": document_name,
                "text": chunk
            }

            print("Embedding Created [OK]")

            self.faiss.add_chunk(
                metadata,
                embedding
            )

        print("\n[OK] All Chunks Stored")

    def search(self, query):

        print("\n=============== VECTOR SEARCH ===============")
        print("Query :", query)

        embedding = self.embedding_service.create_embedding(query)

        results = self.faiss.search(
            embedding
        )

        print("Retrieved :", len(results), "chunks")

        return results