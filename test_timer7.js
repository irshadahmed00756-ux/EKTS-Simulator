import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton_24v_dc', triggerMode: 'power_on', targetSeconds: 1, label: 'T1' } },
  { id: 'sw_reset', type: 'switch', data: { subtype: 'no', isClosed: false } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e2', source: 't1', target: 'sw_reset', sourceHandle: 'com', targetHandle: 'in' },
  { id: 'e3', source: 'sw_reset', target: 't1', sourceHandle: 'out', targetHandle: 'reset' }
];

let res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 0: isPowered=${nodes[1].data.isPowered}, isTiming=${nodes[1].data.isTiming}, resetSignal=${nodes[1].data.resetSignal}, ticks=${nodes[1].data.ticks}`);

res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 1: isPowered=${nodes[1].data.isPowered}, isTiming=${nodes[1].data.isTiming}, resetSignal=${nodes[1].data.resetSignal}, ticks=${nodes[1].data.ticks}`);
