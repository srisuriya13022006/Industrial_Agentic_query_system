import pymupdf


class PDFParser:
    """
    Extracts text content from PDF files using PyMuPDF.
    Handles both text-based and simple scanned PDFs.
    """

    def extract_text(self, file_path: str) -> str:
        """
        Extract all text from a PDF file, page by page.
        """

        document = pymupdf.open(file_path)

        text = ""

        for page in document:
            text += page.get_text()

        document.close()

        return text
