const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

text = text.replace(/export default app;\nexport default app;/g, 'export default app;');

fs.writeFileSync('server.ts', text);
