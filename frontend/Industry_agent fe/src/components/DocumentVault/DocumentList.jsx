import React, { useState } from 'react';
import { FileText, Search, ExternalLink, CheckCircle2, Filter } from 'lucide-react';
import { INITIAL_DOCUMENTS } from '../../data/mockData';

export const DocumentList = ({ documents = INITIAL_DOCUMENTS }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || doc.type.toUpperCase() === filterType.toUpperCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="card-widget animate-fade-in">
      <div className="card-widget-head">
        <h3 style={{ fontSize: '15px', color: '#ffffff' }}>Indexed Document Library ({filteredDocs.length})</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'PDF', 'DOCX', 'EXCEL'].map(t => (
            <button
              key={t}
              className="preset-chip-btn"
              style={{
                borderColor: filterType === t ? 'var(--amber-primary)' : 'var(--border-subtle)',
                color: filterType === t ? '#ffffff' : 'var(--text-secondary)',
                background: filterType === t ? 'var(--amber-bg)' : 'var(--bg-surface)'
              }}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-core)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)', marginBottom: '16px' }}>
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Filter document name or work order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'transparent', color: '#ffffff', width: '100%', fontSize: '12.5px' }}
        />
      </div>

      {/* Documents Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
              <th style={{ padding: '8px 12px' }}>DOCUMENT NAME</th>
              <th style={{ padding: '8px 12px' }}>TYPE</th>
              <th style={{ padding: '8px 12px' }}>CHUNKS</th>
              <th style={{ padding: '8px 12px' }}>INDEXED DATE</th>
              <th style={{ padding: '8px 12px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr 
                key={doc.id}
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                  <FileText size={14} style={{ color: 'var(--amber-primary)' }} />
                  <span>{doc.name}</span>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan-primary)' }}>
                  {doc.type}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {doc.chunks}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {doc.indexedAt}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--emerald-bg)', color: 'var(--emerald-primary)', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <CheckCircle2 size={10} />
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
