from neo4j import GraphDatabase


class Neo4jManager:

    def __init__(self, uri, username, password):
        self.driver = GraphDatabase.driver(
            uri,
            auth=(username, password)
        )

    def close(self):
        self.driver.close()

    def test_connection(self):
        with self.driver.session(database="neo4j") as session:
            result = session.run(
                "RETURN 'Neo4j Connected Successfully!' AS message"
            )
            return result.single()["message"]

    def create_node(self, label: str, properties: dict):
        query = f"""
        MERGE (n:{label} {{id:$id}})
        SET n += $properties
        RETURN n
        """

        with self.driver.session(database="neo4j") as session:
            result = session.run(
                query,
                id=properties["id"],
                properties=properties
            )
            return result.single()

    def create_relationship(
        self,
        source_id,
        relationship,
        target_id
    ):
        query = f"""
        MATCH (a {{id:$source}})
        MATCH (b {{id:$target}})
        MERGE (a)-[r:{relationship}]->(b)
        RETURN r
        """

        with self.driver.session(database="neo4j") as session:
            result = session.run(
                query,
                source=source_id,
                target=target_id
            )
            return result.single()

    def get_neighbors(self, entity_id):
        query = """
        MATCH (a {id:$id})-[r]-(b)
        RETURN
            a.name AS source,
            type(r) AS relationship,
            b.name AS target
        """

        with self.driver.session(database="neo4j") as session:
            result = session.run(
                query,
                id=entity_id
            )

            return [record.data() for record in result]