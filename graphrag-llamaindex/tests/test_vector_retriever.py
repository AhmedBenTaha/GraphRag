from app.ingestion.pipeline import run_ingestion
from app.retrieval.vector_retriever import VectorRetriever


def main():
    print("=" * 60)
    print("VECTOR RETRIEVER TEST")
    print("=" * 60)

    print("\n[1] Running ingestion...")
    nodes = run_ingestion()

    print(f"\n[2] Loaded {len(nodes)} nodes.")

    print("\n[3] Initializing Vector Retriever...")
    retriever = VectorRetriever()

    print("\n[4] Building vector index...")
    retriever.build_index(nodes)

    query = "What is Neo4j?"

    print(f"\nQuestion: {query}")

    results = retriever.retrieve(query)

    print("\nResults:")
    print("-" * 60)

    for i, result in enumerate(results, start=1):
        print(f"\nResult {i}:")
        print(f"Text: {result.node.text}")
        print(f"Score: {result.score:.4f}")


if __name__ == "__main__":
    main()