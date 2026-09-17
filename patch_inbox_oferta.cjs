const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const hook = `                {/* Bloco 2: Financeiro & PIX Instantâneo */}`;
const inject = `                {/* Bloco Upgrades & Vendas */}
                {activeChat.pilar_negocio === 'vendas' && (
                  <div className="p-3.5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/20 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wide flex items-center gap-1">
                        <TrendingUp size={13} className="text-fuchsia-400" /> Oportunidade de Upgrade
                      </span>
                    </div>
                    
                    <div className="p-2.5 bg-slate-900/50 rounded-xl border border-white/5 space-y-2 text-xs">
                      <p className="text-slate-300">
                        Lead demonstrou interesse em <strong className="text-fuchsia-400">Wi-Fi 6 Mesh</strong>.
                        O plano atual é {activeChat.plano} (R$ {activeChat.financeiro.valor.toFixed(2)}).
                      </p>
                      <button 
                        onClick={() => {
                          setMessageText(\`Perfeito, Fernanda! O upgrade para o Wi-Fi 6 Mesh vai adicionar R$ 49,90 na sua fatura, ficando um total de R$ \${(activeChat.financeiro.valor + 49.90).toFixed(2)}/mês. Posso gerar o aceite digital no seu aplicativo?\`);
                          setIsInternalNote(false);
                          showToast('Oferta de Upgrade enviada para o chat!');
                        }}
                        className="w-full py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        Enviar Proposta de Upgrade
                      </button>
                    </div>
                  </div>
                )}

                {/* Bloco 2: Financeiro & PIX Instantâneo */}`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log("Inbox Oferta patched");
