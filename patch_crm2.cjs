const fs = require('fs');

let crm = fs.readFileSync('server/crm/crmService.ts', 'utf8');
crm = crm.replace(
  /console.error\("DB error in getDeals, using empty array", e\);/g,
  'console.error("DB error in getDeals, using empty array", e);'
);

crm = crm.replace(
  /export async function addDeal/g, // wait it's a class
  ''
);

// I will just edit the catch in crmRoutes.ts instead
let routes = fs.readFileSync('server/crm/crmRoutes.ts', 'utf8');
routes = routes.replace(
  /res\.status\(500\)\.json\(\{ error: 'Erro ao criar deal' \}\);/g,
  'console.error("Deal creation error:", e); res.status(500).json({ error: "Erro ao criar deal", details: e.message });'
);

fs.writeFileSync('server/crm/crmRoutes.ts', routes, 'utf8');
console.log('Patched crmRoutes.ts for better error logging');
