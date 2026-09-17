const fs = require('fs');
let code = fs.readFileSync('src/pages/Campanhas.tsx', 'utf8');

const hook = `          ) : activeTab === 'push' ? (`;
const inject = `          ) : activeTab === 'ativos' ? (
            /* ATIVOS DE CAMPANHA (TEMPLATES) */
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-white/5 p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-outfit">Templates e Ativos</h2>
                      <p className="text-sm text-slate-400 mt-0.5">Gestão de HSM (WhatsApp) e Áudios de URA</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Novo Template HSM
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Template HSM WhatsApp */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aprovado Meta
                        </span>
                        <MessageCircle size={16} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">cobranca_aviso_d3</h3>
                      <p className="text-xs text-slate-400 italic">"Olá {{1}}! Identificamos que sua fatura vence em {{2}}. O código PIX Copia e Cola é: {{3}}..."</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Eye size={12} /> Ver</button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Copy size={12} /> Copiar</button>
                    </div>
                  </div>
                  
                  {/* Template HSM WhatsApp - Vendas */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aprovado Meta
                        </span>
                        <MessageCircle size={16} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">oferta_wifi6_mesh</h3>
                      <p className="text-xs text-slate-400 italic">"Oi {{1}}! Como assinante fiel, liberamos um upgrade para roteador Wi-Fi 6 Mesh na sua casa por apenas {{2}}..."</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Eye size={12} /> Ver</button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Copy size={12} /> Copiar</button>
                    </div>
                  </div>

                  {/* Audio URA */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Áudio Gravado
                        </span>
                        <PhoneCall size={16} className="text-blue-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">ura_aviso_corte.mp3</h3>
                      <p className="text-xs text-slate-400 italic flex items-center gap-1"><Clock size={12} /> Duração: 00:15</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Play size={12} /> Ouvir</button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><RefreshCw size={12} /> Trocar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'push' ? (`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Campanhas.tsx', code);
console.log("Patched Campanhas body");
