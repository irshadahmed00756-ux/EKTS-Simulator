// src/simulation/engine.js
// Advanced graph traversal for evaluating electrical logic and fluid states.

export function evaluateCircuit(nodes, edges) {
  try {
    let globalShortCircuit = false;
    let shortCircuitDetails = "";

    let newNodes = nodes.map(node => {
      let defaultData = { ...node.data };
      
      if (node.type === 'switch' || node.type === 'sensor') {
        defaultData.isPowered = false;
      }
      if (node.type === 'relayCoil' || node.type === 'relayContact' || node.type === 'lamp' || node.type === 'motor') {
        defaultData.isActive = false;
        defaultData.burned = false;
      }
      if (node.type === 'timer') {
        defaultData.isActive = false;
        defaultData.isPowered = false;
        defaultData.startSignal = false;
        defaultData.resetSignal = false;
        defaultData.burned = false;
      }
      if (node.type === 'ssr') {
        defaultData.isActive = false;
      }
      if (node.type === 'valve') {
        defaultData.solenoidA = false;
        defaultData.solenoidB = false;
        defaultData.solA_electricalActive = false;
        defaultData.solB_electricalActive = false;
      }
      if (node.type === 'cylinder') {
        defaultData.isExtending = false;
        defaultData.isRetracting = false;
      }
      if (node.type === 'ground') {
        defaultData.shortCircuit = false;
      }
      
      return { ...node, data: defaultData };
    });

    const getNode = (id) => newNodes.find(n => n.id === id);

    // --- MECHANICAL LINKAGE PASS ---
    const cylinders = newNodes.filter(n => n.type === 'cylinder');
    newNodes.forEach(node => {
       if (node.type === 'sensor' && node.data.subtype === 'limit' && node.data.label) {
          let mechanicallyTriggered = false;
          cylinders.forEach(cyl => {
             const ext = cyl.data.extension || 0;
             if (cyl.data.limit0Label === node.data.label && ext <= 0) mechanicallyTriggered = true;
             if (cyl.data.limit100Label === node.data.label && ext >= 100) mechanicallyTriggered = true;
          });
          // Allow manual click override from UI or mechanical trigger
          node.data.isTriggered = mechanicallyTriggered || node.data.isTriggered;
       }
    });
    // -------------------------------

    const poweredEdgeIds = new Set();
    let edgeVoltages = new Map(); // edge.id -> Set<voltage>

    const activeCoilLabels = new Set();
    nodes.forEach(n => {
       if (n.type === 'relayCoil' && n.data.isActive && n.data.label) {
          activeCoilLabels.add(n.data.label);
       }
       if (n.type === 'timer' && n.data.label) {
          if (n.data.subtype === 'ton' && n.data.isDone) {
             activeCoilLabels.add(n.data.label);
          }
          if (n.data.subtype === 'tof' && n.data.isDone) {
             activeCoilLabels.add(n.data.label);
          }
          if (n.data.subtype === 'star_delta') {
             if (n.data.isActive && !n.data.isDone) {
                activeCoilLabels.add(n.data.label + '_STAR');
             } else if (n.data.isDone) {
                activeCoilLabels.add(n.data.label + '_DELTA');
             }
          }
       }
    });

    const powerNodes = newNodes.filter(n => n.type === 'power');
    let queue = [];
    powerNodes.forEach(n => {
       if (n.data.subtype === '3phase') {
          queue.push({ id: n.id, voltage: 'L1', handleIn: 'internal_L1' });
          queue.push({ id: n.id, voltage: 'L2', handleIn: 'internal_L2' });
          queue.push({ id: n.id, voltage: 'L3', handleIn: 'internal_L3' });
       } else {
          queue.push({ id: n.id, voltage: n.data.subtype || '24v_dc', handleIn: 'internal' });
       }
    });
    
    let visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      const currentId = current.id;
      const currentVoltage = String(current.voltage);
      const handleIn = current.handleIn;
      
      const visitKey = `${currentId}-${currentVoltage}-${handleIn}`;
      if (visited.has(visitKey)) continue;
      visited.add(visitKey);

      const currentNode = getNode(currentId);
      if (!currentNode) continue;

      let outHandles = [];

      if (currentNode.type === 'power') {
         if (handleIn === 'internal_L1') outHandles.push('L1');
         else if (handleIn === 'internal_L2') outHandles.push('L2');
         else if (handleIn === 'internal_L3') outHandles.push('L3');
         else outHandles.push('out');
      }

      if (currentNode.type === 'junction') {
        outHandles.push('out');
      }

      if (currentNode.type === 'switch') {
        const subtype = currentNode.data.subtype || 'no';
        const isClosed = currentNode.data.isClosed;
        
        let visualState = isClosed;
        if (subtype === 'nc') visualState = !isClosed;

        if (visualState) {
          if (handleIn === 'in') outHandles.push('out');
          else if (handleIn === 'out') outHandles.push('in');
          else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('in_')) {
            outHandles.push(handleIn.replace('in_', 'out_'));
          } else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('out_')) {
            outHandles.push(handleIn.replace('out_', 'in_'));
          }
        }
      }

      if (currentNode.type === 'sensor') {
         if (currentNode.data.isTriggered) {
            if (handleIn === 'in' || handleIn === 'in_no') outHandles.push(handleIn === 'in' ? 'out' : 'out_no');
            if (handleIn === 'out' || handleIn === 'out_no') outHandles.push(handleIn === 'out' ? 'in' : 'in_no');
         } else {
            if (handleIn === 'in_nc') outHandles.push('out_nc');
            if (handleIn === 'out_nc') outHandles.push('in_nc');
         }
      }

      if (currentNode.type === 'timer') {
         if (handleIn === 'A1' || handleIn === 'A2') {
            const requiredSubtype = String(currentNode.data.subtype || '24v_dc');
            const reqMatch = requiredSubtype.match(/\d+/);
            const curMatch = currentVoltage.match(/\d+/);
            const reqNum = reqMatch ? reqMatch[0] : (requiredSubtype.includes('24v') ? '24' : '220');
            const curNum = curMatch ? curMatch[0] : null;
            
            if ((reqNum && reqNum === curNum) || 
                (requiredSubtype.includes('dc') && currentVoltage.includes('dc')) ||
                (requiredSubtype.includes('ac') && currentVoltage.includes('ac')) || 
                (!requiredSubtype.includes('v'))) { 
               currentNode.data.isPowered = true;
               outHandles.push('com');
            } else {
               currentNode.data.burned = true;
            }
         }
         if (handleIn === 'start') currentNode.data.startSignal = true;
         if (handleIn === 'reset') currentNode.data.resetSignal = true;
         
         const originalTimerNode = nodes.find(n => n.id === currentId) || currentNode;
         const isDone = originalTimerNode.data.isDone;
         if (handleIn === 'contact_com') {
             if (isDone) outHandles.push('no');
             if (!isDone) outHandles.push('nc');
         }
         if (handleIn === 'no' && isDone) outHandles.push('contact_com');
         if (handleIn === 'nc' && !isDone) outHandles.push('contact_com');
      }

      if (currentNode.type === 'ssr') {
         if (handleIn === 'A1' || handleIn === 'A2') {
             currentNode.data.isActive = true;
         }
         if (currentNode.data.isActive) {
             if (handleIn === 'in') outHandles.push('out');
             if (handleIn === 'out') outHandles.push('in');
         }
      }

      if (currentNode.type === 'relayCoil') {
         if (handleIn === 'A1' || handleIn === 'A2') {
            const requiredSubtype = String(currentNode.data.subtype || 'coil_24v');
            const reqMatch = requiredSubtype.match(/\d+/);
            const curMatch = currentVoltage.match(/\d+/);
            const reqNum = reqMatch ? reqMatch[0] : null;
            const curNum = curMatch ? curMatch[0] : null;
            
            if ((reqNum && reqNum === curNum) || 
                (requiredSubtype.includes('dc') && currentVoltage.includes('dc')) ||
                (requiredSubtype.includes('ac') && currentVoltage.includes('ac'))) {
               currentNode.data.isActive = true;
            } else {
               currentNode.data.burned = true;
            }
         }
         
         const originalCoilNode = nodes.find(n => n.id === currentId) || currentNode;
         const isCoilActive = originalCoilNode.data.isActive;
         
         if (isCoilActive) {
            if (handleIn === 'in_no') outHandles.push('out_no');
            if (handleIn === 'out_no') outHandles.push('in_no');
         } else {
            if (handleIn === 'in_nc') outHandles.push('out_nc');
            if (handleIn === 'out_nc') outHandles.push('in_nc');
         }
      }

      if (currentNode.type === 'valve') {
         if (handleIn === 'solA_A1' || handleIn === 'solA_A2' || handleIn === 'solB_A1' || handleIn === 'solB_A2') {
            const requiredSubtype = String(currentNode.data.coilVoltage || '24v_dc');
            const reqMatch = requiredSubtype.match(/\d+/);
            const curMatch = currentVoltage.match(/\d+/);
            const reqNum = reqMatch ? reqMatch[0] : (requiredSubtype.includes('24v') ? '24' : '220');
            const curNum = curMatch ? curMatch[0] : null;
            
            if ((reqNum && reqNum === curNum) || 
                (requiredSubtype.includes('dc') && currentVoltage.includes('dc')) ||
                (requiredSubtype.includes('ac') && currentVoltage.includes('ac')) || 
                (!requiredSubtype.includes('v'))) {
               
               if (handleIn.startsWith('solA')) currentNode.data.solA_electricalActive = true;
               if (handleIn.startsWith('solB')) currentNode.data.solB_electricalActive = true;
            } else {
               currentNode.data.burned = true;
            }
         }
      }

      if (currentNode.type === 'relayContact') {
         const isCoilActive = activeCoilLabels.has(currentNode.data.label);
         const subtype = currentNode.data.subtype || 'no';
         
         let isClosed = false;
         if (subtype === 'no' && isCoilActive) isClosed = true;
         if (subtype === 'nc' && !isCoilActive) isClosed = true;
         
         currentNode.data.isActive = isClosed; 
         
         if (isClosed) {
            if (handleIn === 'in') outHandles.push('out');
            else if (handleIn === 'out') outHandles.push('in');
            else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('in_')) {
               outHandles.push(handleIn.replace('in_', 'out_'));
            } else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('out_')) {
               outHandles.push(handleIn.replace('out_', 'in_'));
            } else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('L')) {
               outHandles.push(handleIn.replace('L', 'T'));
            } else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('T')) {
               outHandles.push(handleIn.replace('T', 'L'));
            }
         }
      }

      if (currentNode.type === 'lamp' || currentNode.type === 'motor') {
        const requiredSubtype = String(currentNode.data.subtype || '24v_dc');
        const reqMatch = requiredSubtype.match(/\d+/);
        const curMatch = currentVoltage.match(/\d+/);
        const reqNum = reqMatch ? reqMatch[0] : null;
        const curNum = curMatch ? curMatch[0] : null;
        
        if ((reqNum && reqNum === curNum) || 
            (requiredSubtype.includes('dc') && currentVoltage.includes('dc')) ||
            (requiredSubtype.includes('ac') && currentVoltage.includes('ac'))) {
           currentNode.data.isActive = true;
        } else {
           currentNode.data.burned = true;
        }
      }

      if (currentNode.type === 'valve') {
         if (handleIn === 'solenoid') currentNode.data.solenoidA = true;
         if (handleIn === 'solenoid_b') currentNode.data.solenoidB = true;
      }

      if (currentNode.type === 'ground') {
         // User requested to disable "Power connected directly to Ground" alarm so they can run logic circuits freely
         // currentNode.data.shortCircuit = true;
         // globalShortCircuit = true;
         // shortCircuitDetails = "Power connected directly to Ground without Load!";
      }

      // Treat the incoming port as a junction itself (all wires on the same port are shorted together)
      if (handleIn) {
         if (!outHandles.includes(handleIn)) outHandles.push(handleIn);
      }

      for (const oh of outHandles) {
         // Forward direction edges
         const outgoingEdgesForward = (edges || []).filter(e => e.source === currentId && e.sourceHandle === oh);
         for (const edge of outgoingEdgesForward) {
            poweredEdgeIds.add(edge.id);
            if (!edgeVoltages.has(edge.id)) edgeVoltages.set(edge.id, new Set());
            edgeVoltages.get(edge.id).add(currentVoltage);

            queue.push({ id: edge.target, voltage: currentVoltage, handleIn: edge.targetHandle });
         }

         // Backward direction edges (because wires are bidirectional)
         const outgoingEdgesBackward = (edges || []).filter(e => e.target === currentId && e.targetHandle === oh);
         for (const edge of outgoingEdgesBackward) {
            poweredEdgeIds.add(edge.id);
            if (!edgeVoltages.has(edge.id)) edgeVoltages.set(edge.id, new Set());
            edgeVoltages.get(edge.id).add(currentVoltage);

            queue.push({ id: edge.source, voltage: currentVoltage, handleIn: edge.sourceHandle });
         }
      }
    }
    
    // Check for Voltage Clash Short Circuits
    for (const [edgeId, voltages] of edgeVoltages.entries()) {
       if (voltages.size > 1) {
          globalShortCircuit = true;
          shortCircuitDetails = `Voltage Clash! (${Array.from(voltages).join(' touching ')})`;
          break; // One global short is enough to crash the circuit
       }
    }

    newNodes = newNodes.map(node => {
       if (node.type === 'timer') {
          const subtype = node.data.subtype || 'ton';
          let ticks = node.data.ticks || 0;
          let isDone = node.data.isDone || false;
          const targetSeconds = node.data.targetSeconds !== undefined ? node.data.targetSeconds : 2;
          const targetTicks = Math.round(targetSeconds * 20);

          const isPowered = node.data.isPowered;
          const startSignal = node.data.startSignal;
          const resetSignal = node.data.resetSignal;

          let isTiming = node.data.isTiming || false;
          const triggerMode = node.data.triggerMode || 'signal_on';

          let { elapsedSeconds = 0, startTime } = node.data;

          if (resetSignal) {
             isTiming = false;
             elapsedSeconds = 0;
             isDone = false;
          } else if (subtype.includes('ton')) {
             // For ON-Delay:
             if (isPowered) {
                if (triggerMode === 'power_on') {
                   // Power mode
                   if (!isTiming && !isDone) {
                      isTiming = true;
                      startTime = Date.now();
                   }
                } else if (triggerMode === 'signal_on') {
                   // Signal mode (requires Start pulse)
                   if (startSignal && !isTiming && !isDone) {
                      isTiming = true; // Latch the start signal
                      startTime = Date.now();
                   }
                }
             }
             
             if (isPowered && isTiming) {
                elapsedSeconds = (Date.now() - startTime) / 1000;
                if (elapsedSeconds >= targetSeconds) {
                   elapsedSeconds = targetSeconds;
                   isDone = true;
                   isTiming = false; // Stop timing once done
                }
             } else if (!isPowered) {
                // Timer resets if main power is lost
                isTiming = false;
                elapsedSeconds = 0;
                isDone = false;
             }
          } else if (subtype.includes('tof')) {
             // For OFF-Delay:
             const effectiveStart = triggerMode === 'power_on' ? true : startSignal;
             
             if (isPowered && effectiveStart) {
                elapsedSeconds = targetSeconds;
                isDone = true;
                isTiming = false;
             } else if (isPowered && !effectiveStart && isDone) {
                if (!isTiming) {
                   isTiming = true;
                   startTime = Date.now();
                }
                elapsedSeconds = targetSeconds - ((Date.now() - startTime) / 1000);
                if (elapsedSeconds <= 0) {
                   elapsedSeconds = 0;
                   isDone = false;
                   isTiming = false;
                }
             } else if (!isPowered) {
                isTiming = false;
                elapsedSeconds = 0;
                isDone = false;
             }
          }

          // UI feedback
          node.data.isActive = isTiming || startSignal || (triggerMode === 'power_on' && isPowered && !isDone);

          return { ...node, data: { ...node.data, elapsedSeconds, startTime, isDone, isTiming } };
       }
       return node;
    });

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

      const vKey = `${currentId}-${handleIn}`;
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
      if (currentNode.type === 'manifold') outHandles.push('out1', 'out2', 'out3', 'out4');
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
            const solA = currentNode.data.solenoidA || currentNode.data.manualOverrideA || currentNode.data.solA_electricalActive;
            const solB = currentNode.data.solenoidB || currentNode.data.manualOverrideB || currentNode.data.solB_electricalActive;

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
       // Add 'T' and 'Ex' as well since ports are named that way in valves
       returnQueue.push({ id: n.id, handleOut: 'T' });
       returnQueue.push({ id: n.id, handleOut: 'Ex' });
    });
    let returnVisited = new Set();
    let returnPorts = new Set(); // set of "${nodeId}-${handleId}"

    while (returnQueue.length > 0) {
       const current = returnQueue.shift();
       const vKey = `${current.id}-${current.handleOut}`;
       if (returnVisited.has(vKey)) continue;
       returnVisited.add(vKey);
       returnPorts.add(vKey);

       const currentNode = getNode(current.id);
       if (!currentNode) continue;

       let inHandles = [];
       if (currentNode.type === 'tank' || currentNode.type === 'exhaust') {
           inHandles.push('in');
           inHandles.push('P'); // In case it's connected backward
       }
       if (currentNode.type === 'junction') inHandles.push('in');
       if (currentNode.type === 'manifold') inHandles.push('in');
       if (['filter', 'cooler', 'heater', 'throttle', 'flowMeter', 'pressureRelief', 'pressureReducing'].includes(currentNode.type)) {
          if (current.handleOut === 'out' || current.handleOut === 'T' || current.handleOut === 'A') {
              inHandles.push('in', 'P'); 
          }
       }
       if (currentNode.type === 'checkValve') {
          // Check valve does not allow backward return flow unless pressure opens it
       }
       if (currentNode.type === 'valve') {
          const subtype = currentNode.data.subtype || '5_2';
          const solA = currentNode.data.solenoidA || currentNode.data.manualOverrideA || currentNode.data.solA_electricalActive;
          const solB = currentNode.data.solenoidB || currentNode.data.manualOverrideB || currentNode.data.solB_electricalActive;
          
          if (subtype === '5_2' || subtype === '4_2') {
             if (current.handleOut === 'T' || current.handleOut === 'in') {
                if (solA) inHandles.push('B'); else inHandles.push('A');
             }
             if (current.handleOut === 'Ex') {
                if (solA) inHandles.push('B');
             }
             if (current.handleOut === 'Eb') {
                if (!solA) inHandles.push('A');
             }
          } else if (subtype.includes('4_3') || subtype === '5_3') {
             if (current.handleOut === 'T' || current.handleOut === 'in') {
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
             if (current.handleOut === 'Ex' || current.handleOut === 'T' || current.handleOut === 'in') {
                if (!solA) inHandles.push('A');
             }
          }
       }

       for (const ih of inHandles) {
          const connectedEdges = edges.filter(e => 
             (e.target === current.id && e.targetHandle === ih) || 
             (e.source === current.id && e.sourceHandle === ih)
          );
          for (const edge of connectedEdges) {
             poweredEdgeIds.add(edge.id); // highlight return lines too!
             if (edge.target === current.id) {
                returnQueue.push({ id: edge.source, handleOut: edge.sourceHandle });
             } else {
                returnQueue.push({ id: edge.target, handleOut: edge.targetHandle });
             }
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

        const hasReturnExt = returnPorts.has(`${node.id}-extend`) || returnPorts.has(`${node.id}-A`);
        const hasReturnRet = returnPorts.has(`${node.id}-retract`) || returnPorts.has(`${node.id}-B`);

        let isExtending = false;
        let isRetracting = false;
        let regeneration = false;

        if (subtype === 'single_acting') {
           if ((isPressurizedExt || isPressurizedA)) isExtending = true;
           else if (ext > 0 && (hasReturnExt || hasReturnRet)) isRetracting = true; // spring return needs exhaust
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

    let finalNodes = nodes.map((originalNode, i) => {
      const newNode = newNodes[i];
      // Fast shallow/deep compare (data objects are small)
      if (JSON.stringify(originalNode.data) !== JSON.stringify(newNode.data)) {
        return newNode;
      }
      return originalNode;
    });

    return { newNodes: finalNodes, poweredEdgeIds, globalShortCircuit, shortCircuitDetails };
  } catch (err) {
    console.error("Critical Engine Error Caught Internally:", err);
    if (!window.hasAlertedEngineError) {
      window.hasAlertedEngineError = true;
      alert("Engine Error: " + err.message + "\n" + err.stack);
    }
    // If anything fails, return the original nodes and empty powered edges to avoid crashing the state.
    return { newNodes: nodes, poweredEdgeIds: new Set() };
  }
}
