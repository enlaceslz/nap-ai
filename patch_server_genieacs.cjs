const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

const startIndex = text.indexOf('// --- MÓDULO TELEMETRIA GENIEACS (TR-069 / CWMP NBI) ---');
const endIndex = text.indexOf('// --- MONITOR DE SINCRONIZAÇÃO EM TEMPO REAL (ERP & GENIEACS) ---');

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  text = text.substring(0, startIndex) + text.substring(endIndex);
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('GenieACS monolithic block successfully removed from server.ts');
} else {
  console.log('Could not find boundaries for GenieACS block');
}
