const fs = require('fs');
let text = fs.readFileSync('server.ts_fixed', 'utf8');

text = text.replace(/status: "ativo"[\s\n]*\],/m, 'status: "ativo" } ],');

fs.writeFileSync('server.ts_patched', text);
