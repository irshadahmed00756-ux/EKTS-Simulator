import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Zap, Circle, PackageOpen, Lightbulb, Activity, ArrowRight, ArrowLeftRight, Power, Settings, Fan, Droplet, Cloud, Clock, Gauge, Sliders } from 'lucide-react';
import './nodes.css';

export const JunctionNode = ({ isConnectable }) => {
  return (
    <div className="custom-node junction-node" style={{ width: 12, height: 12, borderRadius: '50%', background: '#000', border: '2px solid #000', minWidth: 'unset', padding: 0 }}>
      <Handle type="target" position={Position.Left} id="in" style={{ opacity: 0 }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ opacity: 0 }} isConnectable={isConnectable} />
    </div>
  );
};

export const PowerNode = ({ data, isConnectable }) => {
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
        {subtype === '3phase' ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 15, width: '100%', alignItems: 'flex-end', paddingRight: 5, fontSize: '10px' }}>
              <div>L1</div>
              <div>L2</div>
              <div>L3</div>
           </div>
        ) : (
           <div className="port-label">Out</div>
        )}
      </div>
      {subtype === '3phase' ? (
         <>
           <Handle type="source" position={Position.Right} id="L1" style={{ top: 35 }} className="port electrical-port" isConnectable={isConnectable} />
           <Handle type="source" position={Position.Right} id="L2" style={{ top: 55 }} className="port electrical-port" isConnectable={isConnectable} />
           <Handle type="source" position={Position.Right} id="L3" style={{ top: 75 }} className="port electrical-port" isConnectable={isConnectable} />
         </>
      ) : (
         <Handle type="source" position={Position.Right} id="out" className="port electrical-port" isConnectable={isConnectable} />
      )}
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
  const isBurned = data.burned || false;
  
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''} ${isBurned ? 'burned' : ''}`}>
      <Handle type="target" position={Position.Left} id="A1" style={{ top: 20 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="A2" style={{ top: 20 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <Handle type="target" position={Position.Left} id="in_no" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out_no" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <Handle type="target" position={Position.Left} id="in_nc" style={{ top: 80 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out_nc" style={{ top: 80 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <div className="node-header">
        <PackageOpen size={14} /> {data.label || 'K1'}
      </div>
      <div className="node-body">
        {isBurned ? (
          <div className="coil-visual" style={{ background: '#ff000044', color: '#ff0000', borderColor: '#ff0000' }}>
            BURNED OUT
          </div>
        ) : (
          <div className="coil-visual">
            {isActive ? 'ENERGIZED' : 'IDLE'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, fontSize: '10px', color: 'var(--text-muted)' }}>
          <div>NO: {isActive && !isBurned ? 'Closed' : 'Open'}</div>
          <div>NC: {isActive && !isBurned ? 'Open' : 'Closed'}</div>
        </div>
      </div>
    </div>
  );
};

export const SSRNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  return (
    <div className={`custom-node electrical-node ${isActive ? 'active' : ''}`}>
      <Handle type="target" position={Position.Left} id="A1" style={{ top: 30 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="A2" style={{ top: 60 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <Handle type="target" position={Position.Right} id="in" style={{ top: 30 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" style={{ top: 60 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <div className="node-header">
        <PackageOpen size={14} /> {data.label || 'SSR'}
      </div>
      <div className="node-body" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingLeft: 2, justifyContent: 'center' }}>
            <div>A1</div>
            <div>A2</div>
         </div>
         <div className="coil-visual" style={{ margin: 'auto', background: isActive ? '#00ff0022' : 'transparent', borderColor: isActive ? '#00ff00' : 'var(--border-strong)', color: isActive ? '#00ff00' : 'inherit' }}>
           {isActive ? 'ON' : 'OFF'}
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingRight: 2, alignItems: 'flex-end', justifyContent: 'center' }}>
            <div>IN</div>
            <div>OUT</div>
         </div>
      </div>
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

export const ValveNode = ({ id, data, isConnectable }) => {
  const subtype = data.subtype || '5_2';
  const domain = data.domain || 'pneumatic';
  const nodeClass = domain === 'hydraulic' ? 'hydraulic-node' : 'pneumatic-node';
  const portClass = domain === 'hydraulic' ? 'hydraulic-port' : 'pneumatic-port';
  const is4Port = subtype.includes('4_3') || subtype.includes('4_2');
  const { setNodes } = useReactFlow();

  const handleManualOverride = (solenoid, e) => {
    e.stopPropagation();
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        if (solenoid === 'A') return { ...n, data: { ...n.data, manualOverrideA: !n.data.manualOverrideA, manualOverrideB: false } };
        if (solenoid === 'B') return { ...n, data: { ...n.data, manualOverrideB: !n.data.manualOverrideB, manualOverrideA: false } };
      }
      return n;
    }));
  };

  const isShiftA = data.solenoidA || data.manualOverrideA;
  const isShiftB = data.solenoidB || data.manualOverrideB;

  return (
    <div className={`custom-node ${nodeClass}`} style={{ minWidth: is4Port ? 120 : 100 }}>
      {is4Port ? (
        <>
          {/* Top ports: A, B */}
          <Handle type="source" position={Position.Top} id="A" style={{ left: '30%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', top: -18, left: '30%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>A</div>
          
          <Handle type="source" position={Position.Top} id="B" style={{ left: '70%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', top: -18, left: '70%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>B</div>

          {/* Bottom ports: P, T */}
          <Handle type="target" position={Position.Bottom} id="P" style={{ left: '30%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '30%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>P</div>
          
          <Handle type="source" position={Position.Bottom} id="T" style={{ left: '70%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '70%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>T</div>
          
          {/* Solenoid A */}
          <Handle type="target" position={Position.Left} id="solA_A1" style={{ top: '40%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '35%', fontSize: '7px', color: 'var(--text-muted)' }}>A1</div>
          <Handle type="source" position={Position.Left} id="solA_A2" style={{ top: '60%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '55%', fontSize: '7px', color: 'var(--text-muted)' }}>A2</div>
          <div onClick={(e) => handleManualOverride('A', e)} style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--color-electrical)', cursor: 'pointer', padding: 2, background: data.manualOverrideA ? '#444' : 'transparent', borderRadius: 3 }}>Sol-A</div>
          
          {subtype.includes('4_3') && (
             <>
               <Handle type="target" position={Position.Right} id="solB_A1" style={{ top: '40%' }} className="port electrical-port" isConnectable={isConnectable} />
               <div style={{ position: 'absolute', right: '-10px', top: '35%', fontSize: '7px', color: 'var(--text-muted)' }}>A1</div>
               <Handle type="source" position={Position.Right} id="solB_A2" style={{ top: '60%' }} className="port electrical-port" isConnectable={isConnectable} />
               <div style={{ position: 'absolute', right: '-10px', top: '55%', fontSize: '7px', color: 'var(--text-muted)' }}>A2</div>
               <div onClick={(e) => handleManualOverride('B', e)} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--color-electrical)', cursor: 'pointer', padding: 2, background: data.manualOverrideB ? '#444' : 'transparent', borderRadius: 3 }}>Sol-B</div>
             </>
          )}
        </>
      ) : subtype.includes('5_') ? (
        <>
          {/* Top ports: A, B */}
          <Handle type="source" position={Position.Top} id="A" style={{ left: '30%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', top: -18, left: '30%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>A</div>
          
          <Handle type="source" position={Position.Top} id="B" style={{ left: '70%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', top: -18, left: '70%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>B</div>

          {/* Bottom ports: R, P, S */}
          <Handle type="source" position={Position.Bottom} id="R" style={{ left: '20%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '20%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>R</div>
          
          <Handle type="target" position={Position.Bottom} id="P" style={{ left: '50%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>P</div>
          
          <Handle type="source" position={Position.Bottom} id="S" style={{ left: '80%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '80%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>S</div>

          <Handle type="target" position={Position.Left} id="solA_A1" style={{ top: '40%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '35%', fontSize: '7px', color: 'var(--text-muted)' }}>A1</div>
          <Handle type="source" position={Position.Left} id="solA_A2" style={{ top: '60%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '55%', fontSize: '7px', color: 'var(--text-muted)' }}>A2</div>
          <div onClick={(e) => handleManualOverride('A', e)} style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--color-electrical)', cursor: 'pointer', padding: 2, background: data.manualOverrideA ? '#444' : 'transparent', borderRadius: 3 }}>Sol-A</div>
          
          {subtype === '5_3' && (
             <>
               <Handle type="target" position={Position.Right} id="solB_A1" style={{ top: '40%' }} className="port electrical-port" isConnectable={isConnectable} />
               <div style={{ position: 'absolute', right: '-10px', top: '35%', fontSize: '7px', color: 'var(--text-muted)' }}>A1</div>
               <Handle type="source" position={Position.Right} id="solB_A2" style={{ top: '60%' }} className="port electrical-port" isConnectable={isConnectable} />
               <div style={{ position: 'absolute', right: '-10px', top: '55%', fontSize: '7px', color: 'var(--text-muted)' }}>A2</div>
               <div onClick={(e) => handleManualOverride('B', e)} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--color-electrical)', cursor: 'pointer', padding: 2, background: data.manualOverrideB ? '#444' : 'transparent', borderRadius: 3 }}>Sol-B</div>
             </>
          )}
        </>
      ) : (
        <>
          {/* Top port: A */}
          <Handle type="source" position={Position.Top} id="A" style={{ left: '50%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>A</div>

          {/* Bottom ports: P, T/R */}
          <Handle type="target" position={Position.Bottom} id="P" style={{ left: '30%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '30%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>P</div>
          
          <Handle type="source" position={Position.Bottom} id="R" style={{ left: '70%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
          <div style={{ position: 'absolute', bottom: -18, left: '70%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>R</div>

          <Handle type="target" position={Position.Left} id="solA_A1" style={{ top: '40%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '35%', fontSize: '7px', color: 'var(--text-muted)' }}>A1</div>
          <Handle type="source" position={Position.Left} id="solA_A2" style={{ top: '60%' }} className="port electrical-port" isConnectable={isConnectable} />
          <div style={{ position: 'absolute', left: '-10px', top: '55%', fontSize: '7px', color: 'var(--text-muted)' }}>A2</div>
          <div onClick={(e) => handleManualOverride('A', e)} style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--color-electrical)', cursor: 'pointer', padding: 2, background: data.manualOverrideA ? '#444' : 'transparent', borderRadius: 3 }}>Sol-A</div>
        </>
      )}

      <div className="node-header">
        <ArrowRight size={14} /> {data.label || 'Valve'}
      </div>
      <div className="node-body">
        <div className="valve-symbol">
          {isShiftA ? (
            <span style={{ color: 'var(--color-electrical)', fontWeight: 'bold' }}>SHIFT A</span>
          ) : isShiftB ? (
            <span style={{ color: 'var(--color-electrical)', fontWeight: 'bold' }}>SHIFT B</span>
          ) : (
            <span>CENTER</span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <button 
             onClick={(e) => handleManualOverride('A', e)}
             style={{ fontSize: '0.7rem', padding: '2px 5px', cursor: 'pointer', background: data.manualOverrideA ? 'var(--color-electrical)' : 'var(--bg-tertiary)', color: data.manualOverrideA ? '#000' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }}
          >
            A
          </button>
          {(subtype.includes('_3') || subtype === '4_2') && (
            <button 
               onClick={(e) => handleManualOverride('B', e)}
               style={{ fontSize: '0.7rem', padding: '2px 5px', cursor: 'pointer', background: data.manualOverrideB ? 'var(--color-electrical)' : 'var(--bg-tertiary)', color: data.manualOverrideB ? '#000' : 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: 4 }}
            >
              B
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const CylinderNode = ({ data, isConnectable }) => {
  const extension = data.extension || 0; // 0 to 100
  const subtype = data.subtype || 'double_acting';
  const domain = data.domain || 'pneumatic';
  const nodeClass = domain === 'hydraulic' ? 'hydraulic-node' : 'pneumatic-node';
  const portClass = domain === 'hydraulic' ? 'hydraulic-port' : 'pneumatic-port';

  const limitSwitches = data.limitSwitches || [];
  
  // Combine legacy and new limits for rendering
  const allLimits = [...limitSwitches];
  if (data.limit0Label && !allLimits.find(l => l.label === data.limit0Label && l.position === 0)) {
     allLimits.push({ label: data.limit0Label, position: 0 });
  }
  if (data.limit100Label && !allLimits.find(l => l.label === data.limit100Label && l.position === 100)) {
     allLimits.push({ label: data.limit100Label, position: 100 });
  }

  return (
    <div className={`custom-node ${nodeClass}`} style={{ minWidth: 120 }}>
      {allLimits.map((limit, idx) => {
        // Map 0-100 to 5%-95% width to align with the cylinder chamber limits
        const leftPos = 5 + (limit.position * 0.9);
        return (
          <div key={idx} style={{ 
            position: 'absolute', top: -15, left: `calc(${leftPos}% - 15px)`, 
            fontSize: '9px', color: '#fff', background: '#34495e', 
            padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold',
            border: '1px solid #2c3e50', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 10, textAlign: 'center', minWidth: '30px'
          }}>
            {limit.label}
          </div>
        );
      })}
      
      <div className="node-header">
        <ArrowLeftRight size={14} /> {data.label || 'Cylinder'}
      </div>
      <div className="node-body cylinder-body">
        <div className="cylinder-chamber">
          {subtype === 'single_acting' && (
            <div style={{
              position: 'absolute', top: '20%', right: '2%', bottom: '20%', left: `calc(${extension}% + 10px)`,
              background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 6px)',
              zIndex: 0, transition: 'left 0.3s ease'
            }}></div>
          )}
          <div className="piston" style={{ left: `calc(${extension}% - ${extension / 10}px)`, zIndex: 1 }}></div>
          <div className="rod" style={{ width: '100%', left: `calc(${extension}% - ${extension / 10}px + 10px)`, transition: 'left 0.3s ease', zIndex: 1 }}></div>
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
  const pressure = data.pressure || 100;
  return (
    <div className="custom-node hydraulic-node">
      <div className="node-header">
        <Activity size={14} /> {data.label || 'Pump'}
      </div>
      <div className="node-body" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          border: '2px dashed var(--color-hydraulic)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'spin 2s linear infinite'
        }}>
          ⚙️
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-hydraulic)', marginTop: 5, fontWeight: 'bold' }}>
          {pressure.toFixed(1)} bar
        </div>
      </div>
      
      <Handle type="source" position={Position.Top} id="out" className="port hydraulic-port" isConnectable={isConnectable} />
      <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>P</div>
      
      <Handle type="target" position={Position.Bottom} id="suction" className="port hydraulic-port" isConnectable={isConnectable} />
      <div style={{ position: 'absolute', bottom: -15, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>Suction</div>
    </div>
  );
};

export const TankNode = ({ data, isConnectable }) => {
  return (
    <div className="custom-node hydraulic-node" style={{ minHeight: 70, minWidth: 70, padding: 0 }}>
      {/* Top Return Port */}
      <Handle type="target" position={Position.Top} id="in" className="port hydraulic-port" isConnectable={isConnectable} style={{ top: -5 }} />
      <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>Return</div>
      
      {/* Side Suction Port */}
      <Handle type="source" position={Position.Right} id="suction" className="port hydraulic-port" isConnectable={isConnectable} style={{ top: '70%' }} />
      <div style={{ position: 'absolute', top: '70%', right: -40, transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>Suction</div>
      
      <div className="node-body" style={{ height: '70px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden', background: '#1a1a1a', position: 'relative' }}>
         <div style={{ position: 'absolute', top: 5, left: 0, width: '100%', textAlign: 'center', fontSize: '10px', zIndex: 2 }}>
           <Droplet size={12} /> Tank
         </div>
         {/* Oil visual */}
         <div style={{ height: '60%', width: '100%', background: 'var(--color-hydraulic)', opacity: 0.8, borderTop: '2px solid rgba(255,255,255,0.3)' }}></div>
      </div>
    </div>
  );
};

export const TimerNode = ({ data, isConnectable }) => {
  const isActive = data.isActive || false;
  const isDone = data.isDone || false;
  const isBurned = data.burned || false;
  const subtype = data.subtype || 'ton';
  const targetSeconds = data.targetSeconds !== undefined ? data.targetSeconds : 2.0;
  const currentSeconds = (data.elapsedSeconds || 0).toFixed(1);

  return (
    <div className={`custom-node electrical-node digital-timer-node ${isActive && !isBurned ? 'active' : ''}`} style={{ minWidth: 140 }}>
      {/* Power Pins */}
      <Handle type="target" position={Position.Left} id="A1" style={{ top: 25 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="A2" style={{ top: 25 }} className="port electrical-port" isConnectable={isConnectable} />
      
      {/* Input Pins */}
      <Handle type="target" position={Position.Left} id="start" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="reset" style={{ top: 75 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="com" style={{ top: 100 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <div style={{ position: 'absolute', left: '-15px', top: '20px', fontSize: '8px', color: 'var(--text-muted)' }}>A1</div>
      <div style={{ position: 'absolute', left: '-25px', top: '45px', fontSize: '8px', color: 'var(--text-muted)' }}>Start</div>
      <div style={{ position: 'absolute', left: '-28px', top: '70px', fontSize: '8px', color: 'var(--text-muted)' }}>Reset</div>
      <div style={{ position: 'absolute', left: '-23px', top: '95px', fontSize: '8px', color: 'var(--text-muted)' }}>Com</div>

      {/* Output Contact Pins */}
      <Handle type="target" position={Position.Right} id="contact_com" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="no" style={{ top: 75 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="nc" style={{ top: 100 }} className="port electrical-port" isConnectable={isConnectable} />

      <div style={{ position: 'absolute', right: '-15px', top: '20px', fontSize: '8px', color: 'var(--text-muted)' }}>A2</div>
      <div style={{ position: 'absolute', right: '-22px', top: '45px', fontSize: '8px', color: 'var(--text-muted)' }}>Com</div>
      <div style={{ position: 'absolute', right: '-18px', top: '70px', fontSize: '8px', color: 'var(--text-muted)' }}>NO</div>
      <div style={{ position: 'absolute', right: '-18px', top: '95px', fontSize: '8px', color: 'var(--text-muted)' }}>NC</div>

      <div className="node-header">
        <Clock size={14} color={isDone && !isBurned ? '#00ff00' : isBurned ? '#ff0000' : 'currentColor'} /> {data.label || 'Timer'}
      </div>
      <div className="node-body" style={{ flexDirection: 'column', gap: 5, padding: '5px' }}>
        <div style={{ fontSize: '0.65rem' }}>{subtype.split('_').join(' ').toUpperCase()}</div>
        <div className="digital-display" style={{ 
          background: isBurned ? '#ff000044' : '#111', 
          color: isBurned ? '#ff0000' : isActive ? '#0ff' : isDone ? '#0f0' : '#444', 
          padding: '2px 5px', 
          borderRadius: '3px', 
          fontFamily: 'monospace',
          border: `1px solid ${isBurned ? '#ff0000' : isActive ? '#0ff' : isDone ? '#0f0' : '#333'}`
        }}>
          {isBurned ? 'BURNED' : `${currentSeconds}s / ${targetSeconds.toFixed(1)}s`}
        </div>
      </div>
    </div>
  );
};

export const SensorNode = ({ id, data, isConnectable }) => {
  const isTriggered = data.isTriggered || false;
  const subtype = data.subtype || 'limit';
  const { setNodes } = useReactFlow();

  const handleClick = (e) => {
    e.stopPropagation();
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, isTriggered: !n.data.isTriggered } } : n));
  };

  return (
    <div 
      className={`custom-node electrical-node ${isTriggered ? 'active' : ''}`}
      onClick={handleClick}
      style={{ cursor: 'pointer', minHeight: 70 }}
    >
      <Handle type="target" position={Position.Left} id="in_no" style={{ top: 20 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out_no" style={{ top: 20 }} className="port electrical-port" isConnectable={isConnectable} />
      
      <Handle type="target" position={Position.Left} id="in_nc" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out_nc" style={{ top: 50 }} className="port electrical-port" isConnectable={isConnectable} />

      <div className="node-header">
        <Circle size={14} /> {data.label || 'Limit SW'}
      </div>
      <div className="node-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '10px', alignItems: 'center' }}>
           <div>NO: <span style={{ color: isTriggered ? '#00ff00' : 'inherit' }}>{isTriggered ? 'CLOSE' : 'OPEN'}</span></div>
           <div>NC: <span style={{ color: isTriggered ? 'inherit' : '#00ff00' }}>{isTriggered ? 'OPEN' : 'CLOSE'}</span></div>
        </div>
      </div>
    </div>
  );
};

export const PressureGaugeNode = ({ data, isConnectable }) => {
  const pressure = data.pressure || 0;
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ borderRadius: '50%', width: 60, height: 60, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', border: `2px solid ${color}` }}>
      <Handle type="target" position={Position.Bottom} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Gauge size={16} color={color} />
      <div style={{ fontSize: '10px', marginTop: 2, fontWeight: 'bold' }}>{pressure.toFixed(1)}</div>
      <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>bar</div>
    </div>
  );
};

export const FlowControlNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const openPercent = data.openPercent !== undefined ? data.openPercent : 100;
  return (
    <div className={`custom-node ${domain}-node`}>
      <Handle type="target" position={Position.Left} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <div className="node-header"><Sliders size={14} /> Throttle</div>
      <div className="node-body" style={{ flexDirection: 'column' }}>
        <div style={{ fontSize: '10px' }}>Open: {openPercent}%</div>
      </div>
    </div>
  );
};

export const ProportionalValveNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const setpoint = data.setpoint !== undefined ? data.setpoint : 0; 
  return (
    <div className={`custom-node ${domain}-node`}>
      <Handle type="target" position={Position.Left} id="P" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="T" style={{ top: 40 }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="A" style={{ top: 10 }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="B" style={{ top: 40 }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      
      <Handle type="target" position={Position.Bottom} id="solenoid" className="port electrical-port" isConnectable={isConnectable} />
      
      <div className="node-header"><Sliders size={14} /> Prop. Valve</div>
      <div className="node-body" style={{ flexDirection: 'column' }}>
        <div style={{ fontSize: '10px' }}>Flow: {setpoint}%</div>
      </div>
    </div>
  );
};

export const ManifoldNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'pneumatic';
  const nodeClass = domain === 'hydraulic' ? 'hydraulic-node' : 'pneumatic-node';
  const portClass = domain === 'hydraulic' ? 'hydraulic-port' : 'pneumatic-port';
  
  return (
    <div className={`custom-node ${nodeClass}`} style={{ minWidth: 100, minHeight: 40, borderRadius: 0, padding: 5 }}>
      <Handle type="target" position={Position.Left} id="in" className={`port ${portClass}`} isConnectable={isConnectable} />
      
      <Handle type="source" position={Position.Top} id="out1" style={{ left: '25%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out2" style={{ left: '50%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out3" style={{ left: '75%' }} className={`port ${portClass}`} isConnectable={isConnectable} />
      
      <Handle type="source" position={Position.Right} id="out4" className={`port ${portClass}`} isConnectable={isConnectable} />
      
      <div className="node-body" style={{ textAlign: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', height: 20, lineHeight: '20px', fontSize: '0.7rem' }}>
        Manifold / Connector
      </div>
    </div>
  );
};
