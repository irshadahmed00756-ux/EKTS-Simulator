// src/simulation/engine.js
// Advanced graph traversal for evaluating electrical logic and fluid states.

export function evaluateCircuit(nodes, edges) {
  try {
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
      }
      if (node.type === 'ssr') {
        defaultData.isActive = false;
      }
      if (node.type === 'valve') {
        defaultData.solenoidA = false;
        defaultData.solenoidB = false;
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

    let poweredEdgeIds = new Set();
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
    let queue = powerNodes.map(n => ({ id: n.id, voltage: n.data.subtype || '24v_dc', handleIn: 'internal' }));
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
        outHandles.push('out');
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
          else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('in_')) {
            outHandles.push(handleIn.replace('in_', 'out_'));
          }
        }
      }

      if (currentNode.type === 'sensor') {
         if (currentNode.data.isTriggered) {
            if (handleIn === 'in' || handleIn === 'in_no') outHandles.push(handleIn === 'in' ? 'out' : 'out_no');
         } else {
            if (handleIn === 'in_nc') outHandles.push('out_nc');
         }
      }

      if (currentNode.type === 'timer') {
         if (handleIn === 'A1') {
            const requiredSubtype = String(currentNode.data.subtype || '24v_dc');
            // Extract voltage from subtype if possible, fallback to 220v_ac
            const reqMatch = requiredSubtype.match(/\d+/);
            const curMatch = currentVoltage.match(/\d+/);
            const reqNum = reqMatch ? reqMatch[0] : (requiredSubtype.includes('24v') ? '24' : '220');
            const curNum = curMatch ? curMatch[0] : null;
            
            if ((reqNum && reqNum === curNum) || 
                (requiredSubtype.includes('dc') && currentVoltage.includes('dc')) ||
                (requiredSubtype.includes('ac') && currentVoltage.includes('ac')) || 
                (!requiredSubtype.includes('v'))) { // If no voltage specified in subtype, assume it works
               currentNode.data.isPowered = true;
               outHandles.push('com'); // Com provides trigger power
            } else {
               currentNode.data.burned = true;
            }
         }
         if (handleIn === 'start') currentNode.data.startSignal = true;
         if (handleIn === 'reset') currentNode.data.resetSignal = true;
         
         // Fix: Use previous tick's state for contacts to prevent BFS evaluation order bugs
         const originalTimerNode = nodes.find(n => n.id === currentId) || currentNode;
         const isDone = originalTimerNode.data.isDone;
         if (handleIn === 'contact_com') {
             if (isDone) outHandles.push('no');
             if (!isDone) outHandles.push('nc');
         }
      }

      if (currentNode.type === 'ssr') {
         if (handleIn === 'A1') {
             currentNode.data.isActive = true;
         }
         if (currentNode.data.isActive && handleIn === 'in') outHandles.push('out');
      }

      if (currentNode.type === 'relayCoil') {
         if (handleIn === 'A1') {
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
         
         // Fix: Use previous tick's state for contacts to prevent BFS evaluation order bugs
         const originalCoilNode = nodes.find(n => n.id === currentId) || currentNode;
         const isCoilActive = originalCoilNode.data.isActive;
         
         if (isCoilActive && handleIn === 'in_no') outHandles.push('out_no');
         if (!isCoilActive && handleIn === 'in_nc') outHandles.push('out_nc');
      }

      if (currentNode.type === 'relayContact') {
         const isCoilActive = activeCoilLabels.has(currentNode.data.label);
         const subtype = currentNode.data.subtype || 'no';
         
         let isClosed = false;
         if (subtype === 'no' && isCoilActive) isClosed = true;
         if (subtype === 'nc' && !isCoilActive) isClosed = true;
         
         currentNode.data.isActive = isClosed; // Just for visual feedback if needed
         
         if (isClosed) {
            if (handleIn === 'in') outHandles.push('out');
            else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('in_')) {
               outHandles.push(handleIn.replace('in_', 'out_'));
            } else if (handleIn && typeof handleIn === 'string' && handleIn.startsWith('L')) {
               outHandles.push(handleIn.replace('L', 'T'));
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
         // Power reached ground directly! Short circuit!
         currentNode.data.shortCircuit = true;
      }

      for (const oh of outHandles) {
         const outgoingEdges = (edges || []).filter(e => e.source === currentId && e.sourceHandle === oh);
         for (const edge of outgoingEdges) {
            poweredEdgeIds.add(edge.id);
            queue.push({ id: edge.target, voltage: currentVoltage, handleIn: edge.targetHandle });
         }
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
          let triggerMode = node.data.triggerMode || 'signal_on';

          if (resetSignal) {
             isTiming = false;
             ticks = 0;
             isDone = false;
          } else if (subtype.includes('ton') || subtype.includes('star_delta')) {
             if (isPowered) {
                if (triggerMode === 'power_on') {
                   // Always start timing when powered, until done
                   if (!isDone) isTiming = true;
                } else {
                   // Signal mode (requires Start pulse)
                   if (startSignal) {
                      isTiming = true; // Latch the start signal
                   }
                }
             }
             
             if (isPowered && isTiming) {
                if (ticks < targetTicks) ticks++; 
                if (ticks >= targetTicks) {
                   isDone = true;
                   isTiming = false; // Stop timing once done
                }
             } else if (!isPowered) {
                // Timer resets if main power is lost
                isTiming = false;
                ticks = 0;
                isDone = false;
             }
          } else if (subtype.includes('tof')) {
             // For OFF-Delay:
             // If Power ON mode: Output turns ON when powered. Starts timing when power is LOST (using battery/capacitor) or signal lost.
             // Wait, standard TOF with Power ON mode usually means it requires continuous power, and triggering is based on the input signal.
             // Let's just use the startSignal for TOF regardless of mode, since TOF implies a trigger drop.
             // But if user sets 'power_on', we can treat 'isPowered' as the trigger itself!
             const effectiveStart = triggerMode === 'power_on' ? true : startSignal;
             
             if (isPowered && effectiveStart) {
                ticks = targetTicks;
                isDone = true;
                isTiming = false;
             } else if (isPowered && !effectiveStart && isDone) {
                isTiming = true;
                if (ticks > 0) ticks--;
                if (ticks <= 0) {
                   isDone = false;
                   isTiming = false;
                }
             } else if (!isPowered) {
                isTiming = false;
                ticks = 0;
                isDone = false;
             }
          }

          // UI feedback
          node.data.isActive = isTiming || startSignal || (triggerMode === 'power_on' && isPowered && !isDone);

          return { ...node, data: { ...node.data, ticks, isDone, isTiming } };
       }
       return node;
    });

    const fluidSources = newNodes.filter(n => n.type === 'compressor' || n.type === 'pump');
    
    let fluidQueue = [];
    fluidSources.forEach(n => fluidQueue.push({ id: n.id, handleIn: 'internal' }));
    let fluidVisited = new Set();

    while (fluidQueue.length > 0) {
      const current = fluidQueue.shift();
      const currentId = current.id;
      const handleIn = current.handleIn;

      const vKey = `${currentId}-${handleIn}`;
      if (fluidVisited.has(vKey)) continue;
      fluidVisited.add(vKey);

      const currentNode = getNode(currentId);
      if (!currentNode) continue;

      let outHandles = [];

      if (currentNode.type === 'compressor' || currentNode.type === 'pump') {
        outHandles.push('out');
      }

      if (currentNode.type === 'junction') {
        outHandles.push('out');
      }

      if (currentNode.type === 'valve') {
        const subtype = currentNode.data.subtype || '5_2';
        const solA = currentNode.data.solenoidA;
        const solB = currentNode.data.solenoidB;
        
        console.log("Evaluating Valve:", currentId, "Subtype:", subtype, "solA:", solA, "handleIn:", handleIn);

        if (subtype === '5_2' || subtype === '4_2') {
          if (solA) outHandles.push('A');
          else outHandles.push('B'); 
        } else if (subtype === '4_3_closed' || subtype === '5_3') {
          if (solA && !solB) outHandles.push('A');
          else if (solB && !solA) outHandles.push('B');
        } else if (subtype === '4_3_open') {
          if (solA && !solB) outHandles.push('A');
          else if (solB && !solA) outHandles.push('B');
        } else if (subtype === '4_3_tandem') {
          if (solA && !solB) outHandles.push('A');
          else if (solB && !solA) outHandles.push('B');
        } else if (subtype === '4_3_float') {
          if (solA && !solB) outHandles.push('A');
          else if (solB && !solA) outHandles.push('B');
        } else if (subtype === '3_2') {
          if (solA) outHandles.push('A');
        }
      }

      if (currentNode.type === 'cylinder') {
         if (handleIn === 'extend') currentNode.data.isExtending = true;
         if (handleIn === 'retract') currentNode.data.isRetracting = true;
      }
      
      if (currentNode.type === 'motorHyd') {
         if (handleIn === 'in' || handleIn === 'A' || handleIn === 'B') {
            currentNode.data.isActive = true;
         }
      }

      for (const oh of outHandles) {
         const outgoingEdges = (edges || []).filter(e => e.source === currentId && e.sourceHandle === oh);
         for (const edge of outgoingEdges) {
            poweredEdgeIds.add(edge.id);
            fluidQueue.push({ id: edge.target, handleIn: edge.targetHandle });
         }
      }
    }

    newNodes = newNodes.map(node => {
      if (node.type === 'cylinder') {
        let ext = node.data.extension || 0;
        const subtype = node.data.subtype || 'double_acting';
        
        let isExtending = node.data.isExtending;
        let isRetracting = node.data.isRetracting;

        if (subtype === 'single_acting' && !isExtending) {
          isRetracting = true; 
        }

        if (isExtending && !isRetracting && ext < 100) ext += 5;
        else if (isRetracting && !isExtending && ext > 0) ext -= 5;
        
        ext = Math.max(0, Math.min(100, ext));
        return { ...node, data: { ...node.data, extension: ext } };
      }
      return node;
    });

    // OPTIMIZATION: Only return new object references for nodes that actually changed state.
    // This prevents React Flow from destroying and recreating node internals every 50ms.
    let finalNodes = nodes.map((originalNode, i) => {
      const newNode = newNodes[i];
      // Fast shallow/deep compare (data objects are small)
      if (JSON.stringify(originalNode.data) !== JSON.stringify(newNode.data)) {
        return newNode;
      }
      return originalNode;
    });

    return { newNodes: finalNodes, poweredEdgeIds };
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
