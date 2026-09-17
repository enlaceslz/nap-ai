const fs = require('fs');

let lines = fs.readFileSync('server.ts_patched', 'utf8').split('\n');
const errors = fs.readFileSync('lint_patched.txt', 'utf8').split('\n');

let printed = new Set();
for (let error of errors) {
    let match = error.match(/server\.ts\((\d+),/);
    if (match) {
        let lineNum = parseInt(match[1]) - 1;
        if (!printed.has(lineNum)) {
            console.log(`\n--- ERROR AT LINE ${lineNum + 1} ---`);
            for (let i = Math.max(0, lineNum - 2); i <= Math.min(lines.length - 1, lineNum + 1); i++) {
                console.log(`${i+1}: ${lines[i]}`);
            }
            printed.add(lineNum);
        }
    }
}
