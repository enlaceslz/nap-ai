const fs = require('fs');
const ui = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
if (ui.includes('as \'Instalacao\' | \'Reparo\' | \'Migracao\' | \'Retirada\'')) {
    console.log("Found");
} else {
    console.log("Not found");
}
