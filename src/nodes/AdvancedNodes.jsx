import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Thermometer, Filter, ShieldAlert, ArrowDownUp, Waypoints, Activity as ActivityIcon, ArrowUp } from 'lucide-react';
import './nodes.css';

export const PressureReliefNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  const crackPressure = data.crackPressure !== undefined ? data.crackPressure : 100;
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 80, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="P" style={{ left: '30%' }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <div style={{ position: 'absolute', bottom: -18, left: '30%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>P</div>
      <Handle type="source" position={Position.Bottom} id="T" style={{ left: '70%' }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <div style={{ position: 'absolute', bottom: -18, left: '70%', transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text-secondary)' }}>T</div>
      <ShieldAlert size={16} color={color} style={{marginBottom: 2}} />
      <div style={{fontSize: '9px'}}>Relief Valve</div>
      <div style={{fontSize: '9px', fontWeight: 'bold'}}>{crackPressure} bar</div>
    </div>
  );
};

export const PressureReducingNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  const setPressure = data.setPressure !== undefined ? data.setPressure : 50;
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 80, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="P" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="A" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <ArrowDownUp size={16} color={color} style={{marginBottom: 2}} />
      <div style={{fontSize: '9px'}}>Reducing</div>
      <div style={{fontSize: '9px', fontWeight: 'bold'}}>{setPressure} bar</div>
    </div>
  );
};

export const CheckValveNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 60, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <div style={{fontSize: '10px'}}>Check</div>
      <ArrowUp size={14} color={color} style={{marginTop: 2}} />
    </div>
  );
};

export const PilotCheckNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 60, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="X" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <div style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', fontSize: '9px', color: 'var(--text-secondary)' }}>X</div>
      <div style={{fontSize: '10px'}}>Pilot CV</div>
      <ArrowUp size={14} color={color} style={{marginTop: 2}} />
    </div>
  );
};

export const ShuttleValveNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 60, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="in1" style={{ left: '25%' }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="target" position={Position.Bottom} id="in2" style={{ left: '75%' }} className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Waypoints size={16} color={color} style={{marginBottom: 2}} />
      <div style={{fontSize: '9px'}}>Shuttle(OR)</div>
    </div>
  );
};

export const FlowMeterNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  const flow = data.flowRate || 0;
  return (
    <div className={`custom-node ${domain}-node`} style={{ borderRadius: '50%', width: 60, height: 60, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', border: `2px solid ${color}` }}>
      <Handle type="target" position={Position.Left} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <ActivityIcon size={16} color={color} />
      <div style={{ fontSize: '10px', marginTop: 2, fontWeight: 'bold' }}>{flow.toFixed(1)}</div>
      <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>L/min</div>
    </div>
  );
};

export const FilterNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 50, textAlign: 'center' }}>
      <Handle type="target" position={Position.Bottom} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Filter size={16} color={color} />
      <div style={{fontSize: '9px'}}>Filter</div>
    </div>
  );
};

export const CoolerNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 50, textAlign: 'center' }}>
      <Handle type="target" position={Position.Left} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Thermometer size={16} color="#8be9fd" />
      <div style={{fontSize: '9px'}}>Cooler</div>
    </div>
  );
};

export const HeaterNode = ({ data, isConnectable }) => {
  const domain = data.domain || 'hydraulic';
  const color = domain === 'hydraulic' ? 'var(--color-hydraulic)' : 'var(--color-pneumatic)';
  return (
    <div className={`custom-node ${domain}-node`} style={{ border: `1px solid ${color}`, padding: 5, borderRadius: 4, width: 50, textAlign: 'center' }}>
      <Handle type="target" position={Position.Left} id="in" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" className={`port ${domain}-port`} isConnectable={isConnectable} />
      <Thermometer size={16} color="#ff5555" />
      <div style={{fontSize: '9px'}}>Heater</div>
    </div>
  );
};
