from fastapi import FastAPI
from pydantic import BaseModel

from app.ingestion.pipeline import run_ingestion
from app.retrieval.hybrid_retriever import HybridRetriever
from app.generation.llm import GraphRAGGenerator


app = FastAPI(
    title="GraphRAG LlamaIndex API",
    description="General GraphRAG API using Neo4j, Qdrant, LlamaIndex, and Groq",
    version="1.0.0",
)


class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str


print("Initializing GraphRAG application...")

nodes = run_ingestion()

retriever = HybridRetriever()
retriever.build_vector_index(nodes)

generator = GraphRAGGenerator()

print("GraphRAG application initialized successfully.")


@app.get("/")
def root():
    return {
        "message": "GraphRAG API is running",
        "status": "ok",
    }


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    results = retriever.retrieve(request.query)

    answer = generator.generate(
        query=request.query,
        context=results["context"],
    )

    return QueryResponse(answer=answer)