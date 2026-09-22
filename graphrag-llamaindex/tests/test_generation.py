from app.ingestion.pipeline import run_ingestion
from app.retrieval.hybrid_retriever import HybridRetriever
from app.generation.llm import GraphRAGGenerator


def main():
    print("=" * 60)
    print("GRAPHRAG GENERATION TEST")
    print("=" * 60)

    # ---------------------------------------------------------
    # 1. Ingestion
    # ---------------------------------------------------------

    print("\n[1] Running ingestion...")

    nodes = run_ingestion()

    print(f"Loaded {len(nodes)} nodes.")

    # ---------------------------------------------------------
    # 2. Hybrid Retriever
    # ---------------------------------------------------------

    print("\n[2] Initializing Hybrid Retriever...")

    retriever = HybridRetriever()

    print("\n[3] Building vector index...")

    retriever.build_vector_index(nodes)

    # ---------------------------------------------------------
    # 3. Query
    # ---------------------------------------------------------

    query = "What technologies does Ahmed use?"

    print(f"\nQuestion: {query}")

    # ---------------------------------------------------------
    # 4. Retrieval
    # ---------------------------------------------------------

    results = retriever.retrieve(query)

    context = results["context"]

    # ---------------------------------------------------------
    # 5. Generation
    # ---------------------------------------------------------

    print("\n[4] Initializing Generator...")

    generator = GraphRAGGenerator()

    answer = generator.generate(
        query=query,
        context=context,
    )

    # ---------------------------------------------------------
    # 6. Final Answer
    # ---------------------------------------------------------

    print("\n" + "=" * 60)
    print("FINAL ANSWER")
    print("=" * 60)

    print(answer)


if __name__ == "__main__":
    main()

