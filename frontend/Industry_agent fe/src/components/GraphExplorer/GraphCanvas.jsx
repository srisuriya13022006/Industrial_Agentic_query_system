import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Network, ZoomIn, ZoomOut, RefreshCw, Search, Maximize2 } from 'lucide-react';
import { apiClient } from '../../api/client';

// ----- helpers ---------------------------------------------------------------

const TYPE_COLORS = {
  equipment:  'var(--amber-primary)',
  component:  'var(--cyan-primary)',
  technician: 'var(--emerald-primary)',
  issue:      'var(--rose-primary)',
  process:    'var(--violet-primary)',
  location:   '#38bdf8',
  material:   '#fb923c',
  sensor:     '#e879f9',
};

function getColor(type) {
  return TYPE_COLORS[(type || '').toLowerCase()] || 'var(--text-secondary)';
}

/** Truncate a string and append ellipsis if too long */
function truncate(str, max = 15) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/** Run a simple Fruchterman–Reingold-inspired force simulation in JS */
function forceLayout(inputNodes, inputEdges, fullGraph = false) {
  const W = 900, H = 620;
  const cx = W / 2, cy = H / 2;
  const initR   = fullGraph ? 260 : 190;
  const spread  = fullGraph ? 50  : 30;
  const iters   = fullGraph ? 130 : 90;
  const rep     = fullGraph ? 9000 : 6000;
  const spring  = fullGraph ? 145  : 120;
  const kSpring = 0.035;

  // init
  const nodes = inputNodes.map((n, i) => {
    const angle = (i / Math.max(1, inputNodes.length)) * 2 * Math.PI;
    const dist  = initR + (i % 5) * (fullGraph ? 38 : 28);
    return {
      ...n,
      x:  cx + Math.cos(angle) * dist + (Math.random() - 0.5) * spread,
      y:  cy + Math.sin(angle) * dist + (Math.random() - 0.5) * spread,
      vx: 0,
      vy: 0,
    };
  });

  for (let iter = 0; iter < iters; iter++) {
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i], n2 = nodes[j];
        const dx = n2.x - n1.x, dy = n2.y - n1.y;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 350) {
          const f = rep / (d * d);
          n1.vx -= (dx / d) * f; n1.vy -= (dy / d) * f;
          n2.vx += (dx / d) * f; n2.vy += (dy / d) * f;
        }
      }
    }
    // spring
    for (const e of inputEdges) {
      const s = nodes.find(n => n.id === e.source);
      const t = nodes.find(n => n.id === e.target);
      if (s && t) {
        const dx = t.x - s.x, dy = t.y - s.y;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const f  = (d - spring) * kSpring;
        s.vx += (dx / d) * f; s.vy += (dy / d) * f;
        t.vx -= (dx / d) * f; t.vy -= (dy / d) * f;
      }
    }
    // gravity + integrate + damp
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.012;
      n.vy += (cy - n.y) * 0.012;
      n.x  += n.vx * 0.42;
      n.y  += n.vy * 0.42;
      n.vx *= 0.58;
      n.vy *= 0.58;
      n.x = Math.max(65, Math.min(W - 65, n.x));
      n.y = Math.max(55, Math.min(H - 55, n.y));
    }
  }
  return nodes;
}

// ----- Node label helper (avoids IIFE in JSX) --------------------------------

function NodeLabel({ label, id, radius, isSelected, color }) {
  const display = truncate(label || id || '', 15);
  const pillW   = Math.min(display.length * 7.4 + 12, 118);
  return (
    <g transform={`translate(0, ${radius + 15})`}>
      <rect
        x={-(pillW / 2)} y={-9}
        width={pillW} height={17}
        rx={3}
        fill="rgba(8,11,16,0.92)"
        stroke={isSelected ? color : 'rgba(255,255,255,0.11)'}
        strokeWidth={isSelected ? 1.5 : 0.8}
      />
      <text
        textAnchor="middle" dy={4}
        fill={isSelected ? '#ffffff' : '#c8ccd4'}
        fontSize="10.5px" fontWeight={isSelected ? 700 : 500}
        fontFamily="var(--font-sans)"
      >
        {display}
      </text>
    </g>
  );
}

// ----- Edge label helper -----------------------------------------------------

