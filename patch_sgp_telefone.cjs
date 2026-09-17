const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

const hook = `                                <button className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors">
                                  <MessageCircle size={12} /> Chamar
                                </button>`;

const inject = `                                <div className="flex gap-1.5">
                                  <a 
                                    href={\`tel:\${res.contato.telefone}\`}
                                    className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Ligar via Webphone SIP/Asterisk"
                                  >
                                    <Phone size={12} /> Webphone
                                  </a>
                                  <a 
                                    href={\`https://wa.me/55\${(res.contato.telefone || '').replace(/\\D/g, '')}\`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <MessageCircle size={12} /> WABA
                                  </a>
                                </div>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP Telefone");
