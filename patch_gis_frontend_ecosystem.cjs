const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

if (!text.includes('Legend')) {
  // Add a Legend component to UI
  const legendUi = `
        {/* Legenda do Ecossistema */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-2">
          <div className="text-white font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between items-center">
            <span>Legenda & Integrações</span>
            <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Online (Normal)</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div> Offline (Corte Físico)</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Alarme Zabbix</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Bloqueio SGP (Fatura)</div>
        </div>
  `;

  text = text.replace(
    "{/* NOC Copilot FAB & Window */}",
    legendUi + "\n        {/* NOC Copilot FAB & Window */}"
  );

  // Update Icon Creator to respect status
  text = text.replace(
    /const createCustomIcon = \(layerId: string, opacity: number = 1\) => \{[\s\S]*?return new DivIcon/m,
    `const createCustomIcon = (layerId: string, opacity: number = 1, status?: string) => {
  let bgColor = 'bg-emerald-500';
  let borderColor = 'border-emerald-700';

  if (status === 'offline') {
    bgColor = 'bg-red-500';
    borderColor = 'border-red-700';
  } else if (status === 'blocked_sgp') {
    bgColor = 'bg-purple-500';
    borderColor = 'border-purple-700';
  } else if (status === 'warning') {
    bgColor = 'bg-amber-500';
    borderColor = 'border-amber-700';
  } else {
    // Cores padrao por camada se online
    if (layerId === 'layer-olt') {
      bgColor = 'bg-fuchsia-500';
      borderColor = 'border-fuchsia-700';
    } else if (layerId === 'layer-cto') {
      bgColor = 'bg-blue-500';
      borderColor = 'border-blue-700';
    } else if (layerId === 'layer-ceo') {
      bgColor = 'bg-orange-500';
      borderColor = 'border-orange-700';
    } else if (layerId === 'layer-dio') {
      bgColor = 'bg-yellow-500';
      borderColor = 'border-yellow-700';
    }
  }
  
  return new DivIcon`
  );

  text = text.replace(
    "icon={createCustomIcon(feature.properties.layer_id, opacity)}",
    "icon={createCustomIcon(feature.properties.layer_id, opacity, feature.properties.status)}"
  );

  // Update popup to show Zabbix and SGP data
  const popupExtra = `
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className={\`font-bold \${feature.properties.status === 'online' ? 'text-emerald-500' : feature.properties.status === 'blocked_sgp' ? 'text-purple-500' : 'text-red-500'}\`}>{feature.properties.status?.toUpperCase()}</span></div>
                      {feature.properties.zabbix_trigger && (
                        <div className="bg-amber-900/30 border border-amber-500/50 p-1 rounded mt-1 flex justify-between items-center">
                          <span className="text-amber-500 text-[10px] font-bold">ZABBIX:</span>
                          <span className="text-amber-400 text-[10px] truncate max-w-[120px]">{feature.properties.zabbix_trigger}</span>
                        </div>
                      )}
                      {feature.properties.status === 'blocked_sgp' && (
                         <div className="bg-purple-900/30 border border-purple-500/50 p-1 rounded mt-1 flex justify-between items-center">
                          <span className="text-purple-500 text-[10px] font-bold">ERP/SGP:</span>
                          <span className="text-purple-400 text-[10px]">Fatura Vencida</span>
                        </div>
                      )}
  `;

  text = text.replace(
    /<div className="flex justify-between">\s*<span className="text-slate-500">Status:<\/span>\s*<span className="font-semibold uppercase">\{feature.properties.status\}<\/span>\s*<\/div>/,
    popupExtra
  );

  fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
  console.log('Frontend ecosystem legend patched');
}
