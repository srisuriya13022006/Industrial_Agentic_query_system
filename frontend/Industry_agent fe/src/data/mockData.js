/**
 * Preset data for high-fidelity industrial queries and equipment telemetry.
 */

export const PRESET_QUERIES = [
  "Why did Pump P101 fail?",
  "Who replaced the bearing on Pump P101?",
  "What is the status of lubrication work?",
  "Why did GB-RM3-0207 flag a startup noise, and is it safe to run?",
  "What are the OEM vibration limits for MAAG WPU-450 gearbox?"
];

export const MOCK_RESPONSES = {
  "Why did Pump P101 fail?": {
    answer: "Pump P101 failed directly due to bearing overheating, confirmed as a direct fact in maintenance logs (Source: Document Chunk 0, Graph Relation 1). In addition, recorded historical events show a prior minor water ingress incident traced to a damaged breather cap on 02-May-2026, and an intermittent start-up noise reported on 17-Jul-2026.",
    confidence: 0.83,
    sources: [
      {
        document: "maintenance_report_P101.pdf",
        type: "document",
        page: 1,
        section: "Root Cause Summary",
        detail: "Confirmed direct fact that Pump P101 failed due to bearing overheating.",
        verified: true
      },
      {
        document: "Knowledge Graph",
        type: "graph",
        page: null,
        section: "Neo4j Relation",
        detail: "Pump P101 -[HAS_ISSUE]-> bearing overheating (depth=1).",
        verified: true
      },
      {
        document: "shift_log_july2026.docx",
        type: "document",
        page: 3,
        section: "Shift A Handover",
        detail: "Historical event: unusual noise during cold start-up.",
        verified: true
      }
    ],
    graph_context: [
      "Pump P101 -[HAS_ISSUE]-> bearing overheating [depth=1]",
      "Pump P101 -[HAS_COMPONENT]-> bearing [depth=1]"
    ],
    key_entities: ["Pump P101", "Bearing", "Breather Cap"],
    follow_up_suggestions: [
      "Who replaced the bearing on Pump P101?",
      "Has the damaged breather cap on Pump P101 been repaired?",
      "What vibration threshold was recorded prior to failure?"
    ],
    evidence_classification: [
      { claim: "Pump P101 failed due to bearing overheating", evidence_type: "DIRECT_FACT", source: "maintenance_report_P101.pdf" },
      { claim: "Water ingress occurred via damaged breather cap on 02-May-2026", evidence_type: "HISTORICAL_FACT", source: "shift_log_july2026.docx" },
      { claim: "Bearing requires follow-up alignment check", evidence_type: "RECOMMENDATION", source: "maintenance_report_P101.pdf" }
    ],
    contradictions: [],
    canonical_entities: [
      { entity_id: "equipment:pump_p101", name: "Pump P101", type: "EQUIPMENT" },
      { entity_id: "component:bearing", name: "Bearing", type: "COMPONENT" }
    ],
    sub_questions: ["Why did Pump P101 fail?"]
  },

  "Who replaced the bearing on Pump P101?": {
    answer: "Technician Raj replaced the bearing on Pump P101 as recorded in maintenance work order WO-2026-118820 (DIRECT_FACT, Source: Document Chunk 1). This replacement was performed following the failure of Pump P101 due to bearing overheating.",
    confidence: 0.73,
    sources: [
      {
        document: "work_order_WO-2026-118820.pdf",
        type: "document",
        page: 2,
        section: "Technician Sign-off",
        detail: "Confirmed that Technician Raj completed bearing replacement.",
        verified: true
      },
      {
        document: "Knowledge Graph",
        type: "graph",
        page: null,
        section: "Neo4j Multi-hop",
        detail: "bearing -[REPLACED]-> Technician Raj [depth=1]",
        verified: true
      }
    ],
    graph_context: [
      "bearing -[REPLACED]-> Technician Raj [depth=1]",
      "Pump P101 -[HAS_COMPONENT]-> bearing [depth=1]",
      "Pump P101 -[HAS_ISSUE]-> bearing overheating [depth=1]"
    ],
    key_entities: ["Technician Raj", "Pump P101", "Bearing"],
    follow_up_suggestions: [
      "What is the current operational status of Pump P101?",
      "Were any post-replacement vibration checks logged?"
    ],
    evidence_classification: [
      { claim: "Technician Raj replaced the bearing", evidence_type: "DIRECT_FACT", source: "work_order_WO-2026-118820.pdf" },
      { claim: "Pump P101 bearing overheating triggered the work order", evidence_type: "DIRECT_FACT", source: "maintenance_report_P101.pdf" }
    ],
    contradictions: ["Document context contains negation/uncertainty not reflected in the knowledge graph."],
    canonical_entities: [
      { entity_id: "person:raj", name: "Technician Raj", type: "PERSON" },
      { entity_id: "component:bearing", name: "Bearing", type: "COMPONENT" }
    ],
    sub_questions: ["Who replaced the bearing on Pump P101?"]
  },

  "What is the status of lubrication work?": {
    answer: "The lubrication work has been completed successfully as per quarterly schedule (DIRECT_FACT, Source: Document Chunk 2). In addition, a repeat oil analysis to monitor the iron (Fe) content trend is recommended after 2 weeks of continuous operation (RECOMMENDATION, Source: Document Chunk 10).",
    confidence: 0.60,
    sources: [
      {
        document: "lubrication_log_q3.xlsx",
        type: "document",
        page: 1,
        section: "Sheet: LubeLog",
        detail: "Direct fact confirming lubrication completed successfully.",
        verified: true
      },
      {
        document: "oil_analysis_recommendations.pdf",
        type: "document",
        page: 4,
        section: "LIMS Advisory",
        detail: "Recommendation to repeat Fe content analysis after 2 weeks.",
        verified: true
      }
    ],
    graph_context: [],
    key_entities: ["Lubrication", "Oil Analysis", "Fe Content Trend"],
    follow_up_suggestions: [
      "When is the next scheduled oil sample collection?",
      "Are baseline lab figures available for comparison?"
    ],
    evidence_classification: [
      { claim: "Lubrication completed successfully", evidence_type: "DIRECT_FACT", source: "lubrication_log_q3.xlsx" },
      { claim: "Repeat oil analysis after 2 weeks of operation", evidence_type: "RECOMMENDATION", source: "oil_analysis_recommendations.pdf" }
    ],
    contradictions: [],
    canonical_entities: [
      { entity_id: "process:lubrication_work", name: "Lubrication Work", type: "PROCESS" }
    ],
    sub_questions: ["What is the status of lubrication work?"]
  }
};

