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

        entities = knowledge.get("entities", [])

        relationships = knowledge.get("relationships", [])

        # Store Nodes
        for entity in entities:
            try:
                self.graph.create_node(
                    label=entity["label"],
                    properties=entity["properties"]
                )
            except Exception as e:
                print(f"   [WARNING] Failed to store node '{entity.get('properties', {}).get('id')}': {e}")

        # Store Relationships
        for relation in relationships:
            try:
                self.graph.create_relationship(
                    source_id=relation["source_id"],
                    relationship=relation["relationship"],
                    target_id=relation["target_id"]
                )
            except Exception as e:
                print(f"   [WARNING] Failed to store relationship {relation.get('source_id')} -> {relation.get('relationship')} -> {relation.get('target_id')}: {e}")