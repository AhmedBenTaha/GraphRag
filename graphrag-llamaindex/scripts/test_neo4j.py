from app.graph.neo4j import Neo4jConnection


if __name__ == "__main__":
    print("Connecting to Neo4j...")

    db = Neo4jConnection()

    result = db.verify_connection()

    print(f"Neo4j connection successful: {result}")

    db.close()