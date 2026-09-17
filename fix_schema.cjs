const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
schema = schema.replace(
  "prioridade: serial('prioridade')",
  "prioridade: integer('prioridade')"
);

fs.writeFileSync('src/db/schema.ts', schema, 'utf8');
console.log('Fixed schema.ts');
