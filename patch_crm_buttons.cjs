const fs = require('fs');
let code = fs.readFileSync('src/pages/CRM.tsx', 'utf8');

const hook = `              <a 
                href={\`https://wa.me/55\${(selectedContato.telefone || '').replace(/\\D/g, '')}\`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#152544] hover:bg-[#1c325c] border border-[#1e345e] text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Chamar no WhatsApp</span>
              </a>`;

const inject = `              <a 
                href={\`tel:\${selectedContato.telefone || ''}\`}
                className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                title="Ligar via Webphone SIP/Asterisk"
              >
                <Phone size={14} />
                <span>Webphone</span>
              </a>
              <a 
                href={\`https://wa.me/55\${(selectedContato.telefone || '').replace(/\\D/g, '')}\`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>WhatsApp</span>
              </a>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/CRM.tsx', code);
console.log("Patched CRM buttons");
