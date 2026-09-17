const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

const hook = `                        <div className="mt-6 flex gap-3">
                           <button className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ">
                             <Zap size={16} /> Kick (Derrubar Conexão)
                           </button>
                           <button className="flex-1 bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ">
                             <Activity size={16} /> Extrato de Navegação
                           </button>
                        </div>`;

const inject = `                        {actionFeedback && (
                          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-500 font-semibold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span>{actionFeedback}</span>
                          </div>
                        )}
                        <div className="mt-6 flex gap-3">
                           <button 
                             onClick={() => {
                               setActionFeedback("✓ Comando de Radius CoA (Disconnect) enviado com sucesso para a BNG.");
                               setTimeout(() => setActionFeedback(null), 5000);
                             }}
                             className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                           >
                             <Zap size={16} /> Kick (Derrubar Conexão)
                           </button>
                           <button className="flex-1 bg-slate-900 hover:bg-white/5 border border-white/5 text-slate-300 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2">
                             <Activity size={16} /> Extrato de Navegação
                           </button>
                        </div>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP NOC actions");
