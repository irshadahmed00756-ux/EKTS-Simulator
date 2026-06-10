import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '220v_ac', domain: 'electrical' } },
  { id: 'sw1', type: 'switch', data: { subtype: 'toggle', isClosed: true } },
  { id: 't3', type: 'timer', data: { subtype: 'tof_220v_ac', triggerMode: 'power_on', targetSeconds: 5, label: 'T3' } },
  { id: 't3_2', type: 'timer', data: { subtype: 'tof_220v_ac', triggerMode: 'power_on', targetSeconds: 5, label: 'T3_2' } },
  { id: 'g1', type: 'ground', data: { subtype: 'neutral', domain: 'electrical' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 'sw1', sourceHandle: 'out', targetHandle: 'in' },
  { id: 'e2', source: 'sw1', target: 't3', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e3', source: 'sw1', target: 't3', sourceHandle: 'out', targetHandle: 'contact_com' },
  { id: 'e4', source: 't3', target: 'g1', sourceHandle: 'A2', targetHandle: 'in' },
  { id: 'e5', source: 't3', target: 't3_2', sourceHandle: 'no', targetHandle: 'A1' },
  { id: 'e6', source: 't3_2', target: 'g1', sourceHandle: 'A2', targetHandle: 'in' }
];

let res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 0: T3 isPowered=${nodes[2].data.isPowered}, ticks=${nodes[2].data.ticks}, T3_2 isPowered=${nodes[3].data.isPowered}`);

res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 1: T3 isPowered=${nodes[2].data.isPowered}, ticks=${nodes[2].data.ticks}, T3_2 isPowered=${nodes[3].data.isPowered}`);
