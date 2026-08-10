import base64

from google import genai

from backend.config.settings import GEMINI_API_KEY


class ImageParser:
    """
    Extracts text and structural information from images
    using Gemini Vision API.
    Handles scanned documents, P&ID diagrams, and photos.
    """

    def __init__(self):

        self.client = genai.Client(
            api_key=GEMINI_API_KEY
        )

    def extract_text(self, file_path: str) -> str:
        """
        Extract text content from an image using Gemini Vision.
        For P&ID diagrams, also extracts equipment tags and symbols.
        """

        image_data = self._load_image(file_path)

        prompt = """
        You are an industrial document analysis assistant.

        Analyze this image and extract ALL text content visible in it.

        If this is a P&ID (Piping and Instrumentation Diagram) or
        engineering drawing:
        - List all equipment tags (e.g., P-101, V-23, T-05)
        - List all instrument tags
        - Describe connections between equipment
        - Note any annotations or labels

        If this is a scanned document:
        - Extract all text as accurately as possible
        - Preserve the structure (tables, lists, headers)

        Return the extracted content as plain text.
        """

        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": image_data["mime_type"],
                                "data": image_data["data"]
                            }
                        }
                    ]
                }
            ]
        )

        return response.text

    def _load_image(self, file_path: str) -> dict:
        """
        Load an image file and return base64-encoded data
        with its MIME type.
        """

        extension = file_path.lower().split('.')[-1]

        mime_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'tif': 'image/tiff'
        }

        mime_type = mime_types.get(extension, 'image/png')

        with open(file_path, 'rb') as f:
            data = base64.standard_b64encode(f.read()).decode('utf-8')

        return {
            "mime_type": mime_type,
            "data": data
        }
