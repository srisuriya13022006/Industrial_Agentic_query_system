import json
from backend.llm.gemini_service import GeminiService
from backend.retrieval.hybrid_retriever import HybridRetriever
from backend.prompts.query_prompts import ENTITY_EXTRACTION_FROM_QUERY_PROMPT, ANSWER_GENERATION_PROMPT
from backend.utils.helpers import safe_json_parse


class QueryAgent:
    """
    Agent 3 — Query Agent (Expert Copilot).
    Interprets natural-language questions, extracts entities, retrieves relevant context
    using the Hybrid Retriever (Vector DB semantic search + Neo4j Graph traversal),
    and generates a detailed, cited, confidence-scored answer.
    """

    def __init__(self):
        self.llm = GeminiService()
        self.retriever = HybridRetriever()

    def query(self, question: str) -> dict:
        """
        Processes a user question and returns a cited response.
        """
        print(f"\n[QUERY] Query Agent — Received Question: '{question}'")

        # Step 1: Extract entities from user question to use in Graph retrieval
        extracted_entities = self._extract_entities(question)
        print(f"   Extracted entities for Graph lookup: {extracted_entities}")

        # Step 2: Fetch hybrid context
        retrieval_data = self.retriever.retrieve(question, extracted_entities)
        
        vector_context = self.retriever.format_vector_context(retrieval_data["vector_results"])
        graph_context = self.retriever.format_graph_context(retrieval_data["graph_results"])

        # Step 3: Format query generation prompt
        generation_prompt = ANSWER_GENERATION_PROMPT.format(
            question=question,
            vector_context=vector_context,
            graph_context=graph_context
        )

        # Step 4: Generate response from LLM
        print("   Generating cited answer...")
        llm_response = self.llm.generate(generation_prompt)

        # Step 5: Safely parse JSON result from LLM
        parsed_result = safe_json_parse(llm_response)
        
        # Structure final output and ensure fallbacks are provided
        answer = parsed_result.get("answer", "I'm sorry, I could not generate an answer based on the retrieved context.")
        confidence = parsed_result.get("confidence", 0.0)
        sources = parsed_result.get("sources", [])
        key_entities = parsed_result.get("key_entities", extracted_entities)
        follow_up = parsed_result.get("follow_up_suggestions", [])

        # Format graph context for reporting
        formatted_graph_relations = []
        for res in retrieval_data["graph_results"]:
            content = res.content
            if isinstance(content, dict):
                formatted_graph_relations.append(
                    f"{content.get('source')} —[{content.get('relationship')}]→ {content.get('target')}"
                )
            else:
                formatted_graph_relations.append(str(content))

        return {
            "answer": answer,
            "confidence": confidence,
            "sources": sources,
            "graph_context": formatted_graph_relations,
            "key_entities": key_entities,
            "follow_up_suggestions": follow_up
        }

    def _extract_entities(self, question: str) -> list:
        """
        Uses the LLM to extract key entity tags from a user question.
        """
        prompt = ENTITY_EXTRACTION_FROM_QUERY_PROMPT.format(question=question)
        
        try:
            response = self.llm.generate(prompt)
            data = safe_json_parse(response)
            return data.get("entities", [])
        except Exception as e:
            print(f"   [WARNING] Failed to extract entities from query: {e}")
            return []
