import fs from 'fs';
import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: 'p1', type: 'power', data: { subtype: '24v_dc', domain: 'electrical' } },
  { id: 'c1', type: 'relayCoil', data: { subtype: 'coil_24v', label: 'K1' } },
  { id: 'g1', type: 'ground', data: { subtype: '0v', domain: 'electrical' } }
];

const edges = [
  { id: 'e1', source: 'p1', target: 'c1', sourceHandle: 'out', targetHandle: 'A1' },
  { id: 'e2', source: 'c1', target: 'g1', sourceHandle: 'A2', targetHandle: 'in' }
];

const result = evaluateCircuit(nodes, edges);
console.log(result);
