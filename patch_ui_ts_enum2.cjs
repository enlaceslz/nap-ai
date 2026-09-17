const fs = require('fs');

let uiText = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
uiText = uiText.replace(
  /tipo: o\.type === 'installation' \? 'Instalacao' : 'Reparo' as 'Instalacao' \| 'Reparo' \| 'Migracao' \| 'Retirada',/g,
  "tipo: (o.type === 'installation' ? 'Instalacao' : 'Reparo') as 'Instalacao' | 'Reparo' | 'Migracao' | 'Retirada',"
);

// Fallback just in case it didn't match
if (!uiText.includes('as \'Instalacao\' | \'Reparo\' | \'Migracao\' | \'Retirada\'')) {
   uiText = uiText.replace(
     /tipo: o\.type === 'installation' \? 'Instalacao' : 'Reparo',/g,
     "tipo: (o.type === 'installation' ? 'Instalacao' : 'Reparo') as 'Instalacao' | 'Reparo' | 'Migracao' | 'Retirada',"
   );
}

fs.writeFileSync('src/pages/TecnicoCampo.tsx', uiText, 'utf8');
console.log('Fixed enum typing properly on TecnicoCampo.tsx');
