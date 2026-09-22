from llama_index.llms.groq import Groq
from llama_index.core.prompts import PromptTemplate

from app.config import GROQ_API_KEY, GROQ_MODEL


class GraphRAGGenerator:
    def __init__(self):
        print("Initializing GraphRAG Generator...")

        self.llm = Groq(
            api_key=GROQ_API_KEY,
            model=GROQ_MODEL,
        )

        self.prompt_template = PromptTemplate(
            """
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

The context may contain:
- Structured information retrieved from a knowledge graph.
- Semantic information retrieved from documents.

IMPORTANT RULES:

1. Use the provided context as the source of truth.
2. Do not invent facts that are not supported by the context.
3. Combine information from GRAPH CONTEXT and VECTOR CONTEXT
   when both are useful.
4. If the context does not contain enough information to answer
   the question, clearly say that the information is not available.
5. Answer the question directly.
6. Keep the answer concise and clear.
7. Do not mention internal retrieval systems unless the user asks.
8. Do not mention Cypher, Neo4j, Qdrant, embeddings, or retrieval
   implementation details unless relevant to the question.

CONTEXT:

{context}

USER QUESTION:

{query}

ANSWER:
"""
        )

    def generate(self, query: str, context: str) -> str:
        """
        Generate an answer using the retrieved hybrid context.
        """

        print("\nGenerating final answer...")

        prompt = self.prompt_template.format(
            context=context,
            query=query,
        )

        response = self.llm.complete(prompt)

        return response.text.strip()

