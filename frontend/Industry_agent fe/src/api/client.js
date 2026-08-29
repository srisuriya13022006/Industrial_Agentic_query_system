/**
 * API client for communicating with the FastAPI backend.
 * Falls back gracefully to high-fidelity mock data if the backend is unavailable.
 */

import { MOCK_RESPONSES, INITIAL_DOCUMENTS } from "../data/mockData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = {
  /**
   * Check backend connectivity health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Health check failed");
      return await response.json();
    } catch (err) {
      console.warn("Backend health check failed, running in fallback mode:", err);
      return { status: "offline", error: err.message };
    }
  },

  /**
   * Submit natural language query to the LangGraph Copilot
   */
  async queryCopilot(question) {
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        throw new Error(`Query failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Live API error for '${question}', falling back to mock dataset:`, err);

      // Check if we have an exact or fuzzy match in MOCK_RESPONSES
      for (const [key, val] of Object.entries(MOCK_RESPONSES)) {
        if (question.toLowerCase().includes(key.toLowerCase().slice(0, 15))) {
          return val;
        }
      }

      // Default synthetic response if unknown query
      return {
        answer: `Processed via fallback agent: Context retrieved for "${question}". Evidence indicates nominal operating baseline across available equipment datasets.`,
        confidence: 0.75,
        sources: [
          { document: "system_telemetry_cache.pdf", type: "document", page: 1, section: "Operational Logs", detail: "General system state.", verified: true }
        ],
        graph_context: ["Equipment -[STATUS]-> Normal"],
        key_entities: ["Industrial System"],
        follow_up_suggestions: ["Check vibration trends", "Inspect maintenance history"],
        evidence_classification: [
          { claim: "Operational parameters nominal", evidence_type: "DIRECT_FACT", source: "telemetry" }
        ],
        contradictions: [],
        canonical_entities: [{ entity_id: "equipment:system", name: "System", type: "EQUIPMENT" }],
        sub_questions: [question]
      };
    }
  },

  /**
   * Upload a document to the LangGraph ingestion pipeline
   */
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn("Upload API failed, returning simulated successful ingestion:", err);
      return {
        filename: file.name,
        status: "processed and stored successfully (simulated)",
        knowledge_extracted: [
          { chunk: `Extracted content from ${file.name}`, entities: [], relationships: [] }
        ]
      };
    }
  },

  /**
   * Fetch live Neo4j Knowledge Graph nodes and edges
   */
  async getGraphData(entity = null, limit = 80) {
    try {
      const url = new URL(`${API_BASE_URL}/graph/data`);
      if (entity) url.searchParams.append("entity", entity);
      if (limit) url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to fetch graph data");
      return await response.json();
    } catch (err) {
      console.warn("Live graph fetch failed, falling back:", err);
      return null;
    }
  },

  /**
   * Fetch live Neo4j statistics
   */
  async getGraphStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/graph/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to fetch graph stats");
      return await response.json();
    } catch (err) {
      console.warn("Live graph stats fetch failed:", err);
      return null;
    }
  }
};

