import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Square, Zap, Settings, ArrowRight, Activity, Circle, PackageOpen, Power, Lightbulb, Fan, Droplet, ArrowLeftRight, Cloud, Clock, SlidersHorizontal, ToggleLeft, Menu, X } from 'lucide-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import { evaluateCircuit } from './simulation/engine';
import { 
  PowerNode, GroundNode, SwitchNode, RelayCoilNode, RelayContactNode, 
  LampNode, MotorNode, ValveNode, CylinderNode, CompressorNode, ExhaustNode, 
  HydraulicPumpNode, TankNode, TimerNode, SensorNode, JunctionNode
} from './nodes/CustomNodes';
import OrthogonalEdge from './edges/OrthogonalEdge';

const nodeTypes = {
  power: PowerNode,
  ground: GroundNode,
  switch: SwitchNode,
  relayCoil: RelayCoilNode,
  relayContact: RelayContactNode,
  junction: JunctionNode,
  lamp: LampNode,
  motor: MotorNode,
  valve: ValveNode,
  cylinder: CylinderNode,
  compressor: CompressorNode,
  exhaust: ExhaustNode,
  pump: HydraulicPumpNode,
  tank: TankNode,
  timer: TimerNode,
  sensor: SensorNode
};

const edgeTypes = {
  orthogonal: OrthogonalEdge,
};

