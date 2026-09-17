const fs = require('fs');
let text = fs.readFileSync('src/pages/MapaRede.tsx', 'utf8');

text = text.replace(
  '{match.status.toUpperCase()}',
  '{typeof match.status === "string" ? match.status.toUpperCase() : "DESCONHECIDO"}'
);

text = text.replace(
  '{os.prioridade.toUpperCase()}',
  '{typeof os.prioridade === "string" ? os.prioridade.toUpperCase() : "NORMAL"}'
);

text = text.replace(
  '{selectedOnt.status.toUpperCase()}',
  '{typeof selectedOnt.status === "string" ? selectedOnt.status.toUpperCase() : "DESCONHECIDO"}'
);

text = text.replace(
  '{selectedOS.prioridade.toUpperCase()}',
  '{typeof selectedOS.prioridade === "string" ? selectedOS.prioridade.toUpperCase() : "NORMAL"}'
);

fs.writeFileSync('src/pages/MapaRede.tsx', text, 'utf8');
console.log('Fixed MapaRede.tsx toUpperCase issues safely.');
