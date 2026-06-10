import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 'sw_start', type: 'switch', data: { isClosed: false, subtype: 'no' } },
  { id: 'sw_reset', type: 'switch', data: { isClosed: false, subtype: 'no' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton_24v_dc', triggerMode: 'signal_on', targetSeconds: 1, label: 'T1' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e2', source: 't1', target: 'sw_start', sourceHandle: 'com', targetHandle: 'in' },
  { id: 'e3', source: 'sw_start', target: 't1', sourceHandle: 'out', targetHandle: 'start' },
  { id: 'e4', source: 't1', target: 'sw_reset', sourceHandle: 'com', targetHandle: 'in' },
  { id: 'e5', source: 'sw_reset', target: 't1', sourceHandle: 'out', targetHandle: 'reset' }
];

let res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 0: isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);

nodes[1].data.isClosed = true; // Press Start
res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 1 (Press Start): isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);

nodes[1].data.isClosed = false; // Release Start
res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 2 (Release Start): isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);

nodes[2].data.isClosed = true; // Press Reset
res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 3 (Press Reset): isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);

nodes[2].data.isClosed = false; // Release Reset
res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 4 (Release Reset): isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);

nodes[1].data.isClosed = true; // Press Start AGAIN
res = evaluateCircuit(nodes, edges); nodes = res.newNodes;
console.log(`Tick 5 (Press Start 2): isTiming=${nodes[3].data.isTiming}, ticks=${nodes[3].data.ticks}`);
