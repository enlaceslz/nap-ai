const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

if (!text.includes('otdr_distance_meters')) {
  // Replace the suggestion text section to include the new OTDR box
  text = text.replace(
    '<p className="text-[10px] text-amber-400 italic mb-2">"{impactReport.suggestion}"</p>',
    '<p className="text-[10px] text-amber-400 italic mb-2">"{impactReport.suggestion}"</p>\n               <div className="bg-slate-950 p-2 rounded border border-slate-700 mb-3 flex items-center gap-2">\n                 <Activity size={14} className="text-cyan-400" />\n                 <span className="text-[10px] text-slate-300">\n                   Distância Estimada (OTDR): <strong className="text-cyan-400">{impactReport.impact.otdr_distance_meters}m</strong> a partir da {impactReport.impact.otdr_reference}\n                 </span>\n               </div>'
  );

  // Replace the dummy button with a functional one calling our new endpoint
  text = text.replace(
    '<button className="w-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 py-2 rounded text-xs transition-colors">\n              Gerar OS (Integração SGP)\n            </button>',
    `<button 
              onClick={() => {
                fetch('/api/gis/topology/declare-failure/' + impactReport.root_id, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                   if(data.success) {
                     alert('Alarme Zabbix gerado com sucesso! ' + data.problem.message);
                     setImpactReport(null);
                   }
                });
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle size={14} /> Declarar Falha no Zabbix NOC
            </button>`
  );

  fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
  console.log('GisDashboard.tsx patched with OTDR UI and Zabbix Button');
} else {
  console.log('Already patched');
}
