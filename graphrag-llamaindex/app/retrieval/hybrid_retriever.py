from app.retrieval.graph_retriever import GraphRetriever
from app.retrieval.vector_retriever import VectorRetriever


class HybridRetriever:
    def __init__(self):
        print("Initializing Hybrid Retriever...")

        self.graph_retriever = GraphRetriever()
        self.vector_retriever = VectorRetriever()

    def build_vector_index(self, nodes):
        print("Building vector index...")
        self.vector_retriever.build_index(nodes)

    def retrieve(self, query: str, top_k: int = 3):
        print("\n" + "=" * 60)
        print("HYBRID RETRIEVAL")
        print("=" * 60)

        # -----------------------------------------------------
        # Graph Retrieval
        # -----------------------------------------------------

        print("\n[1] Graph Retrieval...")

        graph_results = self.graph_retriever.retrieve(query)

        # -----------------------------------------------------
        # Vector Retrieval
        # -----------------------------------------------------

        print("\n[2] Vector Retrieval...")

        vector_results = self.vector_retriever.retrieve(
            query,
            top_k=top_k,
        )

        # -----------------------------------------------------
        # Build unified context
        # -----------------------------------------------------

        context_parts = []

        # Graph context
        if graph_results:
            context_parts.append("GRAPH CONTEXT:")

            for result in graph_results:
                context_parts.append(
                    f"- {self._format_graph_result(result)}"
                )

        # Vector context
        if vector_results:
            context_parts.append("\nVECTOR CONTEXT:")

            for result in vector_results:
                context_parts.append(
                    f"- {result.node.text}"
                )

        context = "\n".join(context_parts)

        return {
            "graph": graph_results,
            "vector": vector_results,
            "context": context,
        }

    @staticmethod
    def _format_graph_result(result):
        """
        Convert a Neo4j result dictionary into readable text.
        """

        if isinstance(result, dict):
            parts = []

            for key, value in result.items():
                parts.append(f"{key}: {value}")

            return ", ".join(parts)

        return str(result)


