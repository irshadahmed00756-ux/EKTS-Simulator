import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

let nodes = [
  { id: 'cyl1', type: 'cylinder', data: { limit0Label: 'LS1', limit100Label: 'LS2', extension: 0, isExtending: true } },
  { id: 'ls1', type: 'sensor', data: { subtype: 'limit', label: 'LS1' } },
  { id: 'ls2', type: 'sensor', data: { subtype: 'limit', label: 'LS2' } }
];

let edges = [];

for(let i=0; i<=21; i++) {
  const result = evaluateCircuit(nodes, edges);
  nodes = result.newNodes;
  if (i % 5 === 0 || i === 20 || i === 21) {
    console.log(`Tick ${i}: Cyl ext=${nodes[0].data.extension}, LS1=${nodes[1].data.isTriggered}, LS2=${nodes[2].data.isTriggered}`);
  }
}
