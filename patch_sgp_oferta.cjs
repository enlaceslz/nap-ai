const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

const hook = `                            <button className={\`w-full py-3 rounded-xl font-bold transition-all  \${
                              plano.destaque ? 'bg-blue-700 hover:bg-blue-800 text-white -700/20' : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                            }\`}>
                              Ofertar Upgrade
                            </button>`;

const inject = `                            <button 
                              onClick={() => {
                                setActionFeedback("✓ Oferta registrada no ERP e adicionada ao Pipeline do Kanban de Vendas!");
                                setTimeout(() => setActionFeedback(null), 5000);
                              }}
                              className={\`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 \${
                              plano.destaque ? 'bg-blue-700 hover:bg-blue-800 text-white -700/20' : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5'
                            }\`}>
                              <HeartHandshake size={16} /> Ofertar Upgrade
                            </button>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP Oferta");
