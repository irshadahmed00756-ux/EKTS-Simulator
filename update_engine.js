const fs = require('fs');
const file = 'src/simulation/engine.js';
let content = fs.readFileSync(file, 'utf8');

const marker = "const fluidSources = newNodes.filter(n => n.type === 'compressor' || n.type === 'pump');";
const parts = content.split(marker);

if (parts.length === 2) {
  // Find the end of the fluid block, which is right before "let finalNodes = nodes.map("
  const endMarker = "let finalNodes = nodes.map((originalNode, i) => {";
  const endParts = parts[1].split(endMarker);
  
  if (endParts.length === 2) {
    const newFluidCode = \
    const fluidSources = newNodes.filter(n => n.type === 'compressor' || n.type === 'pump');
    const fluidSinks = newNodes.filter(n => n.type === 'tank' || n.type === 'exhaust');
    
    // Reset fluid states
    newNodes.forEach(n => {
      if (n.type === 'gauge') n.data.pressure = 0;
      if (n.type === 'cylinder') {
         n.data.isExtending = false;
         n.data.isRetracting = false;
         n.data.inFlowRate = 0;
         n.data.regeneration = false;
      }
      if (n.type === 'flowMeter') n.data.flowRate = 0;
    });

    // Helper to get connected edges
    const getOutgoingEdges = (nodeId, handleId) => (edges || []).filter(e => e.source === nodeId && e.sourceHandle === handleId);
    const getIncomingEdges = (nodeId, handleId) => (edges || []).filter(e => e.target === nodeId && e.targetHandle === handleId);

    // Forward pass (Pressure propagation)
    let forwardQueue = [];
    fluidSources.forEach(n => {
       const p = n.data.maxPressure !== undefined ? n.data.maxPressure : (n.type === 'pump' ? 100 : 10);
       forwardQueue.push({ id: n.id, handleIn: 'internal', pressure: p, flowRate: 100 });
    });
    
    let forwardVisited = new Set();
    let pressurizedPorts = new Map(); // node.id -> { A: {pressure, flow}, B: ... }

    while (forwardQueue.length > 0) {
      const current = forwardQueue.shift();
      const currentId = current.id;
      const handleIn = current.handleIn;
      const currentPressure = current.pressure || 0;
      const currentFlowRate = current.flowRate || 100;

      const vKey = \\\\-\\\\;
      if (forwardVisited.has(vKey)) continue;
      forwardVisited.add(vKey);

      const currentNode = getNode(currentId);
      if (!currentNode) continue;

      if (!pressurizedPorts.has(currentId)) pressurizedPorts.set(currentId, {});
      pressurizedPorts.get(currentId)[handleIn] = { pressure: currentPressure, flowRate: currentFlowRate };

      let outHandles = [];
      let nextPressure = currentPressure;
      let nextFlowRate = currentFlowRate;

      if (currentNode.type === 'compressor' || currentNode.type === 'pump') outHandles.push('out');
      if (currentNode.type === 'junction') outHandles.push('out');
      if (currentNode.type === 'gauge') currentNode.data.pressure = currentPressure;
      
      // New logic valves and conditioning
      if (['filter', 'cooler', 'heater'].includes(currentNode.type)) {
         outHandles.push('out');
         nextPressure -= 2; // small pressure drop
      }
      if (currentNode.type === 'flowMeter') {
         currentNode.data.flowRate = currentFlowRate;
         outHandles.push('out');
      }
      if (currentNode.type === 'checkValve') {
         if (handleIn === 'in') outHandles.push('out'); // only allows forward flow
      }
      if (currentNode.type === 'pilotCheck') {
         // check if pilot is pressurized
         const pilotPressurized = pressurizedPorts.get(currentId)['X'];
         if (handleIn === 'in' || (handleIn === 'out' && pilotPressurized)) {
            outHandles.push(handleIn === 'in' ? 'out' : 'in');
         }
      }
      if (currentNode.type === 'shuttleValve') {
         if (handleIn === 'in1' || handleIn === 'in2') outHandles.push('out');
      }
      if (currentNode.type === 'pressureRelief') {
         // It only passes to Tank if pressure > crackPressure, but for simulation we just allow return path logic to handle it
      }
      if (currentNode.type === 'pressureReducing') {
         if (handleIn === 'P') {
            nextPressure = Math.min(currentPressure, currentNode.data.setPressure || 50);
            outHandles.push('A');
         }
      }

      if (currentNode.type === 'throttle') {
        const openPct = currentNode.data.openPercent !== undefined ? currentNode.data.openPercent : 100;
        nextFlowRate = currentFlowRate * (openPct / 100);
        outHandles.push('out');
      }

      if (currentNode.type === 'propValve') {
        const setpoint = currentNode.data.setpoint !== undefined ? currentNode.data.setpoint : 0;
        nextFlowRate = currentFlowRate * (Math.abs(setpoint) / 100);
        if (handleIn === 'P') {
           if (setpoint > 0) outHandles.push('A'); 
           else if (setpoint < 0) outHandles.push('B'); 
        }
      }

      if (currentNode.type === 'valve') {
         if (handleIn === 'P' || handleIn === 'in') {
            const subtype = currentNode.data.subtype || '5_2';
            const solA = currentNode.data.solenoidA;
            const solB = currentNode.data.solenoidB;

            if (subtype === '5_2' || subtype === '4_2') {
              if (solA) outHandles.push('A'); else outHandles.push('B'); 
            } else if (subtype.includes('4_3') || subtype === '5_3') {
              if (solA && !solB) outHandles.push('A');
              else if (solB && !solA) outHandles.push('B');
            } else if (subtype === '3_2') {
              if (solA) outHandles.push('A');
            }
         }
      }
      
      if (currentNode.type === 'motorHyd') {
         if (handleIn === 'in' || handleIn === 'A' || handleIn === 'B') {
            currentNode.data.isActive = true;
         }
      }

      for (const oh of outHandles) {
         const outgoingEdges = getOutgoingEdges(currentId, oh);
         for (const edge of outgoingEdges) {
            poweredEdgeIds.add(edge.id);
            forwardQueue.push({ id: edge.target, handleIn: edge.targetHandle, pressure: nextPressure, flowRate: nextFlowRate });
         }
      }
    }

    // Backward pass (Return to Tank propagation)
    let returnQueue = [];
    fluidSinks.forEach(n => {
       returnQueue.push({ id: n.id, handleOut: 'in' }); // start from tank inputs
    });
    let returnVisited = new Set();
    let returnPorts = new Set(); // set of "\-\"

    while (returnQueue.length > 0) {
       const current = returnQueue.shift();
       const vKey = \\\\-\\\\;
       if (returnVisited.has(vKey)) continue;
       returnVisited.add(vKey);
       returnPorts.add(vKey);

       const currentNode = getNode(current.id);
       if (!currentNode) continue;

       let inHandles = [];
       if (currentNode.type === 'tank' || currentNode.type === 'exhaust') inHandles.push('in');
       if (currentNode.type === 'junction') inHandles.push('in');
       if (['filter', 'cooler', 'heater', 'throttle', 'flowMeter', 'pressureRelief'].includes(currentNode.type)) {
          if (current.handleOut === 'out' || current.handleOut === 'T') inHandles.push('in', 'P'); 
       }
       if (currentNode.type === 'checkValve') {
          if (current.handleOut === 'out') inHandles.push('in'); // reverse check allowed if forward is pressurized? Actually check valve prevents reverse flow.
       }
       if (currentNode.type === 'valve') {
          const subtype = currentNode.data.subtype || '5_2';
          const solA = currentNode.data.solenoidA;
          const solB = currentNode.data.solenoidB;
          
          if (subtype === '5_2' || subtype === '4_2') {
             if (current.handleOut === 'T') {
                if (solA) inHandles.push('B'); else inHandles.push('A');
             }
             if (current.handleOut === 'Ex') {
                if (solA) inHandles.push('B');
             }
             if (current.handleOut === 'Eb') {
                if (!solA) inHandles.push('A');
             }
          } else if (subtype.includes('4_3') || subtype === '5_3') {
             if (current.handleOut === 'T') {
                if (solA && !solB) inHandles.push('B');
                else if (solB && !solA) inHandles.push('A');
                else if (subtype === '4_3_open' || subtype === '4_3_tandem') {
                   inHandles.push('P'); // Open center allows P to T
                   if (subtype === '4_3_open') inHandles.push('A', 'B'); 
                } else if (subtype === '4_3_float') {
                   inHandles.push('A', 'B'); // Float center A and B go to T
                }
             }
          } else if (subtype === '3_2') {
             if (current.handleOut === 'Ex' || current.handleOut === 'T') {
                if (!solA) inHandles.push('A');
             }
          }
       }

       for (const ih of inHandles) {
          const incomingEdges = getIncomingEdges(current.id, ih);
          for (const edge of incomingEdges) {
             poweredEdgeIds.add(edge.id); // highlight return lines too!
             returnQueue.push({ id: edge.source, handleOut: edge.sourceHandle });
          }
       }
    }

    // Cylinder Evaluation
    newNodes = newNodes.map(node => {
      if (node.type === 'cylinder') {
        let ext = node.data.extension || 0;
        const subtype = node.data.subtype || 'double_acting';
        
        const isPressurizedExt = pressurizedPorts.has(node.id) && pressurizedPorts.get(node.id)['extend'];
        const isPressurizedRet = pressurizedPorts.has(node.id) && pressurizedPorts.get(node.id)['retract'];
        
        const isPressurizedA = pressurizedPorts.has(node.id) && pressurizedPorts.get(node.id)['A'];
        const isPressurizedB = pressurizedPorts.has(node.id) && pressurizedPorts.get(node.id)['B'];
        
        const extFlow = isPressurizedA ? pressurizedPorts.get(node.id)['A'].flowRate : (isPressurizedExt ? pressurizedPorts.get(node.id)['extend'].flowRate : 0);
        const retFlow = isPressurizedB ? pressurizedPorts.get(node.id)['B'].flowRate : (isPressurizedRet ? pressurizedPorts.get(node.id)['retract'].flowRate : 0);

        const hasReturnExt = returnPorts.has(\\\\-extend\\\) || returnPorts.has(\\\\-A\\\);
        const hasReturnRet = returnPorts.has(\\\\-retract\\\) || returnPorts.has(\\\\-B\\\);

        let isExtending = false;
        let isRetracting = false;
        let regeneration = false;

        if (subtype === 'single_acting') {
           if ((isPressurizedExt || isPressurizedA)) isExtending = true;
           else if (ext > 0 && (hasReturnExt)) isRetracting = true; // spring return needs exhaust
        } else {
           // Double acting strict rules
           // Regenerative: Both pressurized. Extends due to differential area.
           if ((isPressurizedA || isPressurizedExt) && (isPressurizedB || isPressurizedRet)) {
              isExtending = true;
              regeneration = true;
           } 
           // Normal Extend
           else if ((isPressurizedA || isPressurizedExt) && (hasReturnRet)) {
              isExtending = true;
           }
           // Normal Retract
           else if ((isPressurizedB || isPressurizedRet) && (hasReturnExt)) {
              isRetracting = true;
           }
        }

        const speed = Math.max(0.1, ((isExtending ? extFlow : retFlow) / 100) * 5);

        if (isExtending && ext < 100) ext += (regeneration ? speed * 1.5 : speed); // Regen is faster
        else if (isRetracting && ext > 0) ext -= (subtype === 'single_acting' ? 5 : speed);
        
        ext = Math.max(0, Math.min(100, ext));
        return { ...node, data: { ...node.data, extension: ext, isExtending, isRetracting, regeneration, inFlowRate: isExtending ? extFlow : retFlow } };
      }
      return node;
    });

    \ + endMarker + endParts[1];
    
    fs.writeFileSync(file, parts[0] + newFluidCode);
    console.log("Successfully rewrote engine.js fluid dynamics");
  } else {
    console.log("Could not find end marker");
  }
} else {
  console.log("Could not find start marker");
}
