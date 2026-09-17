const fs = require('fs');
let text = fs.readFileSync('src/components/Layout.tsx', 'utf8');

text = text.replace(
  /NAP GIS \(Google\)/g,
  "NAP GIS"
);

fs.writeFileSync('src/components/Layout.tsx', text, 'utf8');
console.log('Layout patched');
