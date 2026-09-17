const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

text = text.replace(
  'cable_type?: string;\n    fibers_count?: number;',
  'cable_type?: string;\n    fibers_count?: number;\n    zabbix_trigger?: string;'
);

fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
console.log('Fixed typescript interface in GisDashboard');
