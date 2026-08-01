from backend.llm.gemini_service import GeminiService

gemini = GeminiService()

response = gemini.generate(
    "Say Hello in one sentence."
)

print(response)