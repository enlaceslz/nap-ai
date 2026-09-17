const fs = require('fs');
let code = fs.readFileSync('src/pages/MapaRede.tsx', 'utf8');

// fix the Globe import
if (!code.includes('Globe')) {
    code = code.replace("Search } from 'lucide-react';", "Search, Globe } from 'lucide-react';");
}

// Add the TileLayer for hybrid if missing
if (!code.includes("mapLayer === 'hybrid' && (")) {
  const target = "{mapLayer === 'dark' && (";
  const replacement = `
          {mapLayer === 'hybrid' && (
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}
          {mapLayer === 'dark' && (`;
          
  code = code.replace(target, replacement);
}

fs.writeFileSync('src/pages/MapaRede.tsx', code, 'utf8');
console.log('Hybrid fixed.');
