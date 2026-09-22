from app.ingestion.loader import load_documents
from app.ingestion.chunker import chunk_documents


def run_ingestion(data_dir: str = "data/documents"):
    """
    Run the document ingestion pipeline.
    """

    print("Loading documents...")

    documents = load_documents(data_dir)

    print(f"Loaded documents: {len(documents)}")

    if not documents:
        print("No documents found.")
        return []

    print("Chunking documents...")

    nodes = chunk_documents(documents)

    print(f"Created nodes: {len(nodes)}")

    return nodes