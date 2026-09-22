# GraphRAG Project

A Graph-based Retrieval-Augmented Generation (GraphRAG) application built with **LlamaIndex**, **FastAPI**, and an LLM.

The project combines document ingestion, chunking, hybrid retrieval, knowledge graph construction, and LLM-based answer generation to provide context-aware answers from uploaded documents.

---

## 🚀 Features

* 📄 Document ingestion and processing
* ✂️ Document chunking
* 🔎 Hybrid retrieval
* 🕸️ Knowledge graph construction
* 🤖 LLM-based answer generation
* ⚡ FastAPI REST API
* 📊 Evaluation-ready architecture
* 🧩 Modular project structure

---

## 🏗️ Architecture

The application follows a modular RAG pipeline:

```text
                 ┌──────────────────┐
                 │    Documents     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Document Loader  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │     Chunker      │
                 └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌─────────────────┐     ┌─────────────────┐
     │ Hybrid Retriever│     │  Graph Builder  │
     └────────┬────────┘     └────────┬────────┘
              │                       │
              └───────────┬───────────┘
                          ▼
                 ┌──────────────────┐
                 │  LLM Generator   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │      Answer      │
                 └──────────────────┘
```

---

## 📁 Project Structure

```text
.
├── app/
│   ├── ingestion/
│   │   ├── loader.py
│   │   └── chunker.py
│   │
│   ├── retrieval/
│   │   └── hybrid_retriever.py
│   │
│   ├── generation/
│   │   └── llm.py
│   │
│   ├── graph/
│   │   └── graph_builder.py
│   │
│   └── main.py
│
├── evaluation/
│   ├── dataset.json
│   └── results/
│
├── requirements.txt
├── .env
└── README.md
```

> The exact structure may vary depending on the current implementation.

---

## 🛠️ Technologies

* **Python**
* **FastAPI**
* **LlamaIndex**
* **Pydantic**
* **LLM / Generative AI**
* **Knowledge Graph**
* **Hybrid Retrieval**

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux / macOS

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root.

Example:

```env
OPENAI_API_KEY=your_api_key
```

Add any other environment variables required by the selected LLM, embedding model, or vector store.

> Never commit your API keys or `.env` file to GitHub.

---

## ▶️ Running the Application

Start the FastAPI server with:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI also provides interactive API documentation at:

```text
http://127.0.0.1:8000/docs
```

---

## 📡 API

The application provides endpoints for document ingestion and question answering.

### Upload a Document

```http
POST /upload
```

The endpoint accepts a document and processes it through the ingestion pipeline.

Example using `curl`:

```bash
curl -X POST \
  "http://127.0.0.1:8000/upload" \
  -F "file=@document.pdf"
```

---

### Ask a Question

```http
POST /query
```

Example request:

```json
{
  "question": "What is the main topic of the document?"
}
```

The system retrieves relevant information and generates an answer using the LLM.

---

## 🔄 RAG Pipeline

The application processes a query through the following steps:

### 1. Ingestion

Documents are loaded and converted into a format that can be processed by the RAG pipeline.

### 2. Chunking

Large documents are divided into smaller chunks to improve retrieval quality.

### 3. Hybrid Retrieval

The system retrieves relevant chunks using multiple retrieval signals rather than relying on a single retrieval strategy.

### 4. Graph Construction

Entities and relationships extracted from the documents are represented as a knowledge graph.

### 5. Generation

The retrieved context is passed to the LLM, which generates the final response.

---

## 🕸️ GraphRAG

The graph component provides an additional representation of the information contained in the documents.

Instead of treating the document only as independent text chunks, the system can represent relationships between entities:

```text
Entity A
   │
   │ relationship
   ▼
Entity B
   │
   │ relationship
   ▼
Entity C
```

This representation can help the retrieval and generation process when answering questions that involve relationships between multiple entities or concepts.

---

## 📊 Evaluation

The project can be evaluated at both the retrieval and answer-generation levels.

### Retrieval Metrics

Possible retrieval metrics include:

* Precision@K
* Recall@K
* Mean Reciprocal Rank (MRR)

### Generation Metrics

Possible answer-level metrics include:

* Exact Match
* Token-level F1
* Faithfulness
* Answer Relevancy

Evaluation results can be stored under:

```text
evaluation/results/
```

---

## 🧪 Example Workflow

```text
1. Upload document
        ↓
2. Load document
        ↓
3. Split into chunks
        ↓
4. Build graph
        ↓
5. Index / retrieve relevant information
        ↓
6. Ask question
        ↓
7. Retrieve relevant context
        ↓
8. Generate answer with LLM
```

---

## 🎯 Project Goal

The goal of this project is to demonstrate how **Retrieval-Augmented Generation** can be enhanced with a **knowledge graph** and hybrid retrieval to provide more context-aware question answering over a collection of documents.

---

## 🔮 Future Improvements

Potential future improvements include:

* More advanced graph-based retrieval
* Better entity and relationship extraction
* Persistent vector storage
* Improved reranking
* Larger evaluation datasets
* Automated evaluation reports
* Streaming LLM responses
* Authentication and user management

---

## 👨‍💻 Author

**Ahmed Taha**

---

## 📄 License

This project is intended for educational and experimental purposes.
