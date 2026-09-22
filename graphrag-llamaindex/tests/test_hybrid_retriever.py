from app.ingestion.pipeline import run_ingestion
from app.retrieval.hybrid_retriever import HybridRetriever


def main():
    print("=" * 60)
    print("HYBRID RETRIEVER TEST")
    print("=" * 60)

    print("\n[1] Running ingestion...")
    nodes = run_ingestion()

    print(f"\nLoaded {len(nodes)} nodes.")

    print("\n[2] Initializing Hybrid Retriever...")
    retriever = HybridRetriever()

    print("\n[3] Building vector index...")
    retriever.build_vector_index(nodes)

    query = "What technologies does Ahmed use?"

    print(f"\nQuestion: {query}")

    results = retriever.retrieve(query)

    # ---------------------------------------------------------
    # Graph Results
    # ---------------------------------------------------------

   
    print("\n" + "=" * 60)
    print("GRAPH RESULTS")
    print("=" * 60)

    for i, result in enumerate(results["graph"], start=1):
        print(f"\nResult {i}:")

        if isinstance(result, dict):
            print(f"Data: {result}")
        else:
            print(f"Text: {result.node.text}")
            print(f"Score: {result.score:.4f}")
   
    
    print("\n" + "=" * 60)
    print("UNIFIED HYBRID CONTEXT")
    print("=" * 60)

    print(results["context"])




if __name__ == "__main__":
    main()