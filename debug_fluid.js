import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: '1', type: 'pump', data: {} },
  { id: '2', type: 'valve', data: { subtype: '4_3_closed', solenoidA: true } },
  { id: '3', type: 'cylinder', data: { subtype: 'double_acting' } }
];

const edges = [
  { id: 'e1', source: '1', target: '2', sourceHandle: 'out', targetHandle: 'P' },
  { id: 'e2', source: '2', target: '3', sourceHandle: 'A', targetHandle: 'extend' }
];

const result = evaluateCircuit(nodes, edges);
console.log(JSON.stringify(result.newNodes.find(n => n.id === '3').data, null, 2));
