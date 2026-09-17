const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

const hook = `                      <div className="mb-6">
                        <h3 className="font-bold text-white font-outfit text-lg flex items-center gap-2">
                          <ArrowUpRight className="text-blue-400" /> Oportunidades de Upgrade (Cross-sell)
                        </h3>
                        <p className="text-slate-400 text-sm">Com base no consumo de {res.metricas.consumo_mes_gb}GB/mês, estes planos são recomendados.</p>
                      </div>`;

const inject = `                      <div className="mb-6">
                        <h3 className="font-bold text-white font-outfit text-lg flex items-center gap-2">
                          <ArrowUpRight className="text-blue-400" /> Oportunidades de Upgrade (Cross-sell)
                        </h3>
                        <p className="text-slate-400 text-sm">Com base no consumo de {res.metricas.consumo_mes_gb}GB/mês, estes planos são recomendados.</p>
                      </div>
                      
                      {actionFeedback && (
                        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-semibold flex items-center gap-2 animate-in fade-in max-w-4xl">
                          <CheckCircle2 size={15} className="text-blue-400 shrink-0" />
                          <span>{actionFeedback}</span>
                        </div>
                      )}`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP Vendas feedback");
