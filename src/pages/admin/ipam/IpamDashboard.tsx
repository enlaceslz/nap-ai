import React, { useState, useEffect } from 'react';
import { fetchIpamPrefixes } from '../../../services/ipamApi';
import { 
  Network, 
  Server, 
  Globe, 
  Wifi, 
  ShieldAlert, 
  Search,
  ChevronRight
} from 'lucide-react';

export default function IpamDashboard() {
  const [activeTab, setActiveTab] = useState('ipv4');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIpamPrefixes().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="text-emerald-500" />
            Network Source of Truth (IPAM)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão Autônoma de IPv4, IPv6, BGP, e Ativos de Rede
          </p>
        </div>
        
        <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('ipv4')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ipv4' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            IPv4 & IPv6
          </button>
          <button 
            onClick={() => setActiveTab('infra')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'infra' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Infra & BGP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA - ÁRVORE DE REDE */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 h-[650px] overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar sub-rede, VRF..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Prefixos Globais</h3>
          
          <div className="space-y-1">
            {loading ? <div className="text-slate-500 text-sm p-2">Carregando...</div> : data?.global.map((pref: any) => (
              <button key={pref.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {pref.type === 'IPv6' ? <Globe size={16} /> : <Network size={16} />} 
                  {pref.prefix}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${pref.type === 'IPv6' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'}`}>{pref.type}</span>
              </button>
            ))}
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3 px-2">Data Center & VRFs</h3>
          <div className="space-y-1">
            {loading ? <div className="text-slate-500 text-sm p-2">Carregando...</div> : data?.vrfs.map((vrf: any) => (
               <button key={vrf.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Server size={16} /> {vrf.name}</span>
                <span className="text-xs text-slate-400 font-mono">{vrf.rd}</span>
              </button>
            ))}
          </div>
        </div>

        {/* COLUNA DIREITA - DETALHES DO RECURSO */}
        <div className="lg:col-span-3">
          {/* TAB: IPV4 & IPV6 */}
          {activeTab === 'ipv4' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
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
                          <td className={`py-3 font-mono font-medium ${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}`}>{audit.resource}</td>
                          <td className={`py-3 ${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}`}>{audit.context}</td>
                          <td className="py-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${audit.isConflict ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
}