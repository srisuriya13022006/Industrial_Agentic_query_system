import json

from backend.llm.gemini_service import GeminiService
from backend.prompts.knowledge_extraction_prompt import KNOWLEDGE_EXTRACTION_PROMPT


class KnowledgeExtractionService:

    def __init__(self):

        self.llm = GeminiService()

    def extract_knowledge(self, chunk: str):

        prompt = KNOWLEDGE_EXTRACTION_PROMPT.format(
            text=chunk
        )

        response = self.llm.generate(prompt)

        response = response.replace("```json", "")
        response = response.replace("```", "")
        response = response.strip()

        return json.loads(response)