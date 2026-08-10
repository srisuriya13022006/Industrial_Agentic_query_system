from fastapi import APIRouter, UploadFile, File

from backend.documents.service import DocumentService
from backend.pipeline.processing_pipeline import ProcessingPipeline

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

document_service = DocumentService()
pipeline = ProcessingPipeline()


@router.post("/upload")
def upload_document(file: UploadFile = File(...)):

    # Save uploaded file
    file_path = document_service.save_file(file)

    # Run the full processing pipeline (Ingestion -> Extraction -> Graph -> Vector)
    knowledge = pipeline.process(file_path)

    return {
        "filename": file.filename,
        "status": "processed and stored successfully",
        "knowledge_extracted": knowledge
    }