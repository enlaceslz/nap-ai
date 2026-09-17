const fs = require('fs');

let uiText = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
uiText = uiText.replace(
  /tipo: o\.priority === 'critical' \? 'Reparo' : 'Instalacao',/g,
  "tipo: (o.priority === 'critical' ? 'Reparo' : 'Instalacao') as 'Instalacao' | 'Reparo' | 'Migracao' | 'Retirada',"
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', uiText, 'utf8');
console.log('Fixed enum typing properly on TecnicoCampo.tsx');
