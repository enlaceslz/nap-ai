const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupFieldRoutes')) {
  // Add import
  text = text.replace(
    'import { setupCommunicationRoutes } from "./server/communications/routes";',
    'import { setupCommunicationRoutes } from "./server/communications/routes";\nimport { setupFieldRoutes } from "./server/field/routes";'
  );

  // Add route mount below communications
  text = text.replace(
    'app.use("/api/v1/communications", setupCommunicationRoutes());',
    'app.use("/api/v1/communications", setupCommunicationRoutes());\n  app.use("/api/v1/field", setupFieldRoutes());'
  );
  
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Patched server.ts with Field Service routes.');
} else {
  console.log('Field Service routes already present.');
}
