import { evaluateCircuit } from './src/simulation/engine.js';

const nodes = [
  { id: '1', type: 'power', data: { subtype: '24v_dc' } },
  { id: '2', type: 'switch', data: { subtype: 'nc', isClosed: false } },
  { id: '3', type: 'timer', data: { subtype: 'ton', ticks: 0, isDone: false } },
  { id: '4', type: 'relay', data: { subtype: 'coil_24v', isActive: true } },
  { id: '5', type: 'lamp', data: { subtype: '24v' } },
  { id: '6', type: 'pump', data: {} },
  { id: '7', type: 'valve', data: { subtype: '4_3_closed', solenoidA: true } },
  { id: '8', type: 'cylinder', data: { subtype: 'double_acting' } }
];

const edges = [
  { source: '1', target: '2', sourceHandle: 'out', targetHandle: 'in' },
  { source: '2', target: '3', sourceHandle: 'out', targetHandle: 'in' },
  { source: '3', target: '4', sourceHandle: 'out', targetHandle: 'A1' },
  { source: '4', target: '5', sourceHandle: 'T1', targetHandle: 'in' }, // L1 is missing power
  { source: '6', target: '7', sourceHandle: 'out', targetHandle: 'P' },
  { source: '7', target: '8', sourceHandle: 'A', targetHandle: 'extend' },
  // What if targetHandle is completely undefined?
  { source: '1', target: '5' } 
];

try {
  console.log("Evaluating Complex Circuit...");
  const result = evaluateCircuit(nodes, edges);
  console.log("Success! Engine is robust.");
} catch (e) {
  console.error("Error found in engine:", e);
}
