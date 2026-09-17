const fs = require('fs');
let text = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf8');

text = text.replace(
  "{testResults['asterisk-ari'].status.toUpperCase()}",
  "{typeof testResults['asterisk-ari'].status === 'string' ? testResults['asterisk-ari'].status.toUpperCase() : 'DESCONHECIDO'}"
);

fs.writeFileSync('src/pages/SuperAdmin.tsx', text, 'utf8');
console.log('Fixed toUpperCase in SuperAdmin.tsx');