export const INITIAL_EQUIPMENT = {
  tag: "GB-RM3-0207",
  name: "Helical Gearbox — Main Drive Stand 2",
  unit: "Unit 3 · Rolling Mill Complex",
  model: "MAAG WPU-450",
  commissioned: "11 Mar 2016",
  operatingHours: "38,420 hrs",
  lastOilChange: "02 May 2026",
  lastPM: "18 Jul 2026",
  status: "Marginal (Monitoring)",
  vibration: "4.8 mm/s RMS (Threshold: 4.5 mm/s)",
  noise: "Start-up rattle settles under load",
  alignment: "Nominal (0.03 mm)",
  history: [
    { date: "17 JUL 2026 · A SHIFT", text: "Operator logs intermittent start-up noise near output shaft seal", flagged: true },
    { date: "02 MAY 2026", text: "Oil changed ahead of schedule due to breather cap damage", flagged: false },
    { date: "14 FEB 2026", text: "Quarterly PM — all vibration and oil parameters nominal", flagged: false },
    { date: "SEP 2023", text: "DE-side bearing replaced under WO-2023-097712", flagged: true },
    { date: "MAR 2016", text: "Commissioned on Unit 3 Stand No. 2", flagged: false }
  ]
};

export const INITIAL_DOCUMENTS = [
  { id: "DOC-001", name: "maintenance_report_P101.pdf", type: "PDF", size: "1.4 MB", chunks: 18, indexedAt: "2026-08-20 14:22", status: "Indexed in Neo4j & FAISS" },
  { id: "DOC-002", name: "GB-RM3-0207_Inspection_Report.pdf", type: "PDF", size: "2.8 MB", chunks: 32, indexedAt: "2026-08-22 10:15", status: "Indexed in Neo4j & FAISS" },
  { id: "DOC-003", name: "MAAG_WPU450_OEM_Manual.pdf", type: "PDF", size: "8.1 MB", chunks: 74, indexedAt: "2026-08-23 09:30", status: "Indexed in Neo4j & FAISS" },
  { id: "DOC-004", name: "lubrication_log_q3.xlsx", type: "Excel", size: "420 KB", chunks: 12, indexedAt: "2026-08-25 16:40", status: "Indexed in Neo4j & FAISS" },
  { id: "DOC-005", name: "shift_log_july2026.docx", type: "DOCX", size: "890 KB", chunks: 15, indexedAt: "2026-08-26 11:05", status: "Indexed in Neo4j & FAISS" }
];
