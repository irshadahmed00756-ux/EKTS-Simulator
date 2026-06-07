import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Square, Zap, Settings, ArrowRight, Activity, Circle, PackageOpen, Power, Lightbulb, Fan, Droplet, ArrowLeftRight, Cloud, Clock, SlidersHorizontal, ToggleLeft, Menu, X, Undo2, Download, Upload } from 'lucide-react';
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
  PowerNode, GroundNode, SwitchNode, RelayCoilNode, RelayContactNode, SSRNode,
  LampNode, MotorNode, ValveNode, CylinderNode, CompressorNode, ExhaustNode, 
  HydraulicPumpNode, TankNode, TimerNode, SensorNode, JunctionNode
} from './nodes/CustomNodes';
import OrthogonalEdge from './edges/OrthogonalEdge';

const nodeTypes = {
  power: PowerNode,
  ground: GroundNode,
  switch: SwitchNode,
  relayCoil: RelayCoilNode,
  ssr: SSRNode,
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
    { type: 'timer', config: { subtype: 'ton_24v_dc', label: 'T1', targetSeconds: 5 }, name: 'Timer ON-Delay 24V DC', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'ton_110v_ac', label: 'T2', targetSeconds: 5 }, name: 'Timer ON-Delay 110V AC', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'ton_220v_ac', label: 'T3', targetSeconds: 5 }, name: 'Timer ON-Delay 220V AC', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'tof_220v_ac', label: 'T4', targetSeconds: 5 }, name: 'Timer OFF-Delay 220V AC', domain: 'electrical', icon: Clock },
    { type: 'timer', config: { subtype: 'star_delta_220v_ac', label: 'T5', targetSeconds: 5 }, name: 'Star-Delta Timer 220V AC', domain: 'electrical', icon: Clock },
  ],
  'Electrical (AC)': [
    { type: 'power', config: { subtype: '220v_ac' }, name: '220V AC Phase', domain: 'electrical', icon: Zap },
    { type: 'power', config: { subtype: '110v_ac' }, name: '110V AC Phase', domain: 'electrical', icon: Zap },
    { type: 'power', config: { subtype: '3phase' }, name: '3-Phase AC (L1/L2/L3)', domain: 'electrical', icon: Zap },
    { type: 'ground', config: { subtype: 'neutral' }, name: 'AC Neutral', domain: 'electrical', icon: Power },
    { type: 'relayCoil', config: { subtype: 'coil_220v_ac', label: 'K2' }, name: '220V Contactor Coil', domain: 'electrical', icon: PackageOpen },
    { type: 'ssr', config: { subtype: 'ssr_220v', label: 'SSR1' }, name: 'SSR Relay 220V AC', domain: 'electrical', icon: PackageOpen },
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

function Sidebar({ onDragStart, onAdd, isOpen }) {
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
                  onClick={() => onAdd(comp)}
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [propertiesNodeId, setPropertiesNodeId] = useState(null);
  const [pastStates, setPastStates] = useState([]);
  const simInterval = useRef(null);
  
  const { screenToFlowPosition } = useReactFlow();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const saveSnapshot = useCallback(() => {
    setPastStates(prev => [...prev, { nodes: nodesRef.current, edges: edgesRef.current }].slice(-50));
  }, []);

  const handleUndo = useCallback(() => {
    if (pastStates.length > 0) {
      const lastState = pastStates[pastStates.length - 1];
      setNodes(lastState.nodes);
      setEdges(lastState.edges);
      setPastStates(prev => prev.slice(0, -1));
    }
  }, [pastStates, setNodes, setEdges]);

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
          const { newNodes, poweredEdgeIds, globalShortCircuit, shortCircuitDetails } = evaluateCircuit(currentNodes, currentEdges);
          
          if (globalShortCircuit) {
             clearInterval(simInterval.current);
             setIsSimulating(false);
             alert("🚨 SHORT CIRCUIT DETECTED! 🚨\n" + (shortCircuitDetails || "Invalid connection."));
             // Reset visual powered state for safety
             setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { ...e.style, stroke: 'var(--border-strong)' } })));
             return;
          }

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
      saveSnapshot();
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
    saveSnapshot();
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
    saveSnapshot();
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [saveSnapshot, setNodes, setEdges]);

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
      saveSnapshot();
      
      let compData;
      try {
        compData = JSON.parse(rawData);
      } catch (e) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

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

  const onAddComponent = useCallback((compData) => {
    saveSnapshot();
    // Add component to the exact center of the current view
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode = {
      id: `${compData.type}-${nodes.length + 1}`,
      type: compData.type,
      position,
      data: { label: compData.name, ...compData.config, domain: compData.domain },
    };

    setNodes((nds) => nds.concat(newNode));
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false); // Close sidebar automatically on mobile
    }
  }, [nodes.length, setNodes, saveSnapshot]);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the entire circuit?")) {
      saveSnapshot();
      setNodes([]);
      setEdges([]);
    }
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "circuit.json");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = JSON.parse(e.target.result);
        if (content.nodes && content.edges) {
          saveSnapshot();
          setNodes(content.nodes);
          setEdges(content.edges);
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset
  };

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
          <button className="btn" onClick={handleUndo} disabled={pastStates.length === 0} title="Undo">
            <Undo2 size={16} />
          </button>
          <label className="btn" style={{ cursor: 'pointer' }} title="Upload Circuit">
            <Upload size={16} />
            <input type="file" accept=".json" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          <button className="btn" onClick={handleDownload} title="Save/Download Circuit">
            <Download size={16} />
          </button>
          <button className="btn" onClick={handleClear} style={{ color: '#ff4d4d' }}>
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
          <button className="btn" onClick={deleteSelected} style={{ color: '#ff4d4d', border: '1px solid #ff4d4d' }} title="Delete Selected">
            <X size={16} />
          </button>
          <button className="btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={16} />
          </button>
        </div>
      </header>
      <main className="main-content">
        <Sidebar isOpen={isSidebarOpen} onDragStart={onDragStart} onAdd={onAddComponent} />
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
            connectionMode="loose"
            fitView
            minZoom={0.2}
            maxZoom={2}
            theme="dark"
            proOptions={{ hideAttribution: true }}
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
                  
                  {['relayCoil', 'relayContact', 'switch', 'sensor', 'timer', 'motor', 'lamp', 'cylinder'].includes(node.type) && (
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

                  {node.type === 'timer' && (
                    <>
                      <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Delay Time (Seconds)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          min="0.5"
                          value={node.data.targetSeconds !== undefined ? node.data.targetSeconds : 2} 
                          onChange={(e) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, targetSeconds: parseFloat(e.target.value) || 0 } } : n))}
                          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }} 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Trigger Mode</label>
                        <select 
                          value={node.data.triggerMode || 'power_on'} 
                          onChange={(e) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, triggerMode: e.target.value } } : n))}
                          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }}
                        >
                          <option value="power_on">1. Power ON (Active on Supply)</option>
                          <option value="signal_on">2. Signal ON (Pulse/Short Start)</option>
                        </select>
                      </div>
                  )}
                  
                  {node.type === 'cylinder' && (
                    <>
                      <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Limit Switch at 0% (Retracted)</label>
                        <input 
                          type="text" 
                          value={node.data.limit0Label || ''} 
                          onChange={(e) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, limit0Label: e.target.value } } : n))}
                          placeholder="e.g. LS1"
                          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }} 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 5 }}>Limit Switch at 100% (Extended)</label>
                        <input 
                          type="text" 
                          value={node.data.limit100Label || ''} 
                          onChange={(e) => setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, limit100Label: e.target.value } } : n))}
                          placeholder="e.g. LS2"
                          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {isSettingsOpen && (
          <>
            <div className="properties-overlay" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="properties-panel" style={{ width: 350 }}>
              <div className="properties-header">
                About & Settings
                <button className="close-btn" onClick={() => setIsSettingsOpen(false)}><X size={18} /></button>
              </div>
              <div className="property-form" style={{ padding: '10px 0', lineHeight: '1.6' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>EKTS<span style={{ color: 'var(--color-electrical)' }}>•</span>Pro</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Advanced Industrial Simulator</p>
                </div>
                
                <div style={{ background: 'var(--bg-tertiary)', padding: 15, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ marginBottom: 10, fontSize: '1rem', color: 'var(--text-primary)' }}>Developer Information</h3>
                  <p style={{ margin: '5px 0' }}><strong>Developed by:</strong> One In All</p>
                  <p style={{ margin: '5px 0' }}><strong>Contact:</strong> 7979985729</p>
                </div>
              </div>
            </div>
          </>
        )}

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