// Categorized components for the sidebar
const componentCategories = {
  'Electrical (DC)': [
    { type: 'power', config: { subtype: '24v_dc' }, name: '+24V DC Supply', domain: 'electrical', icon: Zap },
    { type: 'power', config: { subtype: '5v_dc' }, name: '+5V DC Supply', domain: 'electrical', icon: Zap },
    { type: 'ground', config: { subtype: '0v' }, name: '0V Ground', domain: 'electrical', icon: Power },
    { type: 'switch', config: { subtype: 'no', poles: 1 }, name: 'NO Push Button', domain: 'electrical', icon: Circle },
    { type: 'switch', config: { subtype: 'nc', poles: 1 }, name: 'NC Push Button', domain: 'electrical', icon: Circle },
    { type: 'switch', config: { subtype: 'toggle' }, name: 'Toggle Switch', domain: 'electrical', icon: ToggleLeft },
    { type: 'sensor', config: { subtype: 'limit' }, name: 'Limit Switch', domain: 'electrical', icon: Circle },
    { type: 'sensor', config: { subtype: 'potentiometer' }, name: 'Potentiometer', domain: 'electrical', icon: SlidersHorizontal },
    { type: 'relayCoil', config: { subtype: 'coil_24v', label: 'K1' }, name: '24V Relay Coil', domain: 'electrical', icon: PackageOpen },
    { type: 'relayContact', config: { subtype: 'no', label: 'K1', poles: 1 }, name: 'Relay Contact (NO)', domain: 'electrical', icon: ArrowLeftRight },
    { type: 'relayContact', config: { subtype: 'nc', label: 'K1', poles: 1 }, name: 'Relay Contact (NC)', domain: 'electrical', icon: ArrowLeftRight },
    { type: 'relayContact', config: { subtype: 'no', label: 'K1', poles: 3 }, name: '3-Pole Contactor (NO)', domain: 'electrical', icon: ArrowLeftRight },
    { type: 'lamp', config: { subtype: '24v' }, name: 'Indicator Lamp (24V)', domain: 'electrical', icon: Lightbulb },
    { type: 'motor', config: { subtype: 'dc' }, name: 'DC Motor', domain: 'electrical', icon: Settings },
  ],
  'Timers & Logic': [
    { type: 'timer', config: { subtype: 'ton', label: 'T1' }, name: 'ON-Delay Timer', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'tof', label: 'T2' }, name: 'OFF-Delay Timer', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'star_delta', label: 'K_SD' }, name: 'Star-Delta Timer', domain: 'electrical', icon: Clock },
  ],
  'Electrical (AC)': [
    { type: 'power', config: { subtype: '220v_ac' }, name: '220V AC Phase', domain: 'electrical', icon: Zap },
    { type: 'power', config: { subtype: '110v_ac' }, name: '110V AC Phase', domain: 'electrical', icon: Zap },
    { type: 'power', config: { subtype: '3phase' }, name: '3-Phase AC (L1/L2/L3)', domain: 'electrical', icon: Zap },
    { type: 'ground', config: { subtype: 'neutral' }, name: 'AC Neutral', domain: 'electrical', icon: Power },
    { type: 'relayCoil', config: { subtype: 'coil_220v_ac', label: 'K2' }, name: '220V Contactor Coil', domain: 'electrical', icon: PackageOpen },
    { type: 'relayCoil', config: { subtype: 'coil_220v_ac', label: 'SSR1' }, name: 'SSR Relay 220V AC', domain: 'electrical', icon: PackageOpen },
    { type: 'relayCoil', config: { subtype: 'coil_110v_ac', label: 'K3' }, name: '110V Contactor Coil', domain: 'electrical', icon: PackageOpen },
    { type: 'lamp', config: { subtype: '110v_ac' }, name: 'Lamp 110V AC', domain: 'electrical', icon: Lightbulb },
    { type: 'lamp', config: { subtype: '220v_ac' }, name: 'Lamp 220V AC', domain: 'electrical', icon: Lightbulb },
    { type: 'motor', config: { subtype: 'ac_1phase' }, name: 'Single Phase Motor', domain: 'electrical', icon: Settings },
    { type: 'motor', config: { subtype: 'ac_3phase' }, name: '3-Phase Motor', domain: 'electrical', icon: Settings },
  ],
  'Hydraulics': [
    { type: 'pump', config: { subtype: 'fixed' }, name: 'Hydraulic Pump', domain: 'hydraulic', icon: Activity },
    { type: 'pump', config: { subtype: 'variable' }, name: 'Variable Pump', domain: 'hydraulic', icon: Activity },
    { type: 'tank', config: { subtype: 'tank' }, name: 'Hydraulic Tank', domain: 'hydraulic', icon: Droplet },
    { type: 'valve', config: { subtype: '4_2' }, name: '4/2 Way Valve', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_closed' }, name: '4/3 Valve (Closed Center)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_open' }, name: '4/3 Valve (Open Center)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_tandem' }, name: '4/3 Valve (Tandem Center)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_float' }, name: '4/3 Valve (Float Center)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_closed' }, name: '01-3C2 Valve (Closed)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '4_3_tandem' }, name: '01-3C4 Valve (Tandem)', domain: 'hydraulic', icon: ArrowRight },
    { type: 'cylinder', config: { subtype: 'single_acting' }, name: 'Single Acting Cylinder', domain: 'hydraulic', icon: ArrowRight },
    { type: 'cylinder', config: { subtype: 'double_acting' }, name: 'Double Acting Cylinder', domain: 'hydraulic', icon: ArrowLeftRight },
    { type: 'motorHyd', config: { subtype: 'hyd_motor' }, name: 'Hydraulic Motor', domain: 'hydraulic', icon: Settings },
  ],
  'Pneumatics': [
    { type: 'compressor', config: { subtype: 'air' }, name: 'Air Compressor', domain: 'pneumatic', icon: Fan },
    { type: 'exhaust', config: { subtype: 'air' }, name: 'Pneumatic Exhaust', domain: 'pneumatic', icon: Cloud },
    { type: 'valve', config: { subtype: '3_2' }, name: '3/2 Way Valve', domain: 'pneumatic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '5_2' }, name: '5/2 Way Valve', domain: 'pneumatic', icon: ArrowRight },
    { type: 'valve', config: { subtype: '5_3' }, name: '5/3 Way Valve', domain: 'pneumatic', icon: ArrowRight },
    { type: 'cylinder', config: { subtype: 'single_acting' }, name: 'Single Acting Cylinder', domain: 'pneumatic', icon: ArrowRight },
    { type: 'cylinder', config: { subtype: 'double_acting' }, name: 'Double Acting Cylinder', domain: 'pneumatic', icon: ArrowLeftRight },
  ]
};

