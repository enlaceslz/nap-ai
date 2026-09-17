const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if (!text.includes('setupIpamRoutes')) {
  // Add import
  text = text.replace(
    'import { setupHelpDeskRoutes } from "./server/helpdesk/routes";',
    'import { setupHelpDeskRoutes } from "./server/helpdesk/routes";\nimport { setupIpamRoutes } from "./server/ipam/routes";'
  );

  // Add route mount
  text = text.replace(
    '// HelpDesk',
    '// IPAM & NSoT\n  app.use("/api/v1/ipam", setupIpamRoutes());\n\n  // HelpDesk'
  );
  
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Patched server.ts with IPAM routes.');
} else {
  console.log('IPAM routes already present.');
}
