from llama_index.core import VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from app.config import (
    QDRANT_URL,
    QDRANT_COLLECTION,
    EMBEDDING_MODEL,
)


class VectorRetriever:
    def __init__(self):
        print("Initializing Vector Retriever...")

        self.embed_model = HuggingFaceEmbedding(
            model_name=EMBEDDING_MODEL
        )

        print("Connecting to Qdrant...")

        self.client = QdrantClient(
            url=QDRANT_URL
        )

        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=QDRANT_COLLECTION,
        )

        self.index = None

    def build_index(self, nodes):
        print("Building vector index...")

        self.index = VectorStoreIndex(
            nodes,
            vector_store=self.vector_store,
            embed_model=self.embed_model,
        )

        print("Vector index built successfully.")

    def retrieve(self, query: str, top_k: int = 3):
        if self.index is None:
            raise RuntimeError(
                "Vector index has not been built yet."
            )

        retriever = self.index.as_retriever(
            similarity_top_k=top_k
        )

        print(f"Vector query: {query}")

        return retriever.retrieve(query)