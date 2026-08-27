import React, { useState } from 'react';
import { Network, Database, ZoomIn, ZoomOut, RefreshCw, Cpu, Wrench, AlertTriangle, Activity } from 'lucide-react';

const INITIAL_NODES = [
  { id: 'equipment:gb_rm3_0207', label: 'Gearbox GB-RM3-0207', type: 'Equipment', x: 260, y: 180, status: 'Marginal' },
  { id: 'equipment:pump_p101', label: 'Pump P101', type: 'Equipment', x: 260, y: 380, status: 'Repaired' },
  { id: 'component:de_bearing', label: 'DE-Side Bearing', type: 'Component', x: 480, y: 180, status: 'Wear Detected' },
  { id: 'component:bearing', label: 'Bearing (P101)', type: 'Component', x: 480, y: 380, status: 'Nominal' },
  { id: 'person:raj', label: 'Technician Raj', type: 'Technician', x: 690, y: 380, status: 'Certified' },
  { id: 'person:kannan', label: 'R. Kannan (Chief Eng.)', type: 'Technician', x: 690, y: 180, status: 'On Duty' },
  { id: 'issue:bearing_overheating', label: 'Bearing Overheating', type: 'Issue', x: 480, y: 490, status: 'Resolved' },
  { id: 'process:lubrication', label: 'Lubrication Maintenance', type: 'Process', x: 260, y: 520, status: 'Completed' },
  { id: 'sensor:vibration_01', label: 'Vibration Sensor V-01', type: 'Sensor', x: 100, y: 240, status: '4.8 mm/s' }
];

const INITIAL_EDGES = [
  { source: 'equipment:gb_rm3_0207', target: 'component:de_bearing', label: 'HAS_COMPONENT' },
  { source: 'equipment:pump_p101', target: 'component:bearing', label: 'HAS_COMPONENT' },
  { source: 'person:raj', target: 'component:bearing', label: 'REPLACED' },
  { source: 'person:kannan', target: 'component:de_bearing', label: 'INSPECTED' },
  { source: 'equipment:pump_p101', target: 'issue:bearing_overheating', label: 'HAS_ISSUE' },
  { source: 'sensor:vibration_01', target: 'equipment:gb_rm3_0207', label: 'MONITORS' },
  { source: 'process:lubrication', target: 'equipment:pump_p101', label: 'PERFORMED_ON' }
];

export const GraphCanvas = () => {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState(INITIAL_NODES[0]);
  const [filterType, setFilterType] = useState('ALL');

  const getNodeColor = (type) => {
    switch (type) {
      case 'Equipment': return 'var(--amber-primary)';
      case 'Component': return 'var(--cyan-primary)';
      case 'Technician': return 'var(--emerald-primary)';
      case 'Issue': return 'var(--rose-primary)';
      case 'Process': return 'var(--violet-primary)';
      case 'Sensor': return '#e879f9';
      default: return 'var(--text-secondary)';
    }
  };

  const filteredNodes = filterType === 'ALL' 
    ? nodes 
    : nodes.filter(n => n.type.toUpperCase() === filterType.toUpperCase());

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} style={{ color: 'var(--cyan-primary)' }} />
            <span>Interactive Industrial Knowledge Graph</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
            Powered by Neo4j 3-Tier Multi-Hop Graph Traversal Engine
          </p>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'EQUIPMENT', 'COMPONENT', 'TECHNICIAN', 'ISSUE', 'PROCESS'].map(t => (
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
      </div>

      {/* Main Canvas & Detail Drawer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* SVG Graph Canvas */}
        <div className="graph-canvas-container" style={{ position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 850 600" style={{ background: 'var(--bg-core)' }}>
            {/* Draw Edges */}
            {edges.map((edge, idx) => {
              const srcNode = nodes.find(n => n.id === edge.source);
              const tgtNode = nodes.find(n => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const isSelected = selectedNode && (selectedNode.id === srcNode.id || selectedNode.id === tgtNode.id);

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isSelected ? 'var(--amber-primary)' : 'var(--border-base)'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    strokeDasharray={edge.label === 'MONITORS' ? '4 4' : 'none'}
                    opacity={isSelected ? 1 : 0.6}
                  />
                  {/* Edge Label Pill */}
                  <text
                    x={(srcNode.x + tgtNode.x) / 2}
                    y={(srcNode.y + tgtNode.y) / 2 - 4}
                    fill="var(--text-muted)"
                    fontSize="9.5px"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode && selectedNode.id === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(node)}
                >
                  <circle
                    r={isSelected ? '24' : '18'}
                    fill="var(--bg-surface-elevated)"
                    stroke={color}
                    strokeWidth={isSelected ? '3' : '2'}
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 12px ${color})` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  {/* Node Icon/Letter */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={color}
                    fontFamily="var(--font-display)"
                    fontWeight="800"
                    fontSize={isSelected ? '12px' : '10px'}
                  >
                    {node.type[0]}
                  </text>

                  {/* Node Label Below */}
                  <text
                    textAnchor="middle"
                    dy="34"
                    fill={isSelected ? '#ffffff' : 'var(--text-secondary)'}
                    fontSize="11.5px"
                    fontWeight={isSelected ? '600' : '400'}
                    fontFamily="var(--font-sans)"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Canvas Overlay Controls */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-glass-heavy)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--border-base)', color: 'var(--text-muted)' }}>
              NODES: {nodes.length} &middot; EDGES: {edges.length}
            </span>
          </div>
        </div>

        {/* Node Detail Drawer */}
        <div className="card-widget" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: getNodeColor(selectedNode?.type || '') }}>
              {selectedNode?.type || 'Entity'} Inspector
            </span>
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginTop: '4px' }}>
              {selectedNode?.label || 'Select a node'}
            </h3>
          </div>

          {selectedNode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CANONICAL ID</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', marginTop: '2px' }}>
                  {selectedNode.id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OPERATIONAL STATE</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                  {selectedNode.status}
                </div>
              </div>

              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  CONNECTED RELATIONS ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e, idx) => {
                      const isSource = e.source === selectedNode.id;
                      const neighborId = isSource ? e.target : e.source;
                      const neighbor = nodes.find(n => n.id === neighborId);

                      return (
                        <div key={idx} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--amber-primary)', fontFamily: 'var(--font-mono)' }}>[{e.label}]</span>{' '}
                          <span>{neighbor?.label || neighborId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
