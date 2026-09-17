const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

const hook = `if (!selectedOS && data.ordens.length > 0) {
          setSelectedOS(data.ordens[0]);
        }`;

const inject = `if (!selectedOS && data.ordens.length > 0) {
          // Apenas auto-seleciona em desktop para preservar a lista em mobile
          if (window.innerWidth >= 1024) {
            setSelectedOS(data.ordens[0]);
          }
        }`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
console.log("Auto-select patched");
