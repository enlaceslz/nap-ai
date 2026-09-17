const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupCommunicationRoutes')) {
  // Add import
  text = text.replace(
    'import { setupCorrelationRoutes } from "./server/correlation/routes";',
    'import { setupCorrelationRoutes } from "./server/correlation/routes";\nimport { setupCommunicationRoutes } from "./server/communications/routes";'
  );

  // Add route mount
  text = text.replace(
    '// Event Engine & Correlation',
    '// Communications Hub\n  app.use("/api/v1/communications", setupCommunicationRoutes());\n\n  // Event Engine & Correlation'
  );
  
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Patched server.ts with Communications routes.');
} else {
  console.log('Communications routes already present.');
}
