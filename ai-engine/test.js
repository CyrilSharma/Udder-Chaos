const { spawn } = require('node:child_process');

test('Verify Init Method', async () => {
    const ai = spawn('cpp/Main');
    ai.stdin.setEncoding('utf-8');
    ai.stdin.write('INIT\n');
    ai.stdin.write('game_id: 2\n');
    ai.stdin.write('hand_size: 2\n');
    ai.stdin.write('round_length: 5\n');
    ai.stdin.write('ncards: 18\n');
    ai.stdin.write('seed: 1102\n');
    ai.stdin.write('END\n');
    ai.stdin.end();
    
    let success = false;
    await new Promise((resolve) => {
        ai.on('exit', (code) => {
            expect(success);
            resolve();
        });

        ai.stdout.on('data', (data) => {
            let str = data.toString('utf8');
            success = str === "SUCCESS";
        });

        ai.stderr.on('data', (info) => {
            console.log(info.toString('utf8'));
        });
    });
});

test('Verify Get Method', async () => {
    const ai = spawn('cpp/Main');
    ai.stdin.setEncoding('utf-8');
    ai.stdin.write('INIT\n');
    ai.stdin.write('game_id: 2\n');
    ai.stdin.write('hand_size: 2\n');
    ai.stdin.write('round_length: 5\n');
    ai.stdin.write('ncards: 18\n');
    ai.stdin.write('seed: 1102\n');
    ai.stdin.write('END\n');
    ai.stdin.write('GET\n');
    ai.stdin.write('game_id: 2\n');
    ai.stdin.write('END\n');
    ai.stdin.end();
    
    let success = false;
    await new Promise((resolve) => {
        ai.on('exit', (code) => {
            expect(success);
            resolve();
        });

        ai.stdout.on('data', (data) => {
            let str = data.toString('utf8');
            console.log(str);
            success = str === "SUCCESS";
        });

        ai.stderr.on('data', (info) => {
            console.log(info.toString('utf8'));
        });
    });
});

