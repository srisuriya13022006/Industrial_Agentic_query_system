import React, { useState } from 'react';
import { Search, Sparkles, CornerDownLeft, Loader2, Filter } from 'lucide-react';
import { PRESET_QUERIES } from '../../data/mockData';

export const QueryInput = ({ onSearch, loading, currentQuery }) => {
  const [inputVal, setInputVal] = useState(currentQuery || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim() && !loading) {
      onSearch(inputVal.trim());
    }
  };

  const handleSelectPreset = (preset) => {
    setInputVal(preset);
    onSearch(preset);
  };

  return (
    <div className="query-hero-card">
      <div className="query-hero-eyebrow">
        <Sparkles size={14} />
        <span>Unified Industrial Intelligence Query</span>
      </div>

      <form className="query-input-form" onSubmit={handleSubmit}>
        <Search className="query-search-icon" />
        <input 
          type="text"
          className="query-input-field"
          placeholder="Ask anything across work orders, OEM manuals, vibration data, shift logs, SOPs..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="query-submit-btn"
          disabled={loading || !inputVal.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Investigate</span>
              <CornerDownLeft size={13} />
            </>
          )}
        </button>
      </form>

      {/* Preset Suggestions */}
      <div className="preset-prompts-row">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          SUGGESTED INVESTIGATIONS:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            className="preset-chip-btn"
            onClick={() => handleSelectPreset(preset)}
          >
            <span>{preset}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
