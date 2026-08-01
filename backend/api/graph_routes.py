from fastapi import APIRouter

from backend.graph.neo4j_manager import Neo4jManager
from backend.models.graph_models import CreateNodeRequest
from backend.config.settings import (
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD
)

router = APIRouter(
    prefix="/graph",
    tags=["Graph"]
)

neo4j_manager = Neo4jManager(
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD
)


@router.post("/node")
def create_node(request: CreateNodeRequest):

    neo4j_manager.create_node(
        request.label,
        request.properties
    )

    return {
        "message": "Node created successfully"
    }