const fs = require('fs');
let text = fs.readFileSync('server/genieacs/genieacsRoutes.ts', 'utf8');

text = text.replace(
  'res.json(formatted);',
  'res.json({ success: true, devices: formatted });'
);

text = text.replace(
  'res.json(genieService.getMockDevices());',
  'res.json({ success: true, devices: genieService.getMockDevices() });'
);

fs.writeFileSync('server/genieacs/genieacsRoutes.ts', text, 'utf8');
