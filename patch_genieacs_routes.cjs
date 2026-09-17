const fs = require('fs');
let text = fs.readFileSync('server/genieacs/genieacsRoutes.ts', 'utf8');

text = text.replace(
  'const formatted = rawDevices.map(mapGenieAcsDeviceToAppFormat);',
  'const formatted = (rawDevices as any[]).map(mapGenieAcsDeviceToAppFormat);'
);

text = text.replace(
  'const rawDevice = rawDevices && rawDevices.length > 0 ? rawDevices[0] : null;',
  'const rawDevice = rawDevices && (rawDevices as any[]).length > 0 ? (rawDevices as any[])[0] : null;'
);

fs.writeFileSync('server/genieacs/genieacsRoutes.ts', text, 'utf8');
