const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const replacement = text.replace(/\}[\s\n]*startServer\(\);[\s\n]*$/, '');

fs.writeFileSync('server.ts', replacement);
console.log("Removed startServer function call");
