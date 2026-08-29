from fastapi import APIRouter, Query
from typing import Optional

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


@router.get("/data")
def get_graph_data(limit: int = Query(100, ge=10, le=300), entity: Optional[str] = None):
    """
    Fetch real Neo4j nodes and edges for visual Knowledge Graph rendering.
    If 'entity' is supplied, retrieves the multi-hop ego network around that entity.
    """
    try:
        if entity:
            # Multi-hop subgraph around the entity
            nodes_cypher = """
            MATCH path = (a)-[*1..2]-(b)
            WHERE a.name = $entity OR a.id = $entity
            UNWIND nodes(path) AS n
            RETURN DISTINCT
                coalesce(n.name, n.id) AS id,
                coalesce(n.name, n.id) AS label,
                labels(n)[0] AS type,
                properties(n) AS properties
            LIMIT $limit
            """
            edges_cypher = """
            MATCH path = (a)-[r*1..2]-(b)
            WHERE a.name = $entity OR a.id = $entity
            UNWIND relationships(path) AS rel
            RETURN DISTINCT
                coalesce(startNode(rel).name, startNode(rel).id) AS source,
                type(rel) AS label,
                coalesce(endNode(rel).name, endNode(rel).id) AS target
            LIMIT $limit
            """
            nodes_raw = neo4j_manager.run_cypher(nodes_cypher, {"entity": entity, "limit": limit})
            edges_raw = neo4j_manager.run_cypher(edges_cypher, {"entity": entity, "limit": limit})
        else:
            # Full graph sample
            nodes_cypher = """
            MATCH (n)
            RETURN DISTINCT
                coalesce(n.name, n.id) AS id,
                coalesce(n.name, n.id) AS label,
                labels(n)[0] AS type,
                properties(n) AS properties
            LIMIT $limit
            """
            edges_cypher = """
            MATCH (a)-[r]->(b)
            RETURN DISTINCT
                coalesce(a.name, a.id) AS source,
                type(r) AS label,
                coalesce(b.name, b.id) AS target
            LIMIT $limit
            """
            nodes_raw = neo4j_manager.run_cypher(nodes_cypher, {"limit": limit})
            edges_raw = neo4j_manager.run_cypher(edges_cypher, {"limit": limit * 2})

        # Deduplicate and ensure clean IDs
        node_ids = set()
        cleaned_nodes = []
        for n in nodes_raw:
            nid = n.get("id")
            if nid and nid not in node_ids:
                node_ids.add(nid)
                cleaned_nodes.append({
                    "id": nid,
                    "label": n.get("label") or nid,
                    "type": n.get("type") or "Entity",
                    "properties": n.get("properties") or {}
                })

        cleaned_edges = []
        for e in edges_raw:
            src = e.get("source")
            tgt = e.get("target")
            if src in node_ids and tgt in node_ids:
                cleaned_edges.append({
                    "source": src,
                    "target": tgt,
                    "label": e.get("label") or "RELATED_TO"
                })

        return {
            "nodes": cleaned_nodes,
            "edges": cleaned_edges,
            "count": {
                "nodes": len(cleaned_nodes),
                "edges": len(cleaned_edges)
            }
        }
    except Exception as e:
        print(f"Error fetching graph data: {e}")
        return {"nodes": [], "edges": [], "error": str(e)}


@router.get("/stats")
def get_graph_stats():
    """
    Returns live statistics of the Neo4j Knowledge Graph.
    """
    try:
        schema = neo4j_manager.get_graph_schema()
        node_count = neo4j_manager.run_cypher("MATCH (n) RETURN count(n) AS count")[0]["count"]
        edge_count = neo4j_manager.run_cypher("MATCH ()-[r]->() RETURN count(r) AS count")[0]["count"]
        
        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "labels": list(schema.get("labels", [])),
            "relationships": list(schema.get("relationships", []))
        }
    except Exception as e:
        print(f"Error fetching graph stats: {e}")
        return {
            "node_count": 0,
            "edge_count": 0,
            "labels": [],
            "relationships": [],
            "error": str(e)
        }


@router.post("/node")
def create_node(request: CreateNodeRequest):
    neo4j_manager.create_node(
        request.label,
        request.properties
    )
    return {
        "message": "Node created successfully"
    }