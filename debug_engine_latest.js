import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: '1', type: 'power', data: { subtype: '24v_dc' } },
  { id: '2', type: 'lamp', data: { subtype: '24v_dc', isActive: false } },
  { id: '3', type: 'ground', data: { subtype: '0v' } }
];

const edges = [
  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'out', targetHandle: 'in' }
];

try {
  console.log("Running evaluateCircuit...");
  const { newNodes, poweredEdgeIds } = evaluateCircuit(nodes, edges);
  console.log("Success! Powered Edges:", Array.from(poweredEdgeIds));
  const lamp = newNodes.find(n => n.id === '2');
  console.log("Lamp isActive:", lamp.data.isActive);
} catch (e) {
  console.error("Caught unhandled error:", e);
}
