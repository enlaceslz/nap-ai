const fs = require('fs');

let uiText = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
uiText = uiText.replace(
  /observacoes: o\.problem/g,
  "observacoes: o.problem,\n          horario_agendado: o.scheduled_time || 'Hoje'"
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', uiText, 'utf8');
console.log('Fixed TecnicoCampo.tsx required property');