function Sidebar({ onDragStart, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">Component Library</div>
      <div className="components-list-container">
        {Object.entries(componentCategories).map(([category, components]) => (
          <div key={category} className="category-section">
            <h3 className="category-title">{category}</h3>
            <div className="components-list">
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  className="component-item"
                  onDragStart={(event) => onDragStart(event, comp)}
                  draggable
                >
                  <div className={`component-icon ${comp.domain}`}>
                    {React.createElement(comp.icon, { size: 18 })}
                  </div>
                  <div className="component-details">
                    <span className="component-name">{comp.name}</span>
                    <span className="component-type">{comp.domain}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}


function SimulatorApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [propertiesNodeId, setPropertiesNodeId] = useState(null);
  const simInterval = useRef(null);
  
  const { screenToFlowPosition } = useReactFlow();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Inject default test circuit for debugging
  useEffect(() => {
    if (nodes.length === 0 && !window.testCircuitInjected) {
      window.testCircuitInjected = true;
      setNodes([
        { id: 'p1', type: 'power', position: { x: 100, y: 100 }, data: { subtype: '24v_dc', domain: 'electrical' } },
        { id: 'l1', type: 'lamp', position: { x: 300, y: 100 }, data: { subtype: '24v', domain: 'electrical' } },
        { id: 'g1', type: 'ground', position: { x: 300, y: 300 }, data: { subtype: '0v', domain: 'electrical' } }
      ]);
      setEdges([
        { id: 'e1', source: 'p1', target: 'l1', sourceHandle: 'out', targetHandle: 'in', type: 'orthogonal', style: { stroke: '#ffb800', strokeWidth: 3 } },
        { id: 'e2', source: 'l1', target: 'g1', sourceHandle: 'out', targetHandle: 'in', type: 'orthogonal', style: { stroke: '#ffb800', strokeWidth: 3 } }
      ]);
    }
  }, [nodes.length, setNodes, setEdges]);

  // Simulation loop
  useEffect(() => {
    if (isSimulating) {
      simInterval.current = setInterval(() => {
        try {
          const currentNodes = nodesRef.current;
          const currentEdges = edgesRef.current;
          const { newNodes, poweredEdgeIds } = evaluateCircuit(currentNodes, currentEdges);
          
          setNodes(newNodes);
          setEdges((eds) => eds.map(e => {
            const isPowered = poweredEdgeIds.has(e.id);
            if (e.animated === isPowered && (e.style?.stroke === '#ff3333') === isPowered) return e;
            return {
              ...e,
              animated: isPowered,
              style: { ...e.style, stroke: isPowered ? '#ff3333' : 'var(--border-strong)' }
            };
          }));
        } catch (error) {
          console.error("Simulation Engine Error:", error);
          clearInterval(simInterval.current);
          setIsSimulating(false);
        }
      }, 50); // 20 fps tick rate
    } else {
      if (simInterval.current) clearInterval(simInterval.current);
      setEdges((eds) => eds.map(e => ({ ...e, animated: false, style: { ...e.style, stroke: 'var(--border-strong)' } })));
    }
    return () => clearInterval(simInterval.current);
  }, [isSimulating, setNodes, setEdges]);

  const handleLabelChange = (id, newLabel) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n));
  };

  const selectedNode = nodes.find(n => n.selected);

  const onNodeClick = useCallback((event, node) => {
    if (!isSimulating) return;
    // Interaction logic is now handled directly inside the custom components (e.g. SwitchNode) via onPointer events.
  }, [isSimulating]);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setPropertiesNodeId(node.id);
  }, []);

  const closeProperties = () => setPropertiesNodeId(null);

  const onConnect = useCallback(
    (params) => {
      setNodes((currentNodes) => {
        const sourceNode = currentNodes.find((n) => n.id === params.source);
        let strokeColor = '#ffb800';
        let isAnimated = isSimulating;

        if (sourceNode) {
          const type = sourceNode.type;
          if (['compressor', 'valve', 'cylinder'].includes(type) && (params.sourceHandle !== 'solenoid' && params.targetHandle !== 'solenoid')) {
            strokeColor = '#00d2ff';
          } else if (['pump'].includes(type)) {
            strokeColor = '#3a86ff';
          }
        }

        const newEdge = {
          ...params,
          type: 'orthogonal',
          animated: isAnimated,
          style: { stroke: strokeColor, strokeWidth: 3 },
          interactionWidth: 20,
        };
        setEdges((eds) => addEdge(newEdge, eds));
        return currentNodes;
      });
    },
    [setEdges, isSimulating],
  );

  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    const newJunctionId = `junction-${Date.now()}`;
    const junctionNode = {
      id: newJunctionId,
      type: 'junction',
      position: { x: position.x - 6, y: position.y - 6 }, // Center the 12x12 dot
      data: { domain: 'electrical' }
    };
    
    const edge1 = {
      id: `e-${edge.source}-${newJunctionId}`,
      source: edge.source,
      target: newJunctionId,
      sourceHandle: edge.sourceHandle,
      targetHandle: 'in',
      type: 'orthogonal',
      style: edge.style,
      interactionWidth: 20
    };
    
    const edge2 = {
      id: `e-${newJunctionId}-${edge.target}`,
      source: newJunctionId,
      target: edge.target,
      sourceHandle: 'out',
      targetHandle: edge.targetHandle,
      type: 'orthogonal',
      style: edge.style,
      interactionWidth: 20
    };
    
    setNodes((nds) => nds.concat(junctionNode));
    setEdges((eds) => eds.filter(e => e.id !== edge.id).concat(edge1, edge2));
  }, [screenToFlowPosition, setNodes, setEdges]);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  const onDragStart = (event, compData) => {
    event.dataTransfer.setData('application/xyflow', JSON.stringify(compData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/xyflow');
      if (!rawData) return;
      
      let compData;
      try {
        compData = JSON.parse(rawData);
      } catch (e) {
        return;
      }

      const position = {
        x: event.clientX - 280,
        y: event.clientY - 60,
      };

      const newNode = {
        id: `${compData.type}-${nodes.length + 1}`,
        type: compData.type,
        position,
        data: { label: compData.name, ...compData.config, domain: compData.domain },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes],
  );

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand">
          <button className="btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ marginRight: 10, padding: 6, border: 'none', background: 'transparent' }}>
            <Menu size={20} />
          </button>
          EKTS<span>•</span><span>Pro</span>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => setNodes([])}>
            Clear
          </button>
          {isSimulating ? (
            <button className="btn" onClick={() => setIsSimulating(false)}>
              <Square size={16} fill="currentColor" /> Stop
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsSimulating(true)}>
              <Play size={16} fill="currentColor" /> Run Simulation
            </button>
          )}
          <button className="btn" onClick={deleteSelected} style={{ color: '#ff4d4d', border: '1px solid #ff4d4d' }}>
            Delete Selected
          </button>
          <button className="btn">
            <Settings size={16} />
          </button>
        </div>
      </header>
      <main className="main-content">
        <Sidebar isOpen={isSidebarOpen} onDragStart={onDragStart} />
        <div className="canvas-area">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={() => setIsSidebarOpen(false)}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!isSimulating}
            nodesConnectable={!isSimulating}
            elementsSelectable={!isSimulating}
            connectionLineType="orthogonal"
            fitView
            theme="dark"
          >
            <Background color="#5e5e6e" gap={24} size={1} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} nodeColor="#1c1e26" maskColor="rgba(0,0,0,0.5)" />
          </ReactFlow>
        </div>
        
        {propertiesNodeId && nodes.find(n => n.id === propertiesNodeId) && (() => {
          const node = nodes.find(n => n.id === propertiesNodeId);
          return (
            <>
              <div className="properties-overlay" onClick={closeProperties}></div>
              <div className="properties-panel">
                <div className="properties-header">
                  Properties
                  <button className="close-btn" onClick={closeProperties}><X size={18} /></button>
                </div>
                <div className="property-form">
                  <div className="form-group" style={{ marginBottom: 15 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Component ID</label>
                    <input type="text" value={node.id} disabled style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }} />
                  </div>
                  
                  {['relayCoil', 'relayContact', 'switch', 'sensor', 'timer', 'motor', 'lamp'].includes(node.type) && (
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Label (Tag)</label>
                      <input 
                        type="text" 
                        value={node.data.label || ''} 
                        onChange={(e) => handleLabelChange(node.id, e.target.value)}
                        placeholder="e.g. K1"
                        style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }} 
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 5 }}>Components with the same label are physically linked.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <SimulatorApp />
    </ReactFlowProvider>
  );
}