function EdgeLabel({ x, y, label }) {
  const w = Math.min((label || '').length * 7.2 + 14, 130);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-(w / 2)} y={-9} width={w} height={16} rx={3}
        fill="rgba(8,11,16,0.96)" stroke="var(--amber-primary)" strokeWidth={1}
      />
      <text textAnchor="middle" dy={3}
        fill="var(--amber-primary)" fontSize="8.5px"
        fontFamily="var(--font-mono)" fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export const GraphCanvas = () => {
  const [rawData,       setRawData]       = useState({ nodes: [], edges: [] });
  const [nodes,         setNodes]         = useState([]);
  const [edges,         setEdges]         = useState([]);
  const [selectedNode,  setSelectedNode]  = useState(null);
  const [hoveredNode,   setHoveredNode]   = useState(null);
  const [filterType,    setFilterType]    = useState('ALL');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [loading,       setLoading]       = useState(true);
  const [isLive,        setIsLive]        = useState(false);
  const [viewMode,      setViewMode]      = useState('EGO');
  const [activeAsset,   setActiveAsset]   = useState('Pump P101');
  const [zoom,          setZoom]          = useState(1);
  const [pan,           setPan]           = useState({ x: 0, y: 0 });
  const [isPanning,     setIsPanning]     = useState(false);
  const [panStart,      setPanStart]      = useState({ x: 0, y: 0 });
  const [draggedNode,   setDraggedNode]   = useState(null);

  const svgRef = useRef(null);

  // Fetch whenever mode/asset changes
  useEffect(() => { fetchGraph(); }, [viewMode, activeAsset]); // eslint-disable-line

  async function fetchGraph() {
    setLoading(true);
    try {
      const entity = viewMode === 'EGO' ? activeAsset : null;
      const limit  = viewMode === 'EGO' ? 35 : 55;
      const data   = await apiClient.getGraphData(entity, limit);
      if (data && data.nodes && data.nodes.length > 0) {
        setIsLive(true);
        setRawData(data);
        applyLayout(data.nodes, data.edges, viewMode === 'ALL');
      }
    } catch (err) {
      console.warn('Graph fetch error:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }

  function applyLayout(rawNodes, rawEdges, full = false) {
    const laid = forceLayout(rawNodes, rawEdges, full);
    setNodes(laid);
    setEdges(rawEdges);
    const primary = laid.find(n =>
      (n.id || '').toLowerCase().includes('pump') ||
      (n.id || '').toLowerCase().includes('gb-rm3')
    ) || laid[0];
    setSelectedNode(primary || null);
  }

  // --- derived data ---
  const nodeLabels = useMemo(() => {
    const ts = new Set(nodes.map(n => (n.type || 'Entity').toUpperCase()));
    return ['ALL', ...Array.from(ts)];
  }, [nodes]);

  const visibleNodes = useMemo(() =>
    nodes.filter(n => {
      const fOk = filterType === 'ALL' || (n.type || '').toUpperCase() === filterType;
      const sOk = !searchQuery || (n.label || n.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      return fOk && sOk;
    }),
  [nodes, filterType, searchQuery]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() =>
    edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target)),
  [edges, visibleIds]);

  const focusNode = hoveredNode || selectedNode;
  const neighborIds = useMemo(() => {
    if (!focusNode) return new Set();
    const s = new Set([focusNode.id]);
    for (const e of visibleEdges) {
      if (e.source === focusNode.id) s.add(e.target);
      if (e.target === focusNode.id) s.add(e.source);
    }
    return s;
  }, [focusNode, visibleEdges]);

  // --- mouse handlers ---
  function onWheel(e) {
    e.preventDefault();
    setZoom(z => Math.max(0.35, Math.min(2.8, z * (e.deltaY < 0 ? 1.12 : 0.9))));
  }

  function onMouseDown(e) {
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }

  function onMouseMove(e) {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggedNode && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const mx = (e.clientX - CTM.e) / CTM.a;
        const my = (e.clientY - CTM.f) / CTM.d;
        const ax = (mx - pan.x) / zoom;
        const ay = (my - pan.y) / zoom;
        setNodes(prev => prev.map(n => n.id === draggedNode.id ? { ...n, x: ax, y: ay } : n));
      }
    }
  }

  function onMouseUp() { setIsPanning(false); setDraggedNode(null); }

  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={18} style={{ color: 'var(--cyan-primary)' }} />
              Neo4j Knowledge Graph Explorer
            </h2>
            {isLive && (
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'var(--emerald-bg)', color: 'var(--emerald-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                ● LIVE NEO4J
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
            Force-directed layout · spotlight isolation · drag &amp; pan · scroll to zoom
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
            {['EGO', 'ALL'].map(m => (
              <button key={m}
                style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '4px',
                  color:      viewMode === m ? '#ffffff' : 'var(--text-muted)',
                  background: viewMode === m ? 'var(--bg-surface-elevated)' : 'transparent',
                  fontWeight: viewMode === m ? 600 : 400 }}
                onClick={() => setViewMode(m)}
              >
                {m === 'EGO' ? 'Focus Subgraph' : 'Full Graph'}
              </button>
            ))}
          </div>

          {/* Asset selector (EGO mode only) */}
          {viewMode === 'EGO' && (
            <select value={activeAsset} onChange={e => setActiveAsset(e.target.value)}
              style={{ background: 'var(--bg-surface)', color: 'var(--amber-primary)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
            >
              <option value="Pump P101">Asset: Pump P101</option>
              <option value="GB-RM3-0207">Asset: GB-RM3-0207</option>
            </select>
          )}

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search node…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', color: '#ffffff', fontSize: '12px', width: '110px' }}
            />
          </div>

          <button className="query-submit-btn"
            style={{ padding: '7px 12px', fontSize: '11.5px' }}
            onClick={fetchGraph} disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
          FILTER:
        </span>
        {nodeLabels.map(t => (
          <button key={t} className="preset-chip-btn"
            style={{ borderColor: filterType === t ? 'var(--cyan-primary)' : 'var(--border-subtle)',
              color: filterType === t ? '#ffffff' : 'var(--text-secondary)',
              background: filterType === t ? 'var(--cyan-bg)' : 'var(--bg-surface)' }}
            onClick={() => setFilterType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Canvas + Inspector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '18px' }}>

        {/* Canvas wrapper */}
        <div className="graph-canvas-container"
          style={{ position: 'relative', height: '620px', cursor: isPanning ? 'grabbing' : (draggedNode ? 'grabbing' : 'grab') }}
          onWheel={onWheel} onMouseDown={onMouseDown}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        >
          {/* Zoom controls */}
          <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
            {[
              { icon: <ZoomIn size={14} />,    fn: () => setZoom(z => Math.min(2.8, z + 0.16)), title: 'Zoom in'   },
              { icon: <ZoomOut size={14} />,   fn: () => setZoom(z => Math.max(0.35, z - 0.16)), title: 'Zoom out' },
              { icon: <Maximize2 size={14} />, fn: resetView, title: 'Reset view' },
            ].map(({ icon, fn, title }) => (
              <button key={title} onClick={fn} title={title}
                style={{ background: 'rgba(8,11,16,0.88)', border: '1px solid var(--border-base)', color: '#ffffff', padding: '6px', borderRadius: '4px', lineHeight: 0 }}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', pointerEvents: 'none' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.18)' }}>
              DRAG NODES · SCROLL ZOOM · CLICK TO INSPECT
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px' }}>
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--cyan-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Computing force layout · querying Neo4j…</span>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 900 620"
              style={{ background: 'var(--bg-core)', display: 'block' }}
            >
              <defs>
                <marker id="arr"        viewBox="0 -5 10 10" refX={22} refY={0} markerWidth={5} markerHeight={5} orient="auto">
                  <path d="M0,-4L8,0L0,4" fill="rgba(100,120,140,0.8)" />
                </marker>
                <marker id="arr-active" viewBox="0 -5 10 10" refX={22} refY={0} markerWidth={6} markerHeight={6} orient="auto">
                  <path d="M0,-4L8,0L0,4" fill="var(--amber-primary)" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

                {/* Edges */}
                {visibleEdges.map((edge, idx) => {
                  const src = nodes.find(n => n.id === edge.source);
                  const tgt = nodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;
                  const active  = focusNode && (focusNode.id === src.id || focusNode.id === tgt.id);
                  const dimmed  = focusNode && !active;
                  const midX    = (src.x + tgt.x) / 2;
                  const midY    = (src.y + tgt.y) / 2;
                  return (
                    <g key={idx} opacity={dimmed ? 0.07 : (active ? 1 : 0.4)}>
                      <line
                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke={active ? 'var(--amber-primary)' : 'rgba(90,110,130,0.9)'}
                        strokeWidth={active ? 2.2 : 1.1}
                        markerEnd={active ? 'url(#arr-active)' : 'url(#arr)'}
                        strokeDasharray={edge.label === 'MONITORS' ? '5 4' : undefined}
                      />
                      {active && (
                        <EdgeLabel x={midX} y={midY} label={edge.label} />
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {visibleNodes.map(node => {
                  const isSel  = selectedNode && selectedNode.id === node.id;
                  const isHov  = hoveredNode  && hoveredNode.id  === node.id;
                  const inNeighbor = neighborIds.has(node.id);
                  const dimmed = focusNode && !inNeighbor;
                  const color  = getColor(node.type);
                  const isEquip = (node.type || '').toLowerCase() === 'equipment';
                  const r = isSel ? 24 : isEquip ? 20 : 16;

                  return (
                    <g key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      style={{ cursor: 'pointer' }}
                      opacity={dimmed ? 0.15 : 1}
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onMouseDown={e => { e.stopPropagation(); setDraggedNode(node); }}
                    >
                      {/* Halo */}
                      {(isSel || isHov) && (
                        <circle r={r + 9} fill="none" stroke={color} strokeWidth={1.8} opacity={0.45}
                          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                        />
                      )}
                      {/* Body */}
                      <circle r={r} fill="var(--bg-surface-elevated)" stroke={color}
                        strokeWidth={isSel ? 3 : 2}
                        style={{ filter: isSel ? `drop-shadow(0 0 12px ${color})` : 'none' }}
                      />
                      {/* Initial */}
                      <text textAnchor="middle" dy={4.5} fill={color}
                        fontFamily="var(--font-display)" fontWeight={800}
                        fontSize={isEquip ? '13px' : '11px'}
                      >
                        {(node.type || 'E')[0]}
                      </text>
                      {/* Label — rendered via helper component (no IIFE) */}
                      <NodeLabel
                        label={node.label}
                        id={node.id}
                        radius={r}
                        isSelected={isSel}
                        color={color}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Bottom bar */}
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(8,11,16,0.88)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-base)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
              NODES {visibleNodes.length} &middot; EDGES {visibleEdges.length} &middot; ZOOM {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => applyLayout(rawData.nodes || [], rawData.edges || [], viewMode === 'ALL')}
              style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(8,11,16,0.88)', border: '1px solid var(--border-base)', color: 'var(--cyan-primary)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
              title="Shuffle force layout"
            >
              ↺ Re-layout
            </button>
          </div>
        </div>

        {/* Inspector drawer */}
        <div className="card-widget" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '620px' }}>
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: getColor(selectedNode?.type || ''), letterSpacing: '0.08em' }}>
              {selectedNode?.type || 'Entity'} Inspector
            </span>
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginTop: '4px', wordBreak: 'break-word' }}>
              {selectedNode?.label || 'Click a node to inspect'}
            </h3>
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>NODE ID</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedNode.id}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENTITY TYPE</div>
                <div style={{ fontSize: '13px', color: getColor(selectedNode.type), marginTop: '2px', fontWeight: 600 }}>
                  {selectedNode.type || 'Entity'}
                </div>
              </div>

              {/* Neo4j properties */}
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>NEO4J PROPERTIES</div>
                  <div style={{ background: 'var(--bg-core)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{k}:</span>
                        <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected edges */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  CONNECTIONS ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e, idx) => {
                      const isSrc     = e.source === selectedNode.id;
                      const nbrId     = isSrc ? e.target : e.source;
                      const neighbor  = nodes.find(n => n.id === nbrId);
                      return (
                        <div key={idx}
                          style={{ fontSize: '11.5px', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                          onClick={() => neighbor && setSelectedNode(neighbor)}
                        >
                          <span style={{ color: 'var(--amber-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                            {isSrc ? `—[${e.label}]→` : `←[${e.label}]—`}
                          </span>
                          {' '}
                          <span style={{ color: '#ffffff' }}>{neighbor?.label || nbrId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Click any node to inspect its Neo4j properties and connections.
            </div>
          )}
        </div>
      </div>

      {/* ── Colour legend ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LEGEND:</span>
        {Object.entries(TYPE_COLORS).map(([type, color]) => {
          const up = type.toUpperCase();
          return (
            <div key={type}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
              onClick={() => setFilterType(filterType === up ? 'ALL' : up)}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: filterType === up ? '#ffffff' : 'var(--text-secondary)', fontWeight: filterType === up ? 600 : 400, textTransform: 'capitalize' }}>
                {type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
