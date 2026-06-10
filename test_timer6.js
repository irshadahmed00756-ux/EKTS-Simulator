import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 'g1', type: 'ground', data: { subtype: 'ground', domain: 'electrical' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton_24v_dc', triggerMode: 'power_on', targetSeconds: 1, label: 'T1' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e2', source: 't1', target: 'g1', sourceHandle: 'A2', targetHandle: 'in' }
];

let res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 0: isPowered=${nodes[2].data.isPowered}, isTiming=${nodes[2].data.isTiming}, ticks=${nodes[2].data.ticks}`);

res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 1: isPowered=${nodes[2].data.isPowered}, isTiming=${nodes[2].data.isTiming}, ticks=${nodes[2].data.ticks}`);
