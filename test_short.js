import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: '3phase', type: 'power', data: { subtype: '3phase' } },
  { id: '24v', type: 'power', data: { subtype: '24v_dc' } },
  { id: 'button', type: 'switch', data: { subtype: 'no', isClosed: true } },
  { id: '110v', type: 'power', data: { subtype: '110v_ac' } },
  { id: '220v', type: 'power', data: { subtype: '220v_ac' } }
];

const edges = [
  // User drags from 24v OUT to 3phase L2 (backward)
  { id: 'e1', source: '24v', sourceHandle: 'out', target: '3phase', targetHandle: 'L2' },
  // User drags from Button OUT to Button IN (wait no, 24v to Button IN)
  { id: 'e2', source: '24v', sourceHandle: 'out', target: 'button', targetHandle: 'in' },
  { id: 'e3', source: 'button', sourceHandle: 'out', target: '110v', targetHandle: 'out' },
  { id: 'e4', source: '110v', sourceHandle: 'out', target: '220v', targetHandle: 'out' },
];

const result = evaluateCircuit(nodes, edges);
console.log(result);
