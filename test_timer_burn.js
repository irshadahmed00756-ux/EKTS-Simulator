import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '220v_ac', domain: 'electrical' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton_24v_dc', triggerMode: 'power_on', targetSeconds: 1, label: 'T1' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' }
];

const result = evaluateCircuit(nodes, edges);
console.log(`t1 isPowered=${result.newNodes[1].data.isPowered}, burned=${result.newNodes[1].data.burned}`);

let nodes2 = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton_24v_dc', triggerMode: 'power_on', targetSeconds: 1, label: 'T1' } }
];

let edges2 = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' }
];

const result2 = evaluateCircuit(nodes2, edges2);
console.log(`t1 isPowered=${result2.newNodes[1].data.isPowered}, burned=${result2.newNodes[1].data.burned}`);
