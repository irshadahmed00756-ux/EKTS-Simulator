const { spawn } = require('child_process');
const fs = require('fs');

const surge = spawn('npx', ['surge', './dist', 'ekts-pro-simulator.surge.sh'], { shell: true });

const logStream = fs.createWriteStream('surge_log.txt', { flags: 'a' });

surge.stdout.on('data', (data) => {
    const output = data.toString();
    logStream.write(output);
    
    if (output.includes('email:')) {
        surge.stdin.write('circuit.simulator.gemini@gmail.com\n');
    }
    if (output.includes('password:')) {
        surge.stdin.write('Gemini12345!\n');
    }
});

surge.stderr.on('data', (data) => {
    logStream.write('ERR: ' + data.toString());
});

surge.on('close', (code) => {
    logStream.write(`Surge process exited with code ${code}\n`);
    logStream.end();
});
