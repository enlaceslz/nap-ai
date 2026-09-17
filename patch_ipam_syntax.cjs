const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ipam/IpamDashboard.tsx', 'utf8');

// O bloco anterior ficou quebrado na hora da injeção do script regex.
// Vamos reescrever o bloco do col-span-3 inteiro limpo.

const targetBlock = code.substring(code.indexOf('{/* COLUNA DIREITA - DETALHES DO RECURSO */}'));

const cleanBlock = `{/* COLUNA DIREITA - DETALHES DO RECURSO */}
        <div className="lg:col-span-3">
          {/* TAB: IPV4 & IPV6 */}
          {activeTab === 'ipv4' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#151c2f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">100.64.0.0/10</h2>
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full uppercase tracking-wider">Container Primário</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Bloco Global de CGNAT (RFC 6598) - Alocado para BNGs</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 mb-1">Utilização</div>
                    <div className="text-2xl font-bold text-emerald-500">68%</div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">VRF Associada</div>
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">VRF_CLIENTES_PPPOE <ChevronRight size={14} className="text-slate-400"/></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de IPs (Utilizáveis)</div>
                    <div className="font-mono font-medium text-slate-900 dark:text-white">4.194.304</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sincronização Nautobot</div>
                    <div className="font-medium text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Em Sincronia</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#151c2f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-orange-500" />
                  Auditoria & Alocações Recentes
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="pb-3 font-medium">IP / Prefixo</th>
                        <th className="pb-3 font-medium">Cliente / Contexto</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                      {loading ? (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-500">Buscando auditoria...</td></tr>
                      ) : data?.audits.map((audit: any) => (
                        <tr key={audit.id}>
                          <td className={\`py-3 font-mono font-medium \${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}\`}>{audit.resource}</td>
                          <td className={\`py-3 \${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}\`}>{audit.context}</td>
                          <td className="py-3">
                            <span className={\`text-[10px] uppercase font-bold px-2 py-1 rounded \${audit.isConflict ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}\`}>
                              {audit.status}
                            </span>
                          </td>
                          <td className="py-3 text-right text-slate-400">{audit.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INFRA & BGP */}
          {activeTab === 'infra' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#151c2f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">AS28100 - NAP Telecom</h2>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-bold text-xs rounded-full uppercase tracking-wider">Sessão Estabelecida</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">BGP Peering com PIX / IX.br</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 mb-1">Prefixos Recebidos</div>
                    <div className="text-2xl font-bold text-purple-500">128.490</div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Router Principal</div>
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">CORE-MIKROTIK-CCR</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de VLANs</div>
                    <div className="font-mono font-medium text-slate-900 dark:text-white">4094</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estado das Sessões BGP</div>
                    <div className="font-medium text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 4 UP / 0 DOWN</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(targetBlock, cleanBlock);
fs.writeFileSync('src/pages/admin/ipam/IpamDashboard.tsx', code, 'utf8');
console.log('Fixed syntax and restored tabs');
