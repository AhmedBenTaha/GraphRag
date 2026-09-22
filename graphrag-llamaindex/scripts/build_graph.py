from app.ingestion.pipeline import run_ingestion
from app.graph.graph_builder import build_graph


if __name__ == "__main__":
    print("=" * 60)
    print("GRAPH RAG - BUILD KNOWLEDGE GRAPH")
    print("=" * 60)

    print("\n[1] Running ingestion...")

    nodes = run_ingestion()

    if not nodes:
        print("No nodes found.")
        exit()

    print(f"\n[2] Building graph from {len(nodes)} nodes...")

    build_graph(nodes)

    print("\n" + "=" * 60)
    print("GRAPH BUILD COMPLETED")
    print("=" * 60)