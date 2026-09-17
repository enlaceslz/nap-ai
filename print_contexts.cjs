const fs = require('fs');

let lines = fs.readFileSync('server.ts_reverted', 'utf8').split('\n');
let errors = fs.readFileSync('errors.txt', 'utf8').split('\n').filter(l => l.length > 0);

let out = [];
for (let err of errors) {
    let match = err.match(/server\.ts\((\d+),\d+\): (.*)/);
    if (match) {
        let lineNum = parseInt(match[1]) - 1;
        let errMsg = match[2];
        out.push(`\n=== Error at Line ${lineNum+1}: ${errMsg} ===`);
        for (let i = Math.max(0, lineNum - 10); i <= Math.min(lines.length - 1, lineNum + 2); i++) {
            out.push(`${i+1}: ${lines[i]}`);
        }
    }
}
fs.writeFileSync('contexts.txt', out.join('\n'));
