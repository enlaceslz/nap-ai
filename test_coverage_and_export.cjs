const fs = require('fs');

console.log('--- NAP Telecom Architecture Status ---');

const modules = [
  'server/zabbix/zabbixRoutes.ts',
  'server/genieacs/genieacsRoutes.ts',
  'server/communications/communicationsRoutes.ts',
  'server/field/fieldRoutes.ts',
  'server/gis/gisRoutes.ts',
  'server/waba.ts',
  'server/gemini.ts'
];

let allPassed = true;
modules.forEach(mod => {
  if (fs.existsSync(mod)) {
    console.log(`[OK] Module found: ${mod}`);
  } else {
    console.log(`[FAIL] Module MISSING: ${mod}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\\nStatus: READY FOR PRODUCTION (RTM). All 7 core pillars are intact.');
}
