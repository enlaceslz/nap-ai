const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

if (!text.includes('Polyline')) {
  text = text.replace(
    "import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';",
    "import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';"
  );
  
  text = text.replace(
    "const [activeLayer, setActiveLayer] = useState<string>('all');",
    "const [activeLayer, setActiveLayer] = useState<string>('all');\n  const [tracedPath, setTracedPath] = useState<string[]>([]);\n  const [isTracing, setIsTracing] = useState(false);"
  );

  const buttonTraceHtml = `
  const handleTracePath = (featureId: string) => {
    setIsTracing(true);
    fetch(\`/api/gis/topology/path/\${featureId}\`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTracedPath(data.topology_nodes);
        }
        setIsTracing(false);
      })
      .catch(e => {
        console.error('Erro no Trace:', e);
        setIsTracing(false);
      });
  };
  
  const clearTrace = () => {
    setTracedPath([]);
  };
  `;
  text = text.replace(
    "useEffect(() => {",
    buttonTraceHtml + "\n  useEffect(() => {"
  );

  text = text.replace(
    "bgColor = 'bg-fuchsia-500';",
    "bgColor = 'bg-fuchsia-500';"
  );

  // Extend colors
  text = text.replace(
    "bgColor = 'bg-blue-500';\n    borderColor = 'border-blue-700';\n  }",
    "bgColor = 'bg-blue-500';\n    borderColor = 'border-blue-700';\n  } else if (layerId === 'layer-ceo') {\n    bgColor = 'bg-orange-500';\n    borderColor = 'border-orange-700';\n  } else if (layerId === 'layer-dio') {\n    bgColor = 'bg-yellow-500';\n    borderColor = 'border-yellow-700';\n  }"
  );

  const clearBtn = `
          {tracedPath.length > 0 && (
            <button onClick={clearTrace} className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-500 ml-2">
              Limpar Rota
            </button>
          )}
  `;
  text = text.replace(
    "</div>\n      </div>",
    clearBtn + "\n        </div>\n      </div>"
  );
  
  const popupExtend = `
                      <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-500">Módulo de Origem:</span>
                        <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{feature.properties.layer_id}</span>
                      </div>
                      
                      {/* BOTAO PARTE 02 */}
                      <div className="mt-3">
                        <button 
                          className="w-full bg-slate-900 text-white text-xs py-1.5 rounded hover:bg-slate-800 flex items-center justify-center gap-1"
                          onClick={() => handleTracePath(feature.id)}
                          disabled={isTracing}
                        >
                          {isTracing ? 'Calculando...' : 'Rastrear Rota (Topologia)'}
                        </button>
                      </div>
  `;
  
  text = text.replace(
    '<div className="flex justify-between mt-2 pt-2 border-t border-slate-100">\n                        <span className="text-slate-500">Módulo de Origem:</span>\n                        <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{feature.properties.layer_id}</span>\n                      </div>',
    popupExtend
  );
  
  // Replace Marker rendering to support Polyline
  const newMapLoop = `
          {filteredFeatures.map(feature => {
            const isHighlighted = tracedPath.length > 0 && tracedPath.includes(feature.id);
            const opacity = tracedPath.length === 0 || isHighlighted ? 1 : 0.2;

            if (feature.geometry.type === 'LineString') {
              const positions = feature.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
              let pathColor = '#64748b'; // default cabo tronco
              let weight = 4;
              if (feature.properties.cable_type === 'DROP') { pathColor = '#94a3b8'; weight = 2; }
              if (isHighlighted) { pathColor = '#facc15'; weight = 5; } // Highlight amarelo

              return (
                <Polyline 
                  key={feature.id} 
                  positions={positions} 
                  color={pathColor} 
                  weight={weight}
                  opacity={opacity}
                  dashArray={feature.properties.cable_type === 'DROP' ? '5, 5' : undefined}
                >
                  <Popup className="gis-popup text-slate-900">
                    <div className="p-1 min-w-[200px]">
                      <strong className="block text-sm font-bold mb-1">{feature.properties.name}</strong>
                      <span className="text-xs text-slate-600 block mb-3 pb-2 border-b border-slate-200">{feature.properties.description}</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">Tipo:</span><span className="font-semibold">{feature.properties.cable_type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Fibras:</span><span className="font-semibold">{feature.properties.fibers_count} FO</span></div>
                        <div className="mt-3">
                          <button onClick={() => handleTracePath(feature.id)} disabled={isTracing} className="w-full bg-slate-900 text-white text-xs py-1.5 rounded">Rastrear Rota</button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              );
            }

            const [lng, lat] = feature.geometry.coordinates;
            return (
              <Marker 
                key={feature.id} 
                position={[lat, lng]}
                icon={createCustomIcon(feature.properties.layer_id, opacity)}
              >
  `;
  
  text = text.replace(
    "{filteredFeatures.map(feature => {\n            // Note: GeoJSON usa [lng, lat]\n            const [lng, lat] = feature.geometry.coordinates;\n            \n            return (\n              <Marker \n                key={feature.id} \n                position={[lat, lng]}\n                icon={createCustomIcon(feature.properties.layer_id)}\n              >",
    newMapLoop
  );
  
  // Need to adjust opacity in createCustomIcon
  text = text.replace(
    "const createCustomIcon = (layerId: string) => {",
    "const createCustomIcon = (layerId: string, opacity: number = 1) => {"
  );
  text = text.replace(
    "html: `<div class=\"w-4 h-4 ${bgColor} border-2 ${borderColor} rounded-full shadow-lg\"></div>`,",
    "html: `<div class=\"w-4 h-4 ${bgColor} border-2 ${borderColor} rounded-full shadow-lg\" style=\"opacity: ${opacity}\"></div>`,"
  );
  
  fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
  console.log('Frontend GIS Part 02 patched');
} else {
  console.log('Already patched');
}
