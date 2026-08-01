from fastapi import FastAPI

from backend.api.graph_routes import router as graph_router
from backend.documents.routes import router as document_router

app = FastAPI(
    title="Industrial Knowledge Intelligence Platform",
    version="1.0.0",
    description="Backend API"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to Industrial Knowledge Intelligence Platform"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(graph_router)
app.include_router(graph_router)
app.include_router(document_router)