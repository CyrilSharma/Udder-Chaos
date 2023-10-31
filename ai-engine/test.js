const { spawn } = require('node:child_process');
const test = spawn('cpp/Main');

test.stdin.setEncoding('utf-8');
test.stdin.write('206729834823\n');

test.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

test.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

test.on('close', (code) => {
  console.log("Child exited!");
}); 