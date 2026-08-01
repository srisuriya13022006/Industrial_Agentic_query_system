from sentence_transformers import SentenceTransformer


class EmbeddingService:

    def __init__(self):
        self.model = SentenceTransformer(
            "BAAI/bge-base-en-v1.5"
        )

    def create_embedding(self, text: str):

        embedding = self.model.encode(text)

        return embedding.tolist()