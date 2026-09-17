const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('aiRoutes')) {
  text = text.replace(
    'import gisRoutes from "./server/gis/gisRoutes";',
    'import gisRoutes from "./server/gis/gisRoutes";\nimport aiRoutes from "./server/ai/aiRoutes";'
  );

  text = text.replace(
    'app.use("/api/gis", gisRoutes);',
    'app.use("/api/gis", gisRoutes);\napp.use("/api/ai", aiRoutes);'
  );

  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('AI routes patched in server.ts');
} else {
  console.log('Already patched');
}
