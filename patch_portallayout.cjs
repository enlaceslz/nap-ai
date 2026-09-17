const fs = require('fs');
let code = fs.readFileSync('src/components/PortalLayout.tsx', 'utf8');

const injection = `
  const clientName = clientData.nome || 'Rafael Medeiros';
  const clientContrato = clientData.contrato || 'CTR-2026-8894';

  if (clientData.status_cliente === 'inativo') {
    return (
      <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-600 to-slate-50 opacity-10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-10"></div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 text-center max-w-md mx-auto w-full">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] shadow-inner flex items-center justify-center">
                <span className="text-white font-black text-2xl font-sans mt-[2px]">{inicialProvedor}</span>
             </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Que saudade, {clientName.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Notamos que o seu contrato <strong className="text-slate-700">{clientContrato}</strong> está inativo. 
            Nós do <strong>{nomeProvedor}</strong> preparamos uma oferta super especial, exclusiva para ex-clientes, para você voltar a navegar com a nossa fibra óptica.
          </p>

          <div className="bg-white rounded-3xl border border-blue-100 p-6 w-full shadow-lg shadow-blue-900/5 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-xl">Exclusivo</div>
            <div className="text-blue-600 mb-2">
               <Wifi size={32} className="mx-auto" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Fibra Turbo + Dobro de Mega</h3>
            <p className="text-slate-500 text-xs mb-4">Assine hoje e ganhe instalação grátis e roteador Wi-Fi 6 incluso.</p>
            
            <button onClick={() => {
                const btn = document.querySelector('.webchat-toggle-btn');
                if (btn) (btn as HTMLElement).click();
              }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <HeadphonesIcon size={18} />
              Quero ouvir a proposta
            </button>
          </div>

          <button onClick={() => {
            localStorage.removeItem('@nap_client_auth');
            window.location.href = '/portal/login';
          }} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            Sair e usar outro CPF
          </button>
        </div>
        
        {/* Renderizamos o Webchat oculto na página, para o botão funcionar */}
        <div className="fixed bottom-0 right-0 z-50">
           <WebchatWidget />
        </div>
      </div>
    );
  }
`;

code = code.replace(`  const clientName = clientData.nome || 'Rafael Medeiros';\n  const clientContrato = clientData.contrato || 'CTR-2026-8894';`, injection);
fs.writeFileSync('src/components/PortalLayout.tsx', code);
console.log("Portal patched");
