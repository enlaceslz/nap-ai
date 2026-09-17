const fs = require('fs');
let text = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

text = text.replace(
  "status: 'pendente' }",
  "status: 'pendente', prioridade: 'Alta', horario_agendado: '14:00', observacoes: 'Mock' }"
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', text, 'utf8');
console.log('Fixed OSItem mock missing properties');
