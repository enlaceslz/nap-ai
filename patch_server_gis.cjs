const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

text = text.replace(
  'setupOltRoutes(app, { registrarAuditoria });',
  'setupOltRoutes(app, { registrarAuditoria });\napp.use("/api/gis", gisRoutes);'
);

fs.writeFileSync('server.ts', text, 'utf8');
console.log('GIS routes patched correctly');
