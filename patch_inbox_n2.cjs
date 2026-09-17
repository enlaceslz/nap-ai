const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const hook = `{/* Finalizar / Tabular Atendimento */}`;
const inject = `{/* Escalonar N2 / NOC */}
                  <button
                    onClick={() => {
                      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, status: 'aberta', fila: 'NOC N2' } : c));
                      setActiveChatId(null);
                      setFilterQueue('fila_geral');
                      showToast('Atendimento escalonado para o Suporte N2 (NOC) com sucesso!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all"
                    title="Escalonar chamado para equipe de Nível 2 / NOC (TR-069 Avançado)"
                  >
                    <ShieldCheck size={13} className="text-orange-400" />
                    <span className="hidden sm:inline">Escalonar N2</span>
                  </button>

                  {/* Finalizar / Tabular Atendimento */}`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log("Inbox N2 patched");
