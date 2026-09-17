const fs = require('fs');

let code = fs.readFileSync('src/pages/Kanban.tsx', 'utf8');

// 1. Update imports
if (!code.includes('X, Clock, User, Phone, MapPin, Tag')) {
  code = code.replace(
    "import { Plus, MoreHorizontal } from 'lucide-react';",
    "import { Plus, MoreHorizontal, X, Clock, User, Phone, MapPin, Tag, Activity, FileText } from 'lucide-react';"
  );
}

// 2. Add state
if (!code.includes('selectedDeal')) {
  code = code.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);"
  );
}

// 3. Add onClick to card
if (!code.includes('onClick={() => setSelectedDeal(deal)}')) {
  code = code.replace(
    '<div \n                                ref={provided.innerRef}',
    '<div \n                                onClick={() => setSelectedDeal(deal)}\n                                ref={provided.innerRef}'
  );
}

// 4. Add slide-over markup before closing div
const slideOver = `
      {/* Slide-over Deal Panel */}
      {selectedDeal && (
        <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-lg shadow-sm border-l border-slate-200 animate-in slide-in-from-right flex flex-col z-50">
          <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider bg-blue-600/10 border border-blue-200 px-2 py-0.5 rounded">#{selectedDeal.id}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{selectedDeal.estagio}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-outfit mb-1">{selectedDeal.titulo}</h2>
            </div>
            <button 
              onClick={() => setSelectedDeal(null)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors border border-transparent"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {/* Info do Contato */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-inner">
              <h3 className="font-bold text-slate-900 font-outfit mb-4 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={16} className="text-blue-600" /> Detalhes do Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome</p>
                    <p className="text-sm font-medium text-slate-900">{selectedDeal.contato}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Phone size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefone / WhatsApp</p>
                    <p className="text-sm font-medium text-slate-900">(11) 99999-9999</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <MapPin size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Endereço (SGP)</p>
                    <p className="text-sm font-medium text-slate-900">Rua das Flores, 123 - Centro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="bg-gradient-to-br from-blue-100/40 to-purple-900/20 border border-blue-200 rounded-xl p-5 shadow-lg shadow-blue-100/10 relative overflow-hidden">
              <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider mb-3 text-[11px] relative z-10">
                <Activity size={14} className="fill-blue-600" />
                Contexto IA (9router)
              </div>
              <p className="text-sm text-blue-800 leading-relaxed relative z-10">
                {type === 'Suporte' 
                  ? 'Cliente relatou lentidão severa após temporal. Verificado no SGP: ONU online, mas com atenuação alta. Possível rompimento na CTO.'
                  : 'Lead originado via WhatsApp Ads. Demonstrou interesse no plano de 1GB Empresarial. Orçamento estimado R$ 299/mês.'
                }
              </p>
            </div>

            {/* Timeline Mock */}
            <div>
              <h3 className="font-bold text-slate-900 font-outfit mb-4 text-sm flex items-center gap-2">
                <Clock size={16} className="text-blue-600" /> Histórico de Atividade
              </h3>
              <div className="space-y-4 pl-3 border-l-2 border-slate-200 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-600 rounded-full border-[3px] border-white"></div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Hoje, 14:30</p>
                  <p className="text-sm text-slate-900 font-medium">Movido para {selectedDeal.estagio}</p>
                </div>
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-[3px] border-white"></div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Ontem, 09:15</p>
                  <p className="text-sm text-slate-900 font-medium">Classificação inicial realizada pela IA</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-200 bg-white flex gap-3 z-10">
            <button className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm">
              Ver no SGP
            </button>
            <button className="flex-1 bg-blue-700 hover:bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-700/20">
              Assumir Ticket
            </button>
          </div>
        </div>
      )}
`;

if (!code.includes('Slide-over Deal Panel')) {
  code = code.replace(
    '    </div>\n  );\n}',
    slideOver + '    </div>\n  );\n}'
  );
}

fs.writeFileSync('src/pages/Kanban.tsx', code);
console.log('Kanban patched with slide over.');
