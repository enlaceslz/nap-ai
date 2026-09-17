const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');
schema = schema.replace(
  "import { pgTable, serial, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';",
  "import { pgTable, serial, text, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';"
);

fs.writeFileSync('src/db/schema.ts', schema, 'utf8');
console.log('Fixed schema.ts import');
