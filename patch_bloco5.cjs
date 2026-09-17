const fs = require('fs');
const text = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const regex = /<Share2 size=\{11\} \/>\s*<span>WhatsApp OS<\/span>\s*<\/button>\s*<\/div>\s*<\/div>/;

const replacement = `<Share2 size={11} />
                      <span>WhatsApp OS</span>
                    </button>
                  </div>
                </div>

                {/* Bloco 5: Handoff / CRM Kanban */}
                <div className="p-3 bg-slate-900 rounded-2xl border border-white/10 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1">
                      <Layers size={12} className="text-orange-400" /> Histórico Kanban
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                      Sincronizado
                    </span>
                  </div>
                  
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Ao assumir o atendimento da MaIA (Handoff), o SGP Kanban automaticamente posiciona um Deal em 
                      <strong className="text-orange-400 ml-1 font-semibold uppercase">Em Atendimento</strong>.
                    </p>
                    <div className="pt-1 flex gap-2">
                       <button
                         onClick={() => window.open('/admin/crm', '_blank')}
                         className="flex-1 py-1.5 bg-white/[0.02] hover:bg-white/10 border border-white/10 rounded-lg font-semibold text-slate-300 flex items-center justify-center gap-1 transition-all"
                       >
                         <ExternalLink size={12} />
                         <span>Abrir Kanban SGP</span>
                       </button>
                    </div>
                  </div>
                </div>`;

if(regex.test(text)) {
  fs.writeFileSync('src/pages/Inbox.tsx', text.replace(regex, replacement));
  console.log("Success");
} else {
  console.log("Regex failed to match");
}
