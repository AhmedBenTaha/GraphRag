from pathlib import Path

from llama_index.core import Document


SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}


def load_documents(data_dir: str = "data/documents") -> list[Document]:
    """
    Load supported documents from the data directory.
    """

    documents = []

    data_path = Path(data_dir)

    if not data_path.exists():
        raise FileNotFoundError(
            f"Documents directory not found: {data_path}"
        )

    for file_path in data_path.rglob("*"):
        if not file_path.is_file():
            continue

        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        if file_path.suffix.lower() == ".pdf":
            from llama_index.core import SimpleDirectoryReader

            pdf_documents = SimpleDirectoryReader(
                input_files=[str(file_path)]
            ).load_data()

            documents.extend(pdf_documents)

        else:
            text = file_path.read_text(encoding="utf-8")

            documents.append(
                Document(
                    text=text,
                    metadata={
                        "file_name": file_path.name,
                        "file_path": str(file_path),
                    },
                )
            )

    return documents

def load_single_document(file_path: str) -> list[Document]:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {path}"
        )

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {path.suffix}"
        )

    if path.suffix.lower() == ".pdf":
        from llama_index.core import SimpleDirectoryReader

        return SimpleDirectoryReader(
            input_files=[str(path)]
        ).load_data()

    text = path.read_text(encoding="utf-8")

    return [
        Document(
            text=text,
            metadata={
                "file_name": path.name,
                "file_path": str(path),
            },
        )
    ]