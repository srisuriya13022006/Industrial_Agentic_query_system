from backend.graph.neo4j_manager import Neo4jManager

from backend.config.settings import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD
)

from backend.retrieval.models import RetrievalResult


class GraphRetriever:

    def __init__(self):

        self.graph = Neo4jManager(

            NEO4J_URI,

            NEO4J_USERNAME,

            NEO4J_PASSWORD

        )

    def retrieve(self, entity_name):

        graph_results = self.graph.get_neighbors(entity_name)

        output = []

        for item in graph_results:

            output.append(

                RetrievalResult(

                    source="graph",

                    content=item,

                    metadata={}

                )

            )

        return output