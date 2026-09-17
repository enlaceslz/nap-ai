const fs = require('fs');

const file = 'src/pages/MapaRede.tsx';
let content = fs.readFileSync(file, 'utf8');

// The error "API KEY REQUIRED" in mt1.google.com tiles means that Google has blocked this undocumented endpoint for web.
// We must replace it with Esri World Imagery (satellite) overlaid with Carto Positron Only Labels (for street names) OR OpenStreetMap
// For the 'hybrid' layer, let's use Esri Satellite + Carto Labels. Or just default OSM.

content = content.replace(
  /url="https:\/\/mt1\.google\.com\/vt\/lyrs=y&x=\{x\}&y=\{y\}&z=\{z\}"/g,
  'url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"'
);

content = content.replace(
  /attribution='&copy; Google Maps'/g,
  'attribution=\'&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics\''
);

fs.writeFileSync(file, content);
console.log('Fixed google maps in', file);
