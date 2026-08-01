from backend.documents.parser import PDFParser


class IngestionAgent:

    def __init__(self):
        self.parser = PDFParser()

    def ingest(self, file_path):

        text = self.parser.extract_text(file_path)

        return text