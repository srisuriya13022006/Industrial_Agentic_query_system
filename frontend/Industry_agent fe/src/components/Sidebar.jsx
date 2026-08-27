import React from 'react';
import { 
  MessageSquare, 
  Network, 
  FolderArchive, 
  Activity, 
  GitFork, 
  Layers, 
  ChevronRight,
  Database,
  FileCheck
} from 'lucide-react';


export const Sidebar = ({ activeTab, setActiveTab, docCount = 14208, selectedAsset, onSelectAsset }) => {
  return (
    <aside className="sidebar-nav">
      <div>
        {/* Navigation Section */}
        <div className="nav-section-title">Workspace</div>
        <div className="nav-group">
          <button 
            className={`nav-tab-btn ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            <div className="nav-btn-content">
              <MessageSquare className="nav-icon" />
              <span>Ask & Investigate</span>
            </div>
            <span className="nav-chip">AI Copilot</span>
          </button>


          <button 
            className={`nav-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <div className="nav-btn-content">
              <Network className="nav-icon" />
              <span>Knowledge Graph</span>
            </div>
            <span className="nav-chip">Neo4j</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            <div className="nav-btn-content">
              <FolderArchive className="nav-icon" />
              <span>Document Vault</span>
            </div>
            <span className="nav-chip">{docCount} docs</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <div className="nav-btn-content">
              <Activity className="nav-icon" />
              <span>System Telemetry</span>
            </div>
            <span className="nav-chip">Live</span>
          </button>
        </div>

        {/* Plant Asset Hierarchy */}
        <div className="nav-section-title">Plant Assets (Unit 3)</div>
        <div className="nav-group" style={{ gap: '2px' }}>
          <div 
            className={`plant-asset-item ${selectedAsset === 'GB-RM3-0207' ? 'active' : ''}`}
            onClick={() => onSelectAsset && onSelectAsset('GB-RM3-0207')}
            style={{ fontWeight: 600, color: 'var(--paper-100)' }}
          >
            <span className="asset-dot amber" />
            <span>GB-RM3-0207 (Gearbox)</span>
          </div>

          <div 
            className={`plant-asset-item ${selectedAsset === 'PUMP-P101' ? 'active' : ''}`}
            onClick={() => onSelectAsset && onSelectAsset('PUMP-P101')}
          >
            <span className="asset-dot amber" />
            <span>Pump P101 (Slurry Feed)</span>
          </div>

          <div 
            className={`plant-asset-item ${selectedAsset === 'MTR-RM3-0118' ? 'active' : ''}`}
            onClick={() => onSelectAsset && onSelectAsset('MTR-RM3-0118')}
          >
            <span className="asset-dot green" />
            <span>MTR-RM3-0118 (Main Motor)</span>
          </div>

          <div 
            className={`plant-asset-item ${selectedAsset === 'HYD-RM3-0044' ? 'active' : ''}`}
            onClick={() => onSelectAsset && onSelectAsset('HYD-RM3-0044')}
          >
            <span className="asset-dot green" />
            <span>HYD-RM3-0044 (Hydraulic)</span>
          </div>

          <div 
            className={`plant-asset-item ${selectedAsset === 'CNV-RM3-0093' ? 'active' : ''}`}
            onClick={() => onSelectAsset && onSelectAsset('CNV-RM3-0093')}
          >
            <span className="asset-dot slate" />
            <span>CNV-RM3-0093 (Discharge)</span>
          </div>
        </div>
      </div>

      {/* Footer / Engine Info */}
      <div className="sidebar-footer">
        <div className="langgraph-badge-card">
          <div className="langgraph-icon">
            <GitFork size={15} />
          </div>
          <div className="langgraph-text">
            <h5 style={{ color: '#ffffff' }}>LangGraph 1.2 Engine</h5>
            <p>Self-Corrective Multi-Agent RAG</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
