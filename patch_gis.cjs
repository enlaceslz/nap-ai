const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

text = text.replace(
  '{feature.properties.status?.toUpperCase()}',
  '{typeof feature.properties.status === "string" ? feature.properties.status.toUpperCase() : "DESCONHECIDO"}'
);

fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
console.log('Fixed GisDashboard.tsx toUpperCase');
