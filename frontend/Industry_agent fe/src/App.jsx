import React, { useState, useEffect } from 'react';
import './App.css';
import { apiClient } from './api/client';
import { MOCK_RESPONSES, INITIAL_DOCUMENTS, INITIAL_EQUIPMENT } from './data/mockData';

import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { QueryInput } from './components/QueryHub/QueryInput';
import { LangGraphTrace } from './components/QueryHub/LangGraphTrace';
import { AnswerCard } from './components/QueryHub/AnswerCard';
import { EquipmentCard } from './components/QueryHub/EquipmentCard';
import { EvidenceTrace } from './components/QueryHub/EvidenceTrace';
import { GraphCanvas } from './components/GraphExplorer/GraphCanvas';
import { DocumentUploader } from './components/DocumentVault/DocumentUploader';
import { DocumentList } from './components/DocumentVault/DocumentList';
import { SystemHealth } from './components/Telemetry/SystemHealth';

export function App() {
  const [activeTab, setActiveTab] = useState('query');
  const [isOnline, setIsOnline] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('Why did Pump P101 fail?');
  const [responseData, setResponseData] = useState(MOCK_RESPONSES['Why did Pump P101 fail?']);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [selectedAsset, setSelectedAsset] = useState('PUMP-P101');
  const [highlightedDoc, setHighlightedDoc] = useState(null);

  // Check health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    const health = await apiClient.checkHealth();
    setIsOnline(health.status === 'healthy');
  };

  const handleExecuteQuery = async (queryText) => {
    setCurrentQuery(queryText);
    setLoading(true);

    try {
      const result = await apiClient.queryCopilot(queryText);
      setResponseData(result);
    } catch (err) {
      console.error("Query execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  return (
    <div className="app-container">
      {/* Top Bar */}
      <Topbar 
        isOnline={isOnline} 
        onRefreshHealth={checkBackendHealth}
      />

      {/* Main Grid Body */}
      <div className={`app-body ${activeTab !== 'query' ? 'no-trace' : ''}`}>
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          docCount={documents.length + 14200}
          selectedAsset={selectedAsset}
          onSelectAsset={(asset) => {
            setSelectedAsset(asset);
            if (asset === 'PUMP-P101') handleExecuteQuery('Why did Pump P101 fail?');
            if (asset === 'GB-RM3-0207') handleExecuteQuery('Why did GB-RM3-0207 flag a startup noise, and is it safe to run?');
          }}
        />

        {/* Center Main Viewport */}
        <main className="main-view-container">
          {activeTab === 'query' && (
            <>
              {/* Query Hero */}
              <QueryInput 
                onSearch={handleExecuteQuery}
                loading={loading}
                currentQuery={currentQuery}
              />

              {/* LangGraph Agentic Stepper */}
              <LangGraphTrace 
                activeStep={loading ? 4 : 7} 
                isExpanding={responseData?.graph_context?.length === 0}
              />

              {/* Synthesized Answer */}
              <AnswerCard 
                responseData={responseData}
                onSelectFollowUp={handleExecuteQuery}
                onHighlightSource={setHighlightedDoc}
              />

              {/* Equipment Context & History */}
              <EquipmentCard />
            </>
          )}

          {activeTab === 'graph' && (
            <GraphCanvas />
          )}

          {activeTab === 'vault' && (
            <>
              <DocumentUploader onUploadSuccess={handleUploadSuccess} />
              <DocumentList documents={documents} />
            </>
          )}

          {activeTab === 'telemetry' && (
            <SystemHealth isOnline={isOnline} docCount={documents.length} />
          )}
        </main>

        {/* Right Evidence Trace Sidebar (Active in Query mode) */}
        {activeTab === 'query' && (
          <EvidenceTrace 
            sources={responseData?.sources || []}
            graphContext={responseData?.graph_context || []}
            highlightedDoc={highlightedDoc}
          />
        )}
      </div>
    </div>
  );
}

export default App;
