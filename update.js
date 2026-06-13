const fs = require('fs');
const engineFile = 'src/simulation/engine.js';
const fluidFile = 'fluid.js';
let content = fs.readFileSync(engineFile, 'utf8');
const fluidCode = fs.readFileSync(fluidFile, 'utf8');

const marker = "const fluidSources = newNodes.filter(n => n.type === 'compressor' || n.type === 'pump');";
const parts = content.split(marker);

if (parts.length === 2) {
  const endMarker = "let finalNodes = nodes.map((originalNode, i) => {";
  const endParts = parts[1].split(endMarker);
  
  if (endParts.length === 2) {
    fs.writeFileSync(engineFile, parts[0] + fluidCode + "\n    " + endMarker + endParts[1]);
    console.log("Successfully updated engine.js");
  } else {
    console.log("Could not find end marker");
  }
} else {
  console.log("Could not find start marker");
}
