const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

// A substituição anterior do UI do impacto sobrescreveu parte do Viability UI. Vamos limpar e restaurar a seção correta.

const badSectionStart = text.indexOf('<div className="absolute top-4 left-1/2 transform -translate-x-1/2');
const badSectionEnd = text.indexOf('</div>\n          )}\n          \n          {impactReport && (');
const fullMapEnd = text.indexOf('</MapContainer>');

// Restore the actual clear UI from scratch
const safeUi = `
        <ViabilityTool />
          {viabilityPoint && viabilityResult && viabilityResult.best_option && (<Polyline positions={[[viabilityPoint.lat, viabilityPoint.lng], [viabilityResult.best_option.cto.geometry.coordinates[1], viabilityResult.best_option.cto.geometry.coordinates[0]]]} color={viabilityResult.best_option.viability_status === 'VIÁVEL' ? '#10b981' : '#f59e0b'} weight={3} dashArray="5, 10" />)}
          {viabilityPoint && <Marker position={viabilityPoint} icon={createCustomIcon('layer-clientes')} />}
        </MapContainer>
        
        {viabilityResult && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl z-[1000] min-w-[300px]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-bold">Análise de Viabilidade (P3)</h3>
              <button onClick={() => {setViabilityResult(null); setViabilityPoint(null);}} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            
            {viabilityResult.best_option ? (
              <div>
                <div className={\`px-3 py-2 rounded text-sm font-semibold mb-3 \${viabilityResult.best_option.viability_status === 'VIÁVEL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}\`}>
                  {viabilityResult.best_option.viability_status}
                </div>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                   <span className="text-slate-400 text-xs">Score de Viabilidade:</span>
                   <span className="text-white font-bold">{viabilityResult.best_option.score}/100</span>
                </div>
                <p className="text-slate-300 text-xs mb-1"><strong>Distância:</strong> {viabilityResult.best_option.distance_meters}m</p>
                <p className="text-slate-300 text-xs mb-1"><strong>CTO Alvo:</strong> {viabilityResult.best_option.cto.properties.name}</p>
                <p className="text-slate-300 text-xs mb-3"><strong>Portas Livres:</strong> {viabilityResult.best_option.free_ports}</p>
                
                {viabilityResult.alternatives && viabilityResult.alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-2">Alternativas ({viabilityResult.alternatives.length}):</p>
                    {viabilityResult.alternatives.map((alt: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{alt.cto.properties.name}</span>
                        <span>{alt.distance_meters}m (Score {alt.score})</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 bg-slate-800 p-2 rounded">
                  <p className="text-[10px] text-slate-400 mb-1">Confiança da Análise: <strong>{viabilityResult.confidence}</strong></p>
                  <ul className="list-disc pl-4 text-[10px] text-slate-500">
                    {viabilityResult.data_quality?.map((q: string, i: number) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded text-sm font-semibold">INVIÁVEL - Nenhuma infraestrutura detectada num raio de 800m.</div>
            )}
          </div>
        )}
        
        {impactReport && (
           <div className="absolute top-4 right-4 bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-2xl z-[1000] w-[350px] max-h-[80%] overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-bold text-red-400">🚨 Relatório de Rompimento (P3)</h3>
              <button onClick={() => setImpactReport(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            
            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg mb-4">
               <p className="text-slate-300 text-xs mb-2">Foco: <span className="font-mono text-white">{impactReport.root_name}</span></p>
               <p className="text-[10px] text-amber-400 italic mb-2">"{impactReport.suggestion}"</p>
               
               <div className="grid grid-cols-2 gap-2 mt-3">
                 <div className="bg-slate-900 p-2 rounded border border-slate-700 text-center">
                   <span className="block text-2xl font-bold text-white">{impactReport.impact.ceos_affected + impactReport.impact.ctos_affected}</span>
                   <span className="text-[10px] text-slate-400 uppercase">Caixas Isoladas</span>
                 </div>
                 <div className="bg-slate-900 p-2 rounded border border-red-900/50 text-center">
                   <span className="block text-2xl font-bold text-red-400">{impactReport.impact.onts_affected}</span>
                   <span className="text-[10px] text-red-400/80 uppercase">ONTs Offline</span>
                 </div>
               </div>
            </div>
            
            <button className="w-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 py-2 rounded text-xs transition-colors">
              Gerar OS (Integração SGP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}`;

const prefix = text.substring(0, fullMapEnd);
fs.writeFileSync('src/pages/GisDashboard.tsx', prefix + safeUi, 'utf8');

