from backend.services.vector_service import VectorService
from backend.retrieval.models import RetrievalResult


class VectorRetriever:

    def __init__(self):

        self.vector_service = VectorService()

    def retrieve(self, question: str):

        results = self.vector_service.search(question)

        output = []

        for item in results:

            output.append(

                RetrievalResult(

                    source="vector",

                    content=item["text"],

                    metadata={

                        "document": item["document"],

                        "chunk_id": item["chunk_id"]

                    }

                )

            )

        return output