const fs = require('fs');
let code = fs.readFileSync('src/services/helpdeskApi.ts', 'utf8');

code = code.replace(
  "id: t.external_id || t.id.toString(),",
  "id: t.external_id || t.id?.toString() || 'sem-id',"
);

fs.writeFileSync('src/services/helpdeskApi.ts', code, 'utf8');
console.log('Patched API');
