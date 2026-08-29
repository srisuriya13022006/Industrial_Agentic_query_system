import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Network, 
  Database, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Search, 
  Filter, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Move,
  Eye,
  Layers
} from 'lucide-react';
import { apiClient } from '../../api/client';

export const GraphCanvas = () => {
  const [rawData, setRawData] = useState({ nodes: [], edges: [] });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewMode, setViewMode] = useState('EGO'); // 'EGO' (focused) or 'ALL' (full graph)
  const [activeAsset, setActiveAsset] = useState('Pump P101');

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggedNode, setDraggedNode] = useState(null);

  const svgRef = useRef(null);

  useEffect(() => {
    fetchGraph();
  }, [viewMode, activeAsset]);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const entityParam = viewMode === 'EGO' ? activeAsset : null;
      const data = await apiClient.getGraphData(entityParam, 70);
      if (data && data.nodes && data.nodes.length > 0) {
        setIsLive(true);
        setRawData(data);
        runForceLayout(data.nodes, data.edges);
      }
    } catch (err) {
      console.warn("Error loading graph data:", err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Physics-based Force Simulation Layout
   * Simulates repulsion, spring tension, and boundary constraints to un-clutter nodes.
   */
  const runForceLayout = (inputNodes, inputEdges) => {
    const width = 900;
    const height = 620;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize positions in a wider spread
    let simNodes = inputNodes.map((n, i) => {
      const angle = (i / Math.max(1, inputNodes.length)) * 2 * Math.PI;
      const dist = 180 + (i % 4) * 55;
      return {
        ...n,
        x: centerX + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: centerY + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0
      };
    });

    // Run 60 iterative force relaxation steps
    const iterations = 60;
    const repulsion = 4500;
    const springLength = 110;
    const springK = 0.05;

    for (let iter = 0; iter < iterations; iter++) {
      // 1. Node Repulsion (push away from each other)
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const n1 = simNodes[i];
          const n2 = simNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 320) {
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Edge Spring Attraction (pull connected nodes together)
      for (const edge of inputEdges) {
        const src = simNodes.find(n => n.id === edge.source);
        const tgt = simNodes.find(n => n.id === edge.target);
        if (src && tgt) {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - springLength;
          const force = displacement * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          src.vx += fx;
          src.vy += fy;
          tgt.vx -= fx;
          tgt.vy -= fy;
        }
      }

      // 3. Center gravity
      for (const n of simNodes) {
        n.vx += (centerX - n.x) * 0.015;
        n.vy += (centerY - n.y) * 0.015;

        // Apply velocity with damping
        n.x += n.vx * 0.45;
        n.y += n.vy * 0.45;
        n.vx *= 0.6;
        n.vy *= 0.6;

        // Boundary constraint
        n.x = Math.max(60, Math.min(width - 60, n.x));
        n.y = Math.max(50, Math.min(height - 50, n.y));
      }
    }

    setNodes(simNodes);
    setEdges(inputEdges);

    // Select primary equipment or first node
    const primary = simNodes.find(n => n.id.toLowerCase().includes('pump') || n.id.toLowerCase().includes('gb-rm3')) || simNodes[0];
    setSelectedNode(primary || null);
  };

  const nodeLabels = useMemo(() => {
    const types = new Set(nodes.map(n => (n.type || 'Entity').toUpperCase()));
    return ['ALL', ...Array.from(types)];
  }, [nodes]);

  // Filtered Nodes
  const visibleNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesFilter = filterType === 'ALL' || (n.type || '').toUpperCase() === filterType.toUpperCase();
      const matchesSearch = !searchQuery || (n.label || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [nodes, filterType, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  // Filtered Edges — ONLY show edges between currently visible nodes!
  const visibleEdges = useMemo(() => {
    return edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  // Spotlight active connections
  const activeFocusNode = hoveredNode || selectedNode;
  const directNeighborIds = useMemo(() => {
    if (!activeFocusNode) return new Set();
    const set = new Set([activeFocusNode.id]);
    for (const e of visibleEdges) {
      if (e.source === activeFocusNode.id) set.add(e.target);
      if (e.target === activeFocusNode.id) set.add(e.source);
    }
    return set;
  }, [activeFocusNode, visibleEdges]);

  // Color mapper
  const getNodeColor = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'equipment': return 'var(--amber-primary)';
      case 'component': return 'var(--cyan-primary)';
      case 'technician': return 'var(--emerald-primary)';
      case 'issue': return 'var(--rose-primary)';
      case 'process': return 'var(--violet-primary)';
      case 'sensor': return '#e879f9';
      case 'location': return '#38bdf8';
      case 'material': return '#fb923c';
      default: return 'var(--text-secondary)';
    }
  };

  // Pan & Zoom Event Handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggedNode) {
      // Drag node
      const svg = svgRef.current;
      if (svg) {
        const CTM = svg.getScreenCTM();
        if (CTM) {
          const mouseX = (e.clientX - CTM.e) / CTM.a;
          const mouseY = (e.clientY - CTM.f) / CTM.d;
          const adjustedX = (mouseX - pan.x) / zoom;
          const adjustedY = (mouseY - pan.y) / zoom;

          setNodes(prev => prev.map(n => n.id === draggedNode.id ? { ...n, x: adjustedX, y: adjustedY } : n));
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={18} style={{ color: 'var(--cyan-primary)' }} />
              <span>Neo4j Knowledge Graph Explorer</span>
            </h2>
            {isLive && (
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'var(--emerald-bg)', color: 'var(--emerald-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                ● LIVE NEO4J
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
            Multi-hop relational network with dynamic repulsion, spotlight isolation & drag physics
          </p>
        </div>

        {/* View Mode & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Subgraph Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
            <button
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                color: viewMode === 'EGO' ? '#ffffff' : 'var(--text-muted)',
                background: viewMode === 'EGO' ? 'var(--bg-surface-elevated)' : 'transparent',
                fontWeight: viewMode === 'EGO' ? 600 : 400
              }}
              onClick={() => setViewMode('EGO')}
            >
              Focus Subgraph
            </button>
            <button
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                color: viewMode === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                background: viewMode === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
                fontWeight: viewMode === 'ALL' ? 600 : 400
              }}
              onClick={() => setViewMode('ALL')}
            >
              Full Graph
            </button>
          </div>

          {/* Asset Focus Selector */}
          {viewMode === 'EGO' && (
            <select
              value={activeAsset}
              onChange={(e) => setActiveAsset(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--amber-primary)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <option value="Pump P101">Asset: Pump P101</option>
              <option value="GB-RM3-0207">Asset: GB-RM3-0207</option>
            </select>
          )}

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', color: '#ffffff', fontSize: '12px', width: '110px' }}
            />
          </div>

          <button 
            className="query-submit-btn" 
            style={{ padding: '7px 12px', fontSize: '11.5px' }}
            onClick={fetchGraph}
            disabled={loading}
            title="Re-run dynamic layout & sync database"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Dynamic Type Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
          FILTER BY TYPE:
        </span>
        {nodeLabels.map(t => (
          <button
            key={t}
            className="preset-chip-btn"
            style={{
              borderColor: filterType === t ? 'var(--cyan-primary)' : 'var(--border-subtle)',
              color: filterType === t ? '#ffffff' : 'var(--text-secondary)',
              background: filterType === t ? 'var(--cyan-bg)' : 'var(--bg-surface)'
            }}
            onClick={() => setFilterType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Canvas & Detail Drawer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '18px' }}>
        {/* SVG Graph Canvas Container */}
        <div 
          className="graph-canvas-container" 
          style={{ position: 'relative', height: '620px', cursor: isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom / Pan Controls Overlay */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
            <button 
              onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-base)', color: '#ffffff', padding: '6px', borderRadius: '4px' }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-base)', color: '#ffffff', padding: '6px', borderRadius: '4px' }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={resetView}
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-base)', color: '#ffffff', padding: '6px', borderRadius: '4px' }}
              title="Reset View"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px' }}>
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--cyan-primary)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Computing force simulation & querying Neo4j...</span>
            </div>
          ) : (
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              viewBox="0 0 900 620" 
              style={{ background: 'var(--bg-core)' }}
            >
              <defs>
                {/* Directional Arrow Marker */}
                <marker id="arrow" viewBox="0 -5 10 10" refX="24" refY="0" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,-4L8,0L0,4" fill="var(--steel-500)" />
                </marker>
                <marker id="arrow-active" viewBox="0 -5 10 10" refX="24" refY="0" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,-4L8,0L0,4" fill="var(--amber-primary)" />
                </marker>
              </defs>

              {/* Viewport Transform Group for Zoom and Pan */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Draw Edges */}
                {visibleEdges.map((edge, idx) => {
                  const srcNode = nodes.find(n => n.id === edge.source);
                  const tgtNode = nodes.find(n => n.id === edge.target);
                  if (!srcNode || !tgtNode) return null;

                  const isEdgeActive = activeFocusNode && (activeFocusNode.id === srcNode.id || activeFocusNode.id === tgtNode.id);
                  const isDimmed = activeFocusNode && !isEdgeActive;

                  return (
                    <g key={idx} opacity={isDimmed ? 0.08 : (isEdgeActive ? 1 : 0.45)}>
                      <line
                        x1={srcNode.x}
                        y1={srcNode.y}
                        x2={tgtNode.x}
                        y2={tgtNode.y}
                        stroke={isEdgeActive ? 'var(--amber-primary)' : 'var(--steel-600)'}
                        strokeWidth={isEdgeActive ? '2.5' : '1.2'}
                        markerEnd={isEdgeActive ? "url(#arrow-active)" : "url(#arrow)"}
                        strokeDasharray={edge.label === 'MONITORS' ? '4 4' : 'none'}
                      />

                      {/* Edge Label — ONLY visible when active or hovering */}
                      {isEdgeActive && (
                        <g transform={`translate(${(srcNode.x + tgtNode.x) / 2}, ${(srcNode.y + tgtNode.y) / 2})`}>
                          <rect
                            x="-32"
                            y="-9"
                            width="64"
                            height="16"
                            rx="3"
                            fill="var(--bg-core)"
                            stroke="var(--amber-dim)"
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            dy="3"
                            fill="var(--amber-primary)"
                            fontSize="8.5px"
                            fontFamily="var(--font-mono)"
                            fontWeight="600"
                          >
                            {edge.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. Draw Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const isHovered = hoveredNode && hoveredNode.id === node.id;
                  const isConnected = directNeighborIds.has(node.id);
                  const isDimmed = activeFocusNode && !isConnected;
                  const color = getNodeColor(node.type);

                  const isMajorEquipment = (node.type || '').toLowerCase() === 'equipment';
                  const radius = isSelected ? 24 : (isMajorEquipment ? 20 : 16);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      style={{ cursor: 'pointer' }}
                      opacity={isDimmed ? 0.18 : 1}
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedNode(node);
                      }}
                    >
                      {/* Halo Glow for Selected/Hovered Node */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={radius + 8}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          opacity="0.5"
                          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={radius}
                        fill="var(--bg-surface-elevated)"
                        stroke={color}
                        strokeWidth={isSelected ? '3' : '2'}
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 14px ${color})` : 'none',
                          transition: 'stroke-width 0.15s ease'
                        }}
                      />

                      {/* Node Initial Indicator */}
                      <text
                        textAnchor="middle"
                        dy="4.5"
                        fill={color}
                        fontFamily="var(--font-display)"
                        fontWeight="800"
                        fontSize={isMajorEquipment ? '13px' : '11px'}
                      >
                        {(node.type || 'E')[0]}
                      </text>

                      {/* Node Text Label with Contrast Pill */}
                      <g transform={`translate(0, ${radius + 14})`}>
                        <rect
                          x={-((node.label?.length || 10) * 3.4) - 4}
                          y="-9"
                          width={(node.label?.length || 10) * 6.8 + 8}
                          height="16"
                          rx="3"
                          fill="rgba(9, 12, 16, 0.85)"
                          stroke={isSelected ? color : 'var(--border-subtle)'}
                          strokeWidth={isSelected ? '1.5' : '0.7'}
                        />
                        <text
                          textAnchor="middle"
                          dy="3"
                          fill={isSelected ? '#ffffff' : 'var(--text-primary)'}
                          fontSize="10.5px"
                          fontWeight={isSelected ? '700' : '500'}
                          fontFamily="var(--font-sans)"
                        >
                          {node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Bottom Canvas Stats Pill */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px', pointerEvents: 'none' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-glass-heavy)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}>
              NODES: {visibleNodes.length} &middot; ACTIVE EDGES: {visibleEdges.length} &middot; ZOOM: {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        {/* Node Detail Inspector Drawer */}
        <div className="card-widget" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '620px' }}>
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: getNodeColor(selectedNode?.type || ''), letterSpacing: '0.08em' }}>
              {selectedNode?.type || 'Entity'} Inspector
            </span>
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginTop: '4px', wordBreak: 'break-word' }}>
              {selectedNode?.label || 'Click a node to inspect'}
            </h3>
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CANONICAL IDENTIFIER</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedNode.id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ONTOLOGY TYPE</div>
                <div style={{ fontSize: '12.5px', color: getNodeColor(selectedNode.type), marginTop: '2px', fontWeight: 600 }}>
                  {selectedNode.type || 'Entity'}
                </div>
              </div>

              {/* Real Neo4j Properties */}
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    NEO4J PROPERTIES
                  </div>
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

              {/* Connected Relationships in Neo4j */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  CONNECTED EDGES ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e, idx) => {
                      const isSource = e.source === selectedNode.id;
                      const neighborId = isSource ? e.target : e.source;
                      const neighbor = nodes.find(n => n.id === neighborId);

                      return (
                        <div 
                          key={idx} 
                          style={{ fontSize: '11.5px', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                          onClick={() => neighbor && setSelectedNode(neighbor)}
                          title="Click to focus neighbor node"
                        >
                          <span style={{ color: 'var(--amber-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                            {isSource ? `—[${e.label}]→` : `←[${e.label}]—`}
                          </span>{' '}
                          <span style={{ color: '#ffffff' }}>{neighbor?.label || neighborId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Click any node in the Knowledge Graph canvas to inspect its real Neo4j attributes and connected edges.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
