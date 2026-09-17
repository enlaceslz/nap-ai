const fs = require('fs');
let text = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf8');

text = text.replace(
  /label="Credenciais Nativas"/g,
  'label="Guias & Endpoints"'
);

fs.writeFileSync('src/pages/SuperAdmin.tsx', text, 'utf8');
console.log('Fixed label in SuperAdmin.tsx');
