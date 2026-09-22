from llama_index.core import PropertyGraphIndex
from llama_index.llms.groq import Groq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.graph.neo4j import get_neo4j_store


def build_graph(nodes):
    """
    Build a knowledge graph from document nodes.
    """

    print("Initializing Groq LLM...")

    llm = Groq(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
    )

    print("Connecting to Neo4j...")

    graph_store = get_neo4j_store()

    print("Building knowledge graph...")

    index = PropertyGraphIndex(
        nodes=nodes,
        property_graph_store=graph_store,
        llm=llm,
        embed_kg_nodes=False,
        show_progress=True,
    )

    print("Knowledge graph built successfully.")

    return index