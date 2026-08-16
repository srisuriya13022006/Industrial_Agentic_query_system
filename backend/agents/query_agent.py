import json
from backend.llm.gemini_service import GeminiService
from backend.retrieval.hybrid_retriever import HybridRetriever
from backend.prompts.query_prompts import (
    ENTITY_EXTRACTION_FROM_QUERY_PROMPT,
    EVIDENCE_VALIDATION_PROMPT,
    ANSWER_GENERATION_PROMPT
)
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

        # Step 3: Run Evidence Validation
        print("   Validating evidence...")
        validation_prompt = EVIDENCE_VALIDATION_PROMPT.format(
            question=question,
            vector_context=vector_context,
            graph_context=graph_context
        )
        validation_response = self.llm.generate(validation_prompt)
        validation_response = validation_response.replace("```json", "").replace("```", "").strip()
        validation_report = safe_json_parse(validation_response)

        # Step 4: Format query generation prompt
        print("   Generating cited answer based on validated findings...")
        generation_prompt = ANSWER_GENERATION_PROMPT.format(
            question=question,
            validation_report=json.dumps(validation_report, indent=2)
        )

        # Step 5: Generate response from LLM
        llm_response = self.llm.generate(generation_prompt)
        llm_response = llm_response.replace("```json", "").replace("```", "").strip()
        parsed_result = safe_json_parse(llm_response)
        
        # Structure final output and ensure fallbacks are provided
        answer = parsed_result.get("answer", "I'm sorry, I could not generate an answer based on the retrieved context.")
        sources = parsed_result.get("sources", [])
        for src in sources:
            if "name" in src and "document" not in src:
                src["document"] = src["name"]
            elif "document" in src and "name" not in src:
                src["name"] = src["document"]
        key_entities = parsed_result.get("key_entities", extracted_entities)
        follow_up = parsed_result.get("follow_up_suggestions", [])

        # Programmatically Calculate Confidence Score
        top_vector_sim = 0.0
        if retrieval_data.get("vector_results"):
            top_vector_sim = max([res.metadata.get("similarity", 0.0) for res in retrieval_data["vector_results"]])

        directness = validation_report.get("evidence_directness", 0.5)
        graph_support = 1.0 if len(retrieval_data.get("graph_results", [])) > 0 else 0.0

        entity_match = 0.0
        if extracted_entities:
            matched = 0
            top_chunks_text = " ".join([res.content.lower() for res in retrieval_data.get("vector_results", [])[:2]])
            graph_text = ""
            for res in retrieval_data.get("graph_results", []):
                if isinstance(res.content, dict):
                    graph_text += f" {res.content.get('source', '')} {res.content.get('target', '')}".lower()
            for ent in extracted_entities:
                if ent.lower() in top_chunks_text or ent.lower() in graph_text:
                    matched += 1
            entity_match = matched / len(extracted_entities)

        calibrated = (
            0.40 * top_vector_sim +
            0.30 * directness +
            0.20 * graph_support +
            0.10 * entity_match
        )
        confidence = round(min(0.95, calibrated), 2)

        # Format graph context for reporting
        formatted_graph_relations = []
        for res in retrieval_data["graph_results"]:
            content = res.content
            if isinstance(content, dict):
                formatted_graph_relations.append(
                    f"{content.get('source')} -[{content.get('relationship')}]-> {content.get('target')}"
                )
            else:
                formatted_graph_relations.append(str(content))

        return {
            "answer": answer,
            "confidence": confidence,
            "sources": sources,
            "graph_context": formatted_graph_relations,
            "key_entities": key_entities,
            "follow_up_suggestions": follow_up,
            "evidence_classification": validation_report.get("findings", [])
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
