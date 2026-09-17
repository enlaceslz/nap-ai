const fs = require('fs');
fs.writeFileSync('test_status.ts', `
  const config = { telefonia: { troncosSip: [{ status: 'ativo' }] } };
`);
