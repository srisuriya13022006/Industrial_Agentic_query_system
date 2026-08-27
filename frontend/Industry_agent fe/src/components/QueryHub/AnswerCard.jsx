import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  Network, 
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Clock
} from 'lucide-react';

export const AnswerCard = ({ responseData, onSelectFollowUp, onHighlightSource }) => {
  if (!responseData) return null;

  const {
    answer,
    confidence = 0.85,
    sources = [],
    evidence_classification = [],
    contradictions = [],
    follow_up_suggestions = []
  } = responseData;

  const confidencePct = Math.round(confidence * 100);
  const isConfidenceHigh = confidencePct >= 75;

  return (
    <div className="answer-container-card animate-fade-in">
      {/* Top Meta Bar */}
      <div className="answer-header-meta">
        <div className="answer-meta-left">
          <span style={{ color: 'var(--amber-primary)', fontWeight: 600 }}>SYNTHESIZED COPILOT VERDICT</span>
          <span>&middot;</span>
          <span>{sources.length} SOURCES RESOLVED</span>
          <span>&middot;</span>
          <span>CROSS-SYSTEM GRAPH CHECKED</span>
        </div>

        <div className={`confidence-gauge ${isConfidenceHigh ? '' : 'medium'}`}>
          <ShieldCheck size={14} />
          <span>{confidencePct}% CALIBRATED CONFIDENCE</span>
        </div>
      </div>

      {/* Answer Prose Body */}
      <div className="answer-body-prose">
        <p>{answer}</p>
      </div>

      {/* Contradiction Warning Alert */}
      {contradictions && contradictions.length > 0 && (
        <div className="contradiction-alert-box">
          <AlertTriangle size={16} style={{ color: 'var(--rose-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--rose-primary)', marginBottom: '2px' }}>
              Semantic Discrepancy Flagged by Contradiction Detector:
            </div>
            {contradictions.map((c, i) => (
              <div key={i}>• {c} (Confidence penalised accordingly)</div>
            ))}
          </div>
        </div>
      )}

      {/* Fact vs. Hypothesis vs. Recommendation Breakdown */}
      {evidence_classification && evidence_classification.length > 0 && (
        <div className="findings-badge-grid">
          {evidence_classification.map((item, idx) => {
            const type = item.evidence_type || 'FACT';
            let icon = <CheckCircle size={12} />;
            let cssClass = 'direct-fact';

            if (type === 'HYPOTHESIS') {
              icon = <HelpCircle size={12} />;
              cssClass = 'hypothesis';
            } else if (type === 'RECOMMENDATION') {
              icon = <Sparkles size={12} />;
              cssClass = 'recommendation';
            } else if (type === 'HISTORICAL_FACT') {
              icon = <Clock size={12} />;
              cssClass = 'historical-fact';
            }

            return (
              <div key={idx} className={`finding-tag ${cssClass}`}>
                {icon}
                <span style={{ fontWeight: 600 }}>{type}:</span>
                <span>{item.claim}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Follow-up Question Chips */}
      {follow_up_suggestions && follow_up_suggestions.length > 0 && (
        <div className="followup-suggestions-row">
          <div className="followup-title">RECOMMENDED NEXT INVESTIGATIONS:</div>
          <div className="followup-chips">
            {follow_up_suggestions.map((sugg, idx) => (
              <button
                key={idx}
                type="button"
                className="followup-chip-btn"
                onClick={() => onSelectFollowUp && onSelectFollowUp(sugg)}
              >
                <span>{sugg}</span>
                <ArrowRight size={11} style={{ marginLeft: '4px', opacity: 0.7 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
