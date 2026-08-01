from backend.graph.neo4j_manager import Neo4jManager
from backend.config.settings import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD
)


class GraphService:

    def __init__(self):

        self.graph = Neo4jManager(
            NEO4J_URI,
            NEO4J_USERNAME,
            NEO4J_PASSWORD
        )

    def store(self, knowledge):

        entities = knowledge["entities"]

        relationships = knowledge["relationships"]

        # Store Nodes
        for entity in entities:

            self.graph.create_node(
                label=entity["label"],
                properties=entity["properties"]
            )

        # Store Relationships
        for relation in relationships:

            self.graph.create_relationship(
                source_id=relation["source_id"],
                relationship=relation["relationship"],
                target_id=relation["target_id"]
            )