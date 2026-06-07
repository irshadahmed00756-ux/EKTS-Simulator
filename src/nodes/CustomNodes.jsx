import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Zap, Circle, PackageOpen, Lightbulb, Activity, ArrowRight, ArrowLeftRight, Power, Settings, Fan, Droplet, Cloud, Clock } from 'lucide-react';
import './nodes.css';

export const JunctionNode = ({ isConnectable }) => {
  return (
    <div className="custom-node junction-node" style={{ width: 12, height: 12, borderRadius: '50%', background: '#000', border: '2px solid #000', minWidth: 'unset', padding: 0 }}>
      <Handle type="target" position={Position.Left} id="in" style={{ opacity: 0 }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ opacity: 0 }} isConnectable={isConnectable} />
    </div>
  );
};

export const PowerNode = ({ data }) => {
  const subtype = data.subtype || '24v_dc';
  let label = 'Power Supply';
  if (subtype === '24v_dc') label = '+24V DC';
  else if (subtype === '5v_dc') label = '+5V DC';
  else if (subtype === '220v_ac') label = '220V Phase';
  else if (subtype === '110v_ac') label = '110V Phase';
  else if (subtype === '3phase') label = '3-Phase (L1/L2/L3)';

  return (
    <div className={`custom-node electrical-node ${subtype.includes('ac') || subtype === '3phase' ? 'ac-node' : ''}`}>
      <div className="node-header">
        <Zap size={14} /> {label}
      </div>
      <div className="node-body">
        <div className="port-label">Out</div>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="port electrical-port" />
    </div>
  );
};

export const GroundNode = ({ data, isConnectable }) => {
  const subtype = data.subtype || '0v';
  return (
    <div className={`custom-node electrical-node ground-node ${subtype === 'neutral' ? 'ac-node' : ''} ${data.shortCircuit ? 'short-circuit' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Power size={14} /> {subtype === 'neutral' ? 'Neutral' : '0V Ground'}
      </div>
      <div className="node-body">
        {data.shortCircuit ? (
          <div style={{ color: 'red', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>SHORT CIRCUIT!</div>
        ) : (
          <div className="ground-symbol">
            <div className="g-line long"></div>
            <div className="g-line med"></div>
            <div className="g-line short"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SwitchNode = ({ id, data, isConnectable }) => {
  const isClosed = data.isClosed || false;
  const subtype = data.subtype || 'no'; // no, nc, toggle
  const poles = data.poles || 1;
  const { setNodes } = useReactFlow();
  
  let visualState = isClosed;
  if (subtype === 'nc') visualState = !isClosed;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (subtype === 'toggle') return; // Handled by standard click if needed, or we just toggle here
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isClosed: true } } : n));
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (subtype === 'toggle') {
      setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isClosed: !n.data.isClosed } } : n));
      return;
    }
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isClosed: false } } : n));
  };

  return (
    <div 
      className={`custom-node electrical-node ${isClosed ? 'active' : ''}`} 
      style={{ minHeight: 40 + poles * 15, cursor: 'pointer' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {Array.from({ length: poles }).map((_, i) => (
        <React.Fragment key={i}>
          <Handle type="target" position={Position.Left} id={i === 0 ? 'in' : `in_${i}`} style={{ top: 30 + i * 20 }} className="port electrical-port" isConnectable={isConnectable} />
          <Handle type="source" position={Position.Right} id={i === 0 ? 'out' : `out_${i}`} style={{ top: 30 + i * 20 }} className="port electrical-port" isConnectable={isConnectable} />
        </React.Fragment>
      ))}
      <div className="node-header">
        <Circle size={14} /> {data.label || 'Switch'}
      </div>
      <div className="node-body">
        <div className="switch-visual" style={{ flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: poles }).map((_, i) => (
            <div className="switch-pole" key={i} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <div className="line" style={{ flex: 1, height: 2, background: 'var(--border-strong)' }}></div>
              <div className={`contact ${visualState ? 'closed' : 'open'}`} style={{ width: 20, height: 2, background: 'var(--color-electrical)', transformOrigin: 'left', transform: visualState ? 'rotate(0deg)' : 'rotate(-30deg)' }}></div>
              <div className="line" style={{ flex: 1, height: 2, background: 'var(--border-strong)' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RelayCoilNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`}>
      <Handle type="target" position={Position.Left} id="A1" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <PackageOpen size={14} /> {data.label || 'K1'}
      </div>
      <div className="node-body">
        <div className="coil-visual">
          {isActive ? 'ENERGIZED' : 'IDLE'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="A2" className="port electrical-port" isConnectable={isConnectable} />
    </div>
  );
};

export const RelayContactNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  const poles = data.poles || 1;
  const subtype = data.subtype || 'no';
  
  let visualState = isActive;
  if (subtype === 'nc') visualState = !isActive;

  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`} style={{ minHeight: 40 + poles * 15 }}>
      {Array.from({ length: poles }).map((_, i) => (
        <React.Fragment key={i}>
          <Handle type="target" position={Position.Top} id={`L${i+1}`} style={{ left: 20 + (i * 20) }} className="port electrical-port" isConnectable={isConnectable} />
          <Handle type="source" position={Position.Bottom} id={`T${i+1}`} style={{ left: 20 + (i * 20) }} className="port electrical-port" isConnectable={isConnectable} />
        </React.Fragment>
      ))}
      <div className="node-header">
        <ArrowLeftRight size={14} /> {data.label || 'K1'}
      </div>
      <div className="node-body">
        <div className="switch-visual" style={{ flexDirection: 'row', gap: '10px' }}>
          {Array.from({ length: poles }).map((_, i) => (
            <div className="switch-pole" key={i} style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
              <div className="line" style={{ flex: 1, width: 2, background: 'var(--border-strong)' }}></div>
              <div className={`contact ${visualState ? 'closed' : 'open'}`} style={{ height: 20, width: 2, background: 'var(--color-electrical)', transformOrigin: 'top', transform: visualState ? 'rotate(0deg)' : 'rotate(30deg)' }}></div>
              <div className="line" style={{ flex: 1, width: 2, background: 'var(--border-strong)' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LampNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Lightbulb size={14} color={isActive ? '#ffb800' : 'currentColor'} /> {data.label || 'Lamp'}
      </div>
      <div className="node-body">
        <div className={`lamp-visual ${isActive ? 'lit' : ''}`}></div>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="port electrical-port" isConnectable={isConnectable} />
    </div>
  );
};

export const MotorNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Settings size={14} className={isActive ? 'spin' : ''} /> {data.label || 'Motor'}
      </div>
      <div className="node-body">
        <div className="motor-visual">M</div>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="port electrical-port" isConnectable={isConnectable} />
    </div>
  );
};

export const ValveNode = ({ data, isConnectable }) => {
  const subtype = data.subtype || '5_2';
  const domain = data.domain || 'pneumatic';
  const nodeClass = domain === 'hydraulic' ? 'hydraulic-node' : 'pneumatic-node';
  const portClass = domain === 'hydraulic' ? 'hydraulic-port' : 'pneumatic-port';

  return (
    <div className={`custom-node ${nodeClass}`}>
      <Handle type="target" position={Position.Left} id="P" className={`port ${portClass}`} isConnectable={isConnectable} />
      {subtype === '5_2' || subtype === '5_3' ? (
        <>
          <Handle type="target" position={Position.Left} id="R" style={{ top: 10 }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <Handle type="target" position={Position.Left} id="S" style={{ top: 40 }} className={`port ${portClass}`} isConnectable={isConnectable} />
        </>
      ) : null}
      {(subtype === '4_2' || subtype.includes('4_3')) ? (
        <Handle type="target" position={Position.Left} id="T" style={{ top: 40 }} className={`port ${portClass}`} isConnectable={isConnectable} />
      ) : null}

      <div className="node-header">
        <ArrowRight size={14} /> {data.label || 'Valve'}
      </div>
      <div className="node-body">
        <div className="valve-ports">
          <div className="valve-top">
            {(subtype === '3_2') ? (
              <Handle type="source" position={Position.Top} id="A" className={`port ${portClass}`} isConnectable={isConnectable} />
            ) : (
              <>
                <Handle type="source" position={Position.Top} id="A" style={{ left: 10 }} className={`port ${portClass}`} isConnectable={isConnectable} />
                <Handle type="source" position={Position.Top} id="B" style={{ left: 'auto', right: 10 }} className={`port ${portClass}`} isConnectable={isConnectable} />
              </>
            )}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Right} id="solenoid" className="port electrical-port" isConnectable={isConnectable} />
      {subtype.includes('3') ? (
         <Handle type="target" position={Position.Right} id="solenoid_b" style={{ top: 40 }} className="port electrical-port" isConnectable={isConnectable} />
      ) : null}
    </div>
  );
};

export const CylinderNode = ({ data, isConnectable }) => {
  const extension = data.extension || 0; // 0 to 100
  const subtype = data.subtype || 'double_acting';
  const domain = data.domain || 'pneumatic';
  const nodeClass = domain === 'hydraulic' ? 'hydraulic-node' : 'pneumatic-node';
  const portClass = domain === 'hydraulic' ? 'hydraulic-port' : 'pneumatic-port';

  return (
    <div className={`custom-node ${nodeClass}`}>
      <div className="node-header">
        <ArrowLeftRight size={14} /> {data.label || 'Cylinder'}
      </div>
      <div className="node-body cylinder-body">
        <div className="cylinder-chamber">
          <div className="piston" style={{ left: `${extension}%` }}></div>
          <div className="rod" style={{ width: `${extension}%`, left: '10%' }}></div>
        </div>
      </div>
      <Handle type="target" position={Position.Bottom} id="extend" style={{ left: subtype === 'single_acting' ? '50%' : '30%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
      {subtype === 'double_acting' && (
        <Handle type="target" position={Position.Bottom} id="retract" style={{ left: '70%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
      )}
    </div>
  );
};

export const CompressorNode = ({ data, isConnectable }) => {
  return (
    <div className="custom-node pneumatic-node">
      <div className="node-header">
        <Fan size={14} /> Compressor
      </div>
      <div className="node-body">
        <div className="compressor-visual">P</div>
      </div>
      <Handle type="source" position={Position.Top} id="out" className="port pneumatic-port" isConnectable={isConnectable} />
    </div>
  );
};

export const ExhaustNode = ({ data, isConnectable }) => {
  return (
    <div className="custom-node pneumatic-node">
      <Handle type="target" position={Position.Bottom} id="in" className="port pneumatic-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Cloud size={14} /> Exhaust
      </div>
    </div>
  );
};

export const HydraulicPumpNode = ({ data, isConnectable }) => {
  return (
    <div className="custom-node hydraulic-node">
      <div className="node-header">
        <Activity size={14} /> {data.label || 'Pump'}
      </div>
      <div className="node-body">
        <div className="pump-visual">Hyd</div>
      </div>
      <Handle type="source" position={Position.Top} id="out" className="port hydraulic-port" isConnectable={isConnectable} />
    </div>
  );
};

export const TankNode = ({ data, isConnectable }) => {
  return (
    <div className="custom-node hydraulic-node">
      <Handle type="target" position={Position.Top} id="in" className="port hydraulic-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Droplet size={14} /> Tank
      </div>
    </div>
  );
};

export const TimerNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  const isDone = data.isDone || false;
  const subtype = data.subtype || 'ton'; // ton, tof
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Clock size={14} color={isDone ? '#00ff00' : 'currentColor'} /> {data.label || 'Timer'}
      </div>
      <div className="node-body" style={{ flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: '0.65rem' }}>{subtype.toUpperCase()}</div>
        <div className="coil-visual">
          {isDone ? 'DONE' : isActive ? 'TIMING' : 'IDLE'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="port electrical-port" isConnectable={isConnectable} />
    </div>
  );
};

export const SensorNode = ({ id, data, isConnectable }) => {
  const isTriggered = data.isTriggered || false;
  const subtype = data.subtype || 'limit';
  const { setNodes } = useReactFlow();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isTriggered: true } } : n));
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isTriggered: false } } : n));
  };

  return (
    <div 
      className={`custom-node electrical-node ${isTriggered ? 'active' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: 'pointer' }}
    >
      <Handle type="target" position={Position.Left} id="in" className="port electrical-port" isConnectable={isConnectable} />
      <div className="node-header">
        <Circle size={14} /> {data.label || 'Limit SW'}
      </div>
      <div className="node-body">
        <div className="coil-visual" style={{ borderColor: isTriggered ? '#00ff00' : 'var(--border-strong)', color: isTriggered ? '#00ff00' : 'inherit' }}>
          {isTriggered ? 'DETECT' : 'OPEN'}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="port electrical-port" isConnectable={isConnectable} />
    </div>
  );
};
