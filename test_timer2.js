import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 'sw1', type: 'switch', data: { isClosed: true, subtype: 'no' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton', triggerMode: 'signal_on', targetSeconds: 1, label: 'T1' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 'sw1', sourceHandle: 'out', targetHandle: 'in' },
  { id: 'e2', source: 'sw1', target: 't1', sourceHandle: 'out', targetHandle: 'start' },
  { id: 'e3', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' }
];

for(let i=0; i<10; i++) {
  const result = evaluateCircuit(nodes, edges);
  nodes = result.newNodes;
  console.log(`Tick ${i}: t1 isPowered=${nodes[2].data.isPowered}, startSignal=${nodes[2].data.startSignal}, isTiming=${nodes[2].data.isTiming}, ticks=${nodes[2].data.ticks}`);
}
