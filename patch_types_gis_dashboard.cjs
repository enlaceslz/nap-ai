const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

text = text.replace(
  'vendor?: string;\n    rx_power?: number;',
  'vendor?: string;\n    rx_power?: number;\n    cable_type?: string;\n    fibers_count?: number;'
);

fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
console.log('Fixed typescript interface in GisDashboard');
