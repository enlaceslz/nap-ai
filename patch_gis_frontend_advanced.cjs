const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

if (!text.includes('isViabilityMode')) {
  // Insert useMapEvents import
  text = text.replace(
    "import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';",
    "import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';"
  );
  
  // States
  text = text.replace(
    "const [isTracing, setIsTracing] = useState(false);",
    "const [isTracing, setIsTracing] = useState(false);\n  const [isViabilityMode, setIsViabilityMode] = useState(false);\n  const [viabilityResult, setViabilityResult] = useState<any>(null);\n  const [viabilityPoint, setViabilityPoint] = useState<any>(null);\n  const [impactReport, setImpactReport] = useState<any>(null);"
  );

  // Viability Component Hook
  const viabilityComp = `
  const ViabilityTool = () => {
    useMapEvents({
      click(e) {
        if (!isViabilityMode) return;
        setViabilityPoint(e.latlng);
        fetch('/api/gis/topology/viability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng })
        })
        .then(res => res.json())
        .then(data => {
          if(data.success) {
            setViabilityResult(data);
          }
        });
      },
    });
    return null;
  };
  `;
  
  text = text.replace(
    "const handleTracePath = (featureId: string) => {",
    viabilityComp + "\n  const handleTracePath = (featureId: string) => {"
  );

  const impactLogic = `
  const handleSimulateImpact = (featureId: string) => {
    fetch(\`/api/gis/topology/impact/\${featureId}\`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImpactReport(data);
        }
      });
  };
  `;
  text = text.replace(
    "const clearTrace = () => {",
    impactLogic + "\n  const clearTrace = () => {"
  );

  // Extend UI Buttons
  const viabilityBtn = `
          <button 
            onClick={() => { setIsViabilityMode(!isViabilityMode); setViabilityResult(null); setViabilityPoint(null); }}
            className={\`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 \${isViabilityMode ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white'}\`}
          >
            <Search size={14} /> Viabilidade (Clique no Mapa)
          </button>
  `;
  text = text.replace(
    "<button \n            onClick={() => setActiveLayer('all')}",
    viabilityBtn + "\n          <button \n            onClick={() => setActiveLayer('all')}"
  );

  const clearViabilityUI = `
          {viabilityResult && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl z-[1000] min-w-[300px]">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-bold">Análise de Viabilidade (Parte 03)</h3>
                <button onClick={() => {setViabilityResult(null); setViabilityPoint(null);}} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              {viabilityResult.viable ? (
                <div>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded text-sm font-semibold mb-3">VIÁVEL - Instalação Permitida</div>
                  <p className="text-slate-300 text-xs mb-1"><strong>Distância Estimada (Drop):</strong> {viabilityResult.distance_meters} metros</p>
                  <p className="text-slate-300 text-xs mb-1"><strong>Conectar na CTO:</strong> {viabilityResult.cto.properties.name}</p>
                  <p className="text-slate-300 text-xs"><strong>Portas Livres:</strong> {viabilityResult.cto.properties.capacity - viabilityResult.cto.properties.occupied}</p>
                </div>
              ) : (
                <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded text-sm font-semibold">INVIÁVEL - Sem CTOs com porta livre num raio de 400m.</div>
              )}
            </div>
          )}
          
          {impactReport && (
             <div className="absolute top-4 right-4 bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl z-[1000] w-[350px] max-h-[80%] overflow-y-auto">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-bold text-red-400">🚨 Relatório de Rompimento (Parte 03)</h3>
                <button onClick={() => setImpactReport(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              <p className="text-slate-300 text-xs mb-4">Simulação de rompimento no elemento <span className="font-mono">{impactReport.root_id}</span> detectou impacto em <strong className="text-white">{impactReport.impacted_nodes_count} assinantes (ONTs)</strong>.</p>
              
              <div className="space-y-2">
                {impactReport.impacted_features.map((f: any) => (
                  <div key={f.id} className="bg-slate-800 p-2 rounded flex items-center justify-between border border-slate-700">
                     <span className="text-xs font-semibold text-slate-200">{f.properties.name}</span>
                     <span className="text-[10px] text-red-400 font-mono">OFFLINE</span>
                  </div>
                ))}
              </div>
            </div>
          )}
  `;

  text = text.replace(
    "</MapContainer>\n      </div>",
    "<ViabilityTool />\n          {viabilityPoint && viabilityResult && viabilityResult.cto && (<Polyline positions={[[viabilityPoint.lat, viabilityPoint.lng], [viabilityResult.cto.geometry.coordinates[1], viabilityResult.cto.geometry.coordinates[0]]]} color=\"#3b82f6\" weight={3} dashArray=\"5, 10\" />)}\n          {viabilityPoint && <Marker position={viabilityPoint} icon={createCustomIcon('layer-clientes')} />}\n        </MapContainer>\n        " + clearViabilityUI + "\n      </div>"
  );
  
  // Button in cable popups
  text = text.replace(
    "<button onClick={() => handleTracePath(feature.id)} disabled={isTracing} className=\"w-full bg-slate-900 text-white text-xs py-1.5 rounded\">Rastrear Rota</button>\n                        </div>",
    "<button onClick={() => handleTracePath(feature.id)} disabled={isTracing} className=\"w-full bg-slate-900 text-white text-xs py-1.5 rounded mb-1\">Rastrear Rota Integrada</button>\n                          <button onClick={() => handleSimulateImpact(feature.id)} className=\"w-full bg-red-900/50 text-red-400 border border-red-800 text-xs py-1.5 rounded hover:bg-red-800 hover:text-white\">Simular Rompimento</button>\n                        </div>"
  );

  // import X icon
  text = text.replace(
    "import { Search, Layers, Server, MapPin, Wifi } from 'lucide-react';",
    "import { Search, Layers, Server, MapPin, Wifi, X } from 'lucide-react';"
  );
  
  fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
  console.log('GisDashboard.tsx patched with advanced UI');
} else {
  console.log('Already patched');
}
