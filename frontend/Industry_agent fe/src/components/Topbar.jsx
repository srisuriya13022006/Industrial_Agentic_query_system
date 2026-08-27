import React from 'react';
import { Activity, Shield, Cpu, RefreshCw } from 'lucide-react';

export const Topbar = ({ isOnline, onRefreshHealth, activeUnit = "Unit 3 · Rolling Mill Complex" }) => {
  return (
    <header className="topbar-header">
      {/* Brand Identification */}
      <div className="topbar-brand">
        <div className="brand-icon-wrapper">
          <Cpu size={18} />
        </div>
        <div className="brand-title-group">
          <span className="brand-title">SUTRA</span>
          <span className="brand-badge">LANGGRAPH ORCHESTRATED</span>
        </div>
      </div>

      {/* Right Telemetry & Controls */}
      <div className="topbar-actions">
        <div className="status-badge" title="FastAPI & LangGraph Connectivity">
          <span className={`status-indicator ${isOnline ? '' : 'offline'}`} />
          <span>{isOnline ? 'BACKEND ONLINE' : 'OFFLINE (DEMO MODE)'}</span>
          <button 
            onClick={onRefreshHealth} 
            title="Refresh connection status"
            style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="status-badge" style={{ color: 'var(--text-secondary)' }}>
          <Shield size={12} style={{ color: 'var(--amber-primary)', marginRight: '4px' }} />
          <span>{activeUnit}</span>
        </div>

        <div className="user-profile-badge">
          <div className="avatar-circle">ENG</div>
          <span style={{ fontWeight: 600 }}>R. Kannan (Chief Eng.)</span>
        </div>
      </div>
    </header>
  );
};
