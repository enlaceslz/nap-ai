const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

// Adicionar state para ticketSelecionado
code = code.replace(
  "const [nocStatus, setNocStatus] = useState<any>(null);",
  "const [nocStatus, setNocStatus] = useState<any>(null);\n  const [selectedTicket, setSelectedTicket] = useState<any>(null);"
);

// Adicionar onClick nas linhas da lista
code = code.replace(
  /className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800\/50 transition-colors"/g,
  "onClick={() => setSelectedTicket(ticket)}\n                  className=\"p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors\""
);

// Modal para visualização
const modalCode = `
      {/* MODAL VISUALIZAR TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2f] w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Ticket size={20} className="text-blue-500" />
                Detalhes do {activeTab === 'tickets' ? 'Ticket' : 'OS'}
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Título / Assunto</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedTicket.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                  <div className="mt-1">
                    <span className={\`text-xs font-bold uppercase px-2 py-1 rounded \${selectedTicket.status === 'resolvido' || selectedTicket.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}\`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Externo</span>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">{selectedTicket.id}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição do Problema</span>
                <div className="mt-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedTicket.description || 'Nenhuma descrição fornecida pelo requerente.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#101726] border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Fechar
              </button>
              {(selectedTicket.status !== 'resolvido' && selectedTicket.status !== 'closed') && (
                <button 
                  onClick={async () => {
                    try {
                      await fetch('/api/v1/helpdesk/tickets/' + selectedTicket.id + '/close', { method: 'POST' });
                      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolvido' } : t));
                      setSelectedTicket(null);
                    } catch(e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Marcar como Resolvido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("    </div>\n  );\n}", modalCode + "    </div>\n  );\n}");

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', code, 'utf8');
console.log('Ticket click and modal view added.');
