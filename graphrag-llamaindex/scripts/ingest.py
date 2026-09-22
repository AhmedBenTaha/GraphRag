from app.ingestion.pipeline import run_ingestion


if __name__ == "__main__":
    print("Starting ingestion...")

    nodes = run_ingestion()

    print("\n" + "=" * 50)
    print("INGESTION RESULT")
    print("=" * 50)

    for i, node in enumerate(nodes, start=1):
        print(f"\n--- Node {i} ---")
        print(node.text)
        print(f"Metadata: {node.metadata}")