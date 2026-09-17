const fs = require('fs');

const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const targetImport = `import { setupGeminiRoutes } from "./server/gemini_routes.js";`;
const replacementImport = `import { setupGeminiRoutes } from "./server/gemini_routes.js";
import { setupPaymentRoutes } from "./server/payments.js";`;

const targetSetup = `setupGeminiRoutes(app, { systemConfig, registrarAuditoria });`;
const replacementSetup = `setupGeminiRoutes(app, { systemConfig, registrarAuditoria });
setupPaymentRoutes(app);`;

if (!content.includes('setupPaymentRoutes')) {
  content = content.replace(targetImport, replacementImport);
  content = content.replace(targetSetup, replacementSetup);
  fs.writeFileSync(file, content);
  console.log('Updated server.ts with payment routes');
} else {
  console.log('Payment routes already in server.ts');
}
