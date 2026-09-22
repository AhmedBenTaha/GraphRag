from llama_index.graph_stores.neo4j import Neo4jPropertyGraphStore

from app.config import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
)


def get_neo4j_store():
    return Neo4jPropertyGraphStore(
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
        url=NEO4J_URI,
    )



def get_graph_schema():
    """
    Retrieve the actual Neo4j graph schema and a small sample
    of real relationships from the database.
    """

    store = get_neo4j_store()

    # ---------------------------------------------------------
    # Node labels
    # ---------------------------------------------------------

    labels_query = """
    CALL db.labels()
    YIELD label
    RETURN label
    ORDER BY label
    """

    labels_result = store.structured_query(labels_query)

    labels = [
        row["label"]
        for row in labels_result
        if row.get("label")
    ]

    # ---------------------------------------------------------
    # Relationship types
    # ---------------------------------------------------------

    relationships_query = """
    CALL db.relationshipTypes()
    YIELD relationshipType
    RETURN relationshipType
    ORDER BY relationshipType
    """

    relationships_result = store.structured_query(
        relationships_query
    )

    relationships = [
        row["relationshipType"]
        for row in relationships_result
        if row.get("relationshipType")
    ]

    # ---------------------------------------------------------
    # Relationship patterns
    # ---------------------------------------------------------

    patterns_query = """
    MATCH (source)-[r]->(target)
    RETURN DISTINCT
        type(r) AS relationship
    ORDER BY relationship
    """

    patterns_result = store.structured_query(patterns_query)

    patterns = [
        row["relationship"]
        for row in patterns_result
        if row.get("relationship")
    ]

    # ---------------------------------------------------------
    # Real graph examples
    # ---------------------------------------------------------

    examples_query = """
    MATCH (source)-[r]->(target)
    WHERE source.name IS NOT NULL
      AND target.name IS NOT NULL
    RETURN DISTINCT
        source.name AS source,
        type(r) AS relationship,
        target.name AS target
    LIMIT 30
    """

    examples_result = store.structured_query(examples_query)

    # ---------------------------------------------------------
    # Build schema description
    # ---------------------------------------------------------

    schema_lines = []

    schema_lines.append("Node labels:")

    if labels:
        for label in labels:
            schema_lines.append(f"- {label}")
    else:
        schema_lines.append("- No labels found")

    schema_lines.append("\nRelationship types:")

    if relationships:
        for relationship in relationships:
            schema_lines.append(f"- {relationship}")
    else:
        schema_lines.append("- No relationships found")

    schema_lines.append("\nRelationship types available for traversal:")

    if patterns:
        for relationship in patterns:
            schema_lines.append(
                f"- {relationship}"
            )
    else:
        schema_lines.append(
            "- No relationship types found"
        )

    schema_lines.append("\nActual graph examples:")

    if examples_result:
        for row in examples_result:
            source = row.get("source")
            relationship = row.get("relationship")
            target = row.get("target")

            if source and relationship and target:
                schema_lines.append(
                    f"- {source} --[{relationship}]--> {target}"
                )
    else:
        schema_lines.append(
            "- No graph examples found"
        )

    schema_lines.append("\nNode properties:")
    schema_lines.append("- name")

    return "\n".join(schema_lines)

