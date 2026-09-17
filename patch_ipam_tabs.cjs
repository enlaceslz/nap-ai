const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/ipam/IpamDashboard.tsx', 'utf8');

// The activeTab state is completely ignored in the rendering below the header!
// We need to wrap the right-side details in a conditional block.

const infraCode = `
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
`;

// Find the start of the right column
const rightColStart = '{/* COLUNA DIREITA - DETALHES DO RECURSO */}';
const ipv4Wrapper = `{activeTab === 'ipv4' && (
            <div className="space-y-6 animate-in fade-in duration-300">`;

const ipv4End = `</div>
          )}
` + infraCode;


// We need to inject the activeTab logic around the existing right column content
code = code.replace(
  '<div className="lg:col-span-3 space-y-6">',
  '<div className="lg:col-span-3">'
);

code = code.replace(
  '          <div className="bg-white dark:bg-[#151c2f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">',
  '          {activeTab === \'ipv4\' && (\n            <div className="space-y-6 animate-in fade-in duration-300">\n              <div className="bg-white dark:bg-[#151c2f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">'
);

// Close the IPv4 wrapper right before the end of the col-span-3 div
code = code.replace(
  '            </div>\n          </div>\n        </div>\n      </div>',
  '            </div>\n          </div>\n        </div>\n        )}\n' + infraCode + '        </div>\n      </div>'
);

fs.writeFileSync('src/pages/admin/ipam/IpamDashboard.tsx', code, 'utf8');
console.log('Tab content patched.');
