import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: '1', type: 'power', data: { subtype: '24v_dc' } },
  { id: '2', type: 'relay', data: { subtype: 'coil_24v', isActive: true } },
];
const edges = [
  { source: '1', target: '2', targetHandle: null }
];

try {
  console.log("Evaluating...");
  const result = evaluateCircuit(nodes, edges);
  console.log("Success!");
} catch (e) {
  console.error("Error:", e);
}
