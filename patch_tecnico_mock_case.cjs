const fs = require('fs');
let text = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

text = text.replace(
  "prioridade: 'Alta'",
  "prioridade: 'alta'"
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', text, 'utf8');
console.log('Fixed OSItem mock lowercase property');
