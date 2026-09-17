const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const replacement = text + '\n}\nstartServer();\n';

fs.writeFileSync('server.ts', replacement);
console.log("Added brace and startServer back");
