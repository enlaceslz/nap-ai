const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
code = code.replace(
  /\{?\/\* Coluna Esquerda: Lista de OSs \*\/\}/g,
  `</div>\n{/* Coluna Esquerda: Lista de OSs */}`
);
fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
