const fs = require('fs');

let code = fs.readFileSync('src/pages/MapaRede.tsx', 'utf8');

// Update state definition
code = code.replace(
  "const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'streets'>('dark');",
  "const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'streets' | 'hybrid'>('hybrid');"
);

// Add Hybrid Button
const streetsBtnRegex = /<button[\s\S]*?onClick=\{\(\) => setMapLayer\('streets'\)\}[\s\S]*?<\/button>/;
const match = code.match(streetsBtnRegex);
if(match) {
  const hybridBtn = `
            <button
              type="button"
              onClick={() => setMapLayer('hybrid')}
              className={\`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer \${
                mapLayer === 'hybrid' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }\`}
              title="Visão Híbrida (Satélite + Ruas)"
            >
              <Globe size={13} />
              <span>Híbrido</span>
            </button>`;
            
  code = code.replace(match[0], hybridBtn + '\n            ' + match[0]);
}

// Add Hybrid TileLayer
const satelliteLayerRegex = /\{mapLayer === 'satellite' && \([\s\S]*?<\/TileLayer>[\s\S]*?\)\}/;
const satMatch = code.match(satelliteLayerRegex);
if(satMatch) {
  const hybridLayer = `
          {mapLayer === 'hybrid' && (
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}`;
  code = code.replace(satMatch[0], hybridLayer + '\n' + satMatch[0]);
}

// ensure Globe icon is imported
if (!code.includes('Globe')) {
    code = code.replace("Search,", "Search, Globe,");
}

fs.writeFileSync('src/pages/MapaRede.tsx', code, 'utf8');
console.log('Hybrid layer patched successfully.');
