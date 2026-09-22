from app.retrieval.graph_retriever import GraphRetriever


if __name__ == "__main__":
    print("=" * 60)
    print("GRAPH RETRIEVER TEST")
    print("=" * 60)

    retriever = GraphRetriever()

    query = "What technologies does Ahmed use?"

    print(f"\nQuestion: {query}")

    results = retriever.retrieve(query)

    print("\nResults:")
    print("-" * 60)

    for i, result in enumerate(results, start=1):
        print(f"\nResult {i}:")
        print(result)