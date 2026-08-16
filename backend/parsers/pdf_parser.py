import pymupdf


class PDFParser:
    """
    Extracts text content from PDF files using PyMuPDF.
    Handles both text-based and simple scanned PDFs.
    """

    def extract_text(self, file_path: str) -> list:
        """
        Extract all text from a PDF file, page by page.
        """

        document = pymupdf.open(file_path)

        pages = []

        for i, page in enumerate(document):
            pages.append({
                "text": page.get_text(),
                "metadata": {
                    "page": i + 1
                }
            })

        document.close()

        return pages
