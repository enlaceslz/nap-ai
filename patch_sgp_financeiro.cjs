const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

const hook = `                             {/* Canal Sob Demanda: WhatsApp a critério do operador */}
                             <button 
                               onClick={() => {
                                 setSendingWhatsapp(true);
                                 setTimeout(() => {
                                   setSendingWhatsapp(false);
                                   setActionFeedback("✓ Fatura enviada via WhatsApp WABA a critério do operador!");
                                   setTimeout(() => setActionFeedback(null), 5000);
                                 }, 700);
                               }}
                               disabled={sendingWhatsapp}
                               className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                               title="Disparo sob demanda autorizado pelo operador"
                             >
                               <MessageCircle size={15} className="text-emerald-400" /> 
                               <span>{sendingWhatsapp ? 'Enviando WABA...' : 'Enviar WhatsApp (Critério do Operador)'}</span>
                             </button>`;

const inject = `                             {/* Canal Sob Demanda: WhatsApp a critério do operador */}
                             <button 
                               onClick={() => {
                                 setSendingWhatsapp(true);
                                 setTimeout(() => {
                                   setSendingWhatsapp(false);
                                   setActionFeedback("✓ Fatura enviada via WhatsApp WABA a critério do operador!");
                                   setTimeout(() => setActionFeedback(null), 5000);
                                 }, 700);
                               }}
                               disabled={sendingWhatsapp}
                               className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                               title="Disparo sob demanda autorizado pelo operador"
                             >
                               <MessageCircle size={15} className="text-emerald-400" /> 
                               <span>{sendingWhatsapp ? 'Enviando WABA...' : 'Enviar WhatsApp (Critério do Operador)'}</span>
                             </button>
                             
                             {/* Copiar Chave PIX (Integração) */}
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText("00020101021126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5916Provedor Telecom6009SAO PAULO62070503***6304");
                                 setActionFeedback("✓ Código PIX Copia e Cola gerado e copiado com sucesso!");
                                 setTimeout(() => setActionFeedback(null), 5000);
                               }}
                               className="w-full bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                             >
                               <Copy size={15} /> 
                               <span>Gerar PIX Copia e Cola</span>
                             </button>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP Financeiro");
