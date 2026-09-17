const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

text = text.replace(
  'import { setupGenieacsRoutes } from "./server/genieacs/genieacsRoutes";',
  'import { setupGenieacsRoutes } from "./server/genieacs/genieacsRoutes";\nimport { GenieacsService } from "./server/genieacs/genieacsService";'
);

// We replace `genieacsDevices_mock` usages with `GenieacsService.getInstance().getMockDevices()`
text = text.replace(/genieacsDevices_mock/g, 'GenieacsService.getInstance().getMockDevices()');

fs.writeFileSync('server.ts', text, 'utf8');
