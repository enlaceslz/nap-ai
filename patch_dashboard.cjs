const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

// Add states
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState('');",
  "const [searchTerm, setSearchTerm] = useState('');\n  const [isModalOpen, setIsModalOpen] = useState(false);\n  const [newOS, setNewOS] = useState({ title: '', priority: 'normal', description: '' });\n  const [isSaving, setIsSaving] = useState(false);"
);

// Add onClick to button
code = code.replace(
  /<button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500\/20 flex items-center gap-2 text-sm">/g,
  '<button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm">'
);

// Define modal HTML
const modalHTML = `
      {/* MODAL NOVA OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2f] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-blue-500" />
                Criar Nova OS
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Título</label>
                <input 
                  type="text" 
                  value={newOS.title} 
                  onChange={e => setNewOS({...newOS, title: e.target.value})} 
                  placeholder="Ex: Rompimento na Rua A" 
                  className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Prioridade</label>
                <select 
                  value={newOS.priority} 
                  onChange={e => setNewOS({...newOS, priority: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta / Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
                <textarea 
                  value={newOS.description} 
                  onChange={e => setNewOS({...newOS, description: e.target.value})} 
                  placeholder="Detalhes do problema..." 
                  className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                ></textarea>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-[#101726] border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if(!newOS.title) return;
                  setIsSaving(true);
                  try {
                    const res = await fetch('/api/v1/helpdesk/tickets', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        title: newOS.title,
                        description: newOS.description,
                        priority: newOS.priority,
                        source: 'manual'
                      })
                    });
                    if(res.ok) {
                      setIsModalOpen(false);
                      setNewOS({title: '', priority: 'normal', description: ''});
                      // Refresh tickets
                      const ref = await fetch('/api/v1/helpdesk/tickets');
                      const data = await ref.json();
                      const realTickets = (data.tickets || []).map((t: any) => ({
                        id: t.external_id || t.id?.toString(),
                        title: t.title,
                        status: t.status,
                        priority: t.priority,
                        source: t.source || 'manual',
                        date: new Date(t.created_at).toLocaleDateString('pt-BR')
                      }));
                      // Update UI hack since we don't export the full fetch func easily
                      // We'll just trigger a reload or update state manually.
                      setTickets(realTickets);
                    }
                  } catch(e) {}
                  setIsSaving(false);
                }} 
                disabled={isSaving || !newOS.title}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                {isSaving ? <Activity size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isSaving ? 'Salvando...' : 'Criar OS / Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
`;

code = code.replace(
  "    </div>\n  );\n}",
  modalHTML + "\n}"
);

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', code, 'utf8');
console.log('HelpDeskDashboard.tsx updated with Modal');
