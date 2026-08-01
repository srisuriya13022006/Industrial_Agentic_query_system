from fastapi import APIRouter, UploadFile, File

from backend.documents.service import DocumentService
from backend.agents.ingestion_agent import IngestionAgent

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

document_service = DocumentService()
agent = IngestionAgent()


@router.post("/upload")
def upload_document(file: UploadFile = File(...)):

    # Save uploaded file
    file_path = document_service.save_file(file)

    # Pass the saved file to the Ingestion Agent
    text = agent.ingest(file_path)

    return {
        "filename": file.filename,
        "status": "uploaded successfully",
        "text": text
    }