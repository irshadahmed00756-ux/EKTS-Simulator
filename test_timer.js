import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 't1', type: 'timer', data: { subtype: 'ton', triggerMode: 'signal_on', targetSeconds: 1, label: 'T1' } }
];

let edges = [
  { id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e2', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'start' }
];

for(let i=0; i<25; i++) {
  if (i === 5) {
     // simulate releasing the push button
     edges = [{ id: 'e1', source: 'p1', target: 't1', sourceHandle: 'out', targetHandle: 'A1' }];
  }
  const result = evaluateCircuit(nodes, edges);
  nodes = result.newNodes;
  if(i === 0 || i === 24) {
    console.log(`Tick ${i}: t1 isPowered=${nodes[1].data.isPowered}, isTiming=${nodes[1].data.isTiming}, ticks=${nodes[1].data.ticks}, isDone=${nodes[1].data.isDone}, isActive=${nodes[1].data.isActive}`);
  }
}
