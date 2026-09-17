const fs = require('fs');
let text = fs.readFileSync('server.ts_fixed', 'utf8');
let lines = text.split('\n');

// Line 120
if (lines[119].includes('status: "ativo"')) lines[119] += '}';
// Line 733
if (lines[732].includes('const novoIncidente')) lines[732] = '    const novoIncidente: IncidenteRede = {';
// Let's print out lines around the errors
console.log(lines[119]);
