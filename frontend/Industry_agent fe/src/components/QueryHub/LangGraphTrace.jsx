import React from 'react';
import { GitFork, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

const GRAPH_NODES = [
  { id: 'extract', name: 'Extract & Decompose', desc: 'LLM + Regex Fallback' },
  { id: 'canonicalize', name: 'Canonicalize Entities', desc: 'Ontology Mapping' },
  { id: 'retrieve', name: 'Hybrid Retrieve', desc: 'FAISS + 3-Tier Cypher' },
  { id: 'validate', name: 'Evidence Validation', desc: 'Contradiction Detector' },
  { id: 'expand', name: 'Adaptive Graph Expansion', desc: 'Multi-Hop CRAG Loop' },
  { id: 'generate', name: 'Grounded Synthesis', desc: 'Fact vs. Hypothesis' },
  { id: 'verify', name: 'Verify & Calibrate', desc: 'Citation Cross-Check' }
];

export const LangGraphTrace = ({ activeStep = 7, isExpanding = false }) => {
  return (
    <div className="langgraph-stepper-card animate-fade-in">
      <div className="stepper-header">
        <div className="stepper-title">
          <GitFork size={15} style={{ color: 'var(--cyan-primary)' }} />
          <span>LangGraph Reasoning Trajectory</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--emerald-primary)' }}>
          ✓ ALL 7 AGENT NODES EXECUTED
        </span>
      </div>

      <div className="stepper-track">
        {GRAPH_NODES.map((node, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep - 1;

          return (
            <div 
              key={node.id} 
              className={`stepper-node ${isDone ? 'complete' : ''} ${isCurrent ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="node-idx">NODE 0{idx + 1}</span>
                {isDone && <CheckCircle2 size={10} style={{ color: 'var(--emerald-primary)' }} />}
              </div>
              <span className="node-name" title={node.name}>{node.name}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {node.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
