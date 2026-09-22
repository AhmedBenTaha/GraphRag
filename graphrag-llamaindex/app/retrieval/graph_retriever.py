from llama_index.core.prompts import PromptTemplate
from llama_index.llms.groq import Groq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.graph.neo4j import get_neo4j_store, get_graph_schema


class GraphRetriever:
    def __init__(self):
        print("Initializing Graph Retriever...")

        self.llm = Groq(
            api_key=GROQ_API_KEY,
            model=GROQ_MODEL,
        )

        print("Connecting to Neo4j...")

        self.graph_store = get_neo4j_store()

        print("Reading Neo4j graph schema...")

        self.schema = get_graph_schema()

        print("\nGraph Schema:")
        print("-" * 60)
        print(self.schema)

        self.cypher_template = PromptTemplate(
            """
You are an expert Neo4j Cypher query generator.

Generate ONE valid read-only Cypher query that answers the user's question.

Use ONLY the graph schema provided below.

IMPORTANT RULES:

1. Return ONLY the Cypher query.
2. Do NOT return explanations.
3. Do NOT use markdown.
4. Do NOT invent node labels.
5. Do NOT invent relationship types.
6. Use ONLY relationship types listed in the schema.
7. Do NOT assume that a requested relationship is directly connected
   to the entity mentioned in the question.
8. Follow multiple relationship hops when the graph schema requires it.
9. Use the actual relationship patterns to determine valid traversal paths.
10. Relationship types containing spaces MUST use backticks.
11. Nodes contain a `name` property.
12. When matching a named entity, use its `name` property.
13. Prefer case-insensitive name matching when appropriate.
14. Return useful fields with clear aliases.
15. Use the simplest valid traversal that answers the question.
16. Do not modify the database.
17. NEVER use CREATE, MERGE, DELETE, SET, REMOVE, DROP, or write operations.
18. The query must be read-only.
19. Do NOT use variable-length paths such as *1..2 when a specific
    relationship path can answer the question.

20. Prefer explicit relationship sequences.

21. If the requested information is reached through an intermediate
    entity, traverse through that entity but return only the final
    entities relevant to the question.

22. Do NOT return intermediate entities unless the user explicitly
    asks for them.

23. For example, if the graph contains:
    A --[R1]--> B
    B --[R2]--> C

    and the question asks for entities of type C related to A,
    prefer:
    (A)-[:R1]->(B)-[:R2]->(C)

    instead of:
    (A)-[:R1|R2*1..2]->(C)

24. Use DISTINCT when multiple graph paths could produce duplicates.


GRAPH SCHEMA:

{schema}

USER QUESTION:

{query}

CYPHER QUERY:

"""
        )

    def _generate_cypher(self, query: str) -> str:
        """
        Generate a Cypher query from the user's question
        using the actual Neo4j schema.
        """

        prompt = self.cypher_template.format(
            schema=self.schema,
            query=query,
        )

        response = self.llm.complete(prompt)

        cypher = response.text.strip()

        # Remove markdown fences if the model returns them.
        if cypher.startswith("```"):
            lines = cypher.splitlines()

            if lines and lines[0].startswith("```"):
                lines = lines[1:]

            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            cypher = "\n".join(lines).strip()

        # Remove accidental "cypher" prefix.
        if cypher.lower().startswith("cypher"):
            cypher = cypher[6:].strip()

        return cypher

    def _validate_cypher(self, cypher: str) -> None:
        """
        Basic safety validation for generated Cypher.

        This project only needs read-only graph retrieval.
        """

        forbidden_keywords = [
            "CREATE",
            "MERGE",
            "DELETE",
            "DETACH DELETE",
            "SET",
            "REMOVE",
            "DROP",
            "CALL dbms",
            "CALL apoc",
        ]

        cypher_upper = cypher.upper()

        for keyword in forbidden_keywords:
            if keyword in cypher_upper:
                raise ValueError(
                    f"Unsafe Cypher query detected: {keyword}"
                )

    def retrieve(self, query: str):
        """
        Generate and execute a Cypher query for the user's question.
        """

        print(f"Graph query: {query}")

        print("\nGenerating Cypher query...")

        cypher = self._generate_cypher(query)

        print("\nGenerated Cypher:")
        print("-" * 60)
        print(cypher)

        self._validate_cypher(cypher)

        print("\nExecuting Cypher query...")

        results = self.graph_store.structured_query(cypher)

        print("\nCypher Response:")
        print(results)

        return results

