import React from 'react';
import { Settings2, AlertTriangle, CheckCircle, Clock, Activity, Gauge } from 'lucide-react';
import { INITIAL_EQUIPMENT } from '../../data/mockData';

export const EquipmentCard = ({ equipment = INITIAL_EQUIPMENT }) => {
  return (
    <div className="two-column-grid animate-fade-in">
      {/* Equipment Specifications Card */}
      <div className="card-widget">
        <div className="card-widget-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} style={{ color: 'var(--amber-primary)' }} />
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#ffffff' }}>
              Equipment Telemetry & Context
            </h3>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber-primary)' }}>
            TAG: {equipment.tag}
          </span>
        </div>

        <div className="spec-key-value-grid">
          <div className="spec-item">
            <div className="spec-label">Equipment Model</div>
            <div className="spec-value">{equipment.model}</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Commissioned Date</div>
            <div className="spec-value">{equipment.commissioned}</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Operating Hours</div>
            <div className="spec-value">{equipment.operatingHours}</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Last Oil Change</div>
            <div className="spec-value">{equipment.lastOilChange}</div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Vibration Status</div>
            <div className="spec-value" style={{ color: 'var(--amber-primary)' }}>
              {equipment.vibration}
            </div>
          </div>
          <div className="spec-item">
            <div className="spec-label">Alignment Metric</div>
            <div className="spec-value" style={{ color: 'var(--emerald-primary)' }}>
              {equipment.alignment}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 8px', background: 'var(--amber-bg)', color: 'var(--amber-primary)', borderRadius: '4px', border: '1px solid var(--amber-dim)' }}>
            ▲ Vibration: Marginal
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 8px', background: 'var(--emerald-bg)', color: 'var(--emerald-primary)', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
            ✓ Alignment: Nominal
          </span>
        </div>
      </div>

      {/* Maintenance & Shift History Timeline */}
      <div className="card-widget">
        <div className="card-widget-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--cyan-primary)' }} />
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#ffffff' }}>
              Maintenance Event Timeline
            </h3>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {equipment.history?.length || 0} EVENTS
          </span>
        </div>

        <div className="history-timeline">
          {equipment.history?.map((event, idx) => (
            <div key={idx} className={`timeline-event ${event.flagged ? 'flagged' : ''}`}>
              <span className="timeline-date">{event.date}</span>
              <span className="timeline-text">{event.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
