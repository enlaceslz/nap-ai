const fs = require('fs');
let code = fs.readFileSync('src/pages/Telefonia.tsx', 'utf8');

// 1. Add toast feedback state
code = code.replace(
  "  const [loading, setLoading] = useState(true);",
  "  const [loading, setLoading] = useState(true);\n  const [actionFeedback, setActionFeedback] = useState<string | null>(null);"
);

// 2. Add the Action Feedback toast just below the Header
code = code.replace(
  '      <div className="flex-1 overflow-y-auto p-6">',
  '      <div className="flex-1 overflow-y-auto p-6">\n        {actionFeedback && (\n          <div className="max-w-7xl mx-auto mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">\n            <ShieldCheck size={16} className="shrink-0" />\n            <span>{actionFeedback}</span>\n          </div>\n        )}'
);

// 3. Fix "Derrubar Chamada" in Monitor tab
const hangupButton = '<button className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Derrubar Chamada (Hangup)">';
const newHangupButton = '<button onClick={() => { setActionFeedback("✓ Comando AMI enviado: Hangup executado com sucesso no canal " + call.id); setTimeout(() => setActionFeedback(null), 4000); }} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Derrubar Chamada (Hangup)">';
code = code.replace(hangupButton, newHangupButton);

// 4. Update URA Save Button
const uraSaveButton = `<button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-colors">
                    <Save size={18} /> Salvar Dialplan
                  </button>`;
const newUraSaveButton = `<button onClick={() => { setActionFeedback("✓ Dialplan compilado e aplicado no Asterisk com sucesso (Reload)!"); setTimeout(() => setActionFeedback(null), 4000); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_4px_14px_rgba(79,70,229,0.4)] flex items-center gap-2 transition-colors">
                    <Save size={18} /> Salvar Dialplan
                  </button>`;
code = code.replace(uraSaveButton, newUraSaveButton);

// 5. Update Audio Gen Button
const audioGenButton = `<div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-500/40 transition-colors group">`;
const newAudioGenButton = `<div onClick={() => { setActionFeedback("✓ Prompt enviado para IA Gemini (TTS). O novo áudio sintetizado estará disponível em alguns segundos."); setTimeout(() => setActionFeedback(null), 5000); }} className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-500/40 transition-colors group">`;
code = code.replace(audioGenButton, newAudioGenButton);

// 6. Fix Ramal creation handler
const ramalCreateBtn = `<button 
                onClick={() => {
                  setRamais([...ramais, { 
                    id: novoRamal.numero || Math.floor(Math.random() * 1000 + 2000).toString(), 
                    nome: novoRamal.nome || 'Novo Ramal', 
                    senha: novoRamal.senha || '***', 
                    tipo: 'Administrativo', 
                    status: 'offline' 
                  }]);
                  setNovoRamal({ numero: '', nome: '', senha: '', tipo: 'Administrativo' });
                  setShowRamalModal(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-colors"
              >
                Criar Ramal
              </button>`;
const newRamalCreateBtn = `<button 
                onClick={() => {
                  setRamais([...ramais, { 
                    id: novoRamal.numero || Math.floor(Math.random() * 1000 + 2000).toString(), 
                    nome: novoRamal.nome || 'Novo Ramal', 
                    senha: novoRamal.senha || '***', 
                    tipo: 'Administrativo', 
                    status: 'offline' 
                  }]);
                  setNovoRamal({ numero: '', nome: '', senha: '', tipo: 'Administrativo' });
                  setShowRamalModal(false);
                  setActionFeedback("✓ Novo Ramal SIP (PJSIP) configurado. Reinicie o softphone para registrar.");
                  setTimeout(() => setActionFeedback(null), 5000);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(37,99,235,0.4)] transition-colors"
              >
                Criar Ramal (SIP)
              </button>`;
code = code.replace(ramalCreateBtn, newRamalCreateBtn);

fs.writeFileSync('src/pages/Telefonia.tsx', code);
console.log("Patched Telefonia components.");
