const fs = require('fs');

// 1. Modificar Mock Clients para retornar undefined se nao achou o CPF
let mockCode = fs.readFileSync('src/data/portalMockClients.ts', 'utf8');
mockCode = mockCode.replace(/export function getClientByCpf[\s\S]*?}$/, `export function getClientByCpf(cpf: string): PortalClient | undefined {
  const clean = cpf.replace(/\\D/g, '');
  return CLIENTES_TESTE_PORTAL.find(c => c.cpf_limpo === clean || c.cpf === cpf);
}`);
fs.writeFileSync('src/data/portalMockClients.ts', mockCode);


// 2. Modificar PortalLogin
let code = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');

// Imports
if (!code.includes('WebchatWidget')) {
   code = code.replace(`import { useConfig } from '../contexts/ConfigContext';`, `import { useConfig } from '../contexts/ConfigContext';\nimport WebchatWidget from '../components/WebchatWidget';\nimport { UserX, HeadphonesIcon } from 'lucide-react';`);
}

// States
code = code.replace(`const [showDetails, setShowDetails] = useState(false);`, `const [showDetails, setShowDetails] = useState(false);\n  const [cpfNotFound, setCpfNotFound] = useState(false);`);

// handleLogin function
const oldHandleLogin = `const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;

    setIsLoading(true);

    setTimeout(() => {
      const clientData = getClientByCpf(cpf);
      localStorage.setItem('@nap_client_auth', JSON.stringify(clientData));
      navigate('/portal');
    }, 1000);
  };`;
    
const newHandleLogin = `const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;

    setIsLoading(true);

    setTimeout(() => {
      const clientData = getClientByCpf(cpf);
      if (!clientData) {
         setCpfNotFound(true);
         setIsLoading(false);
         return;
      }
      localStorage.setItem('@nap_client_auth', JSON.stringify(clientData));
      navigate('/portal');
    }, 1000);
  };`;
code = code.replace(oldHandleLogin, newHandleLogin);

// CpfNotFound View
const mainCardStart = `<div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-8 mb-4">`;
const mainCardReplacement = `
        {/* View de CPF não encontrado (Lead) */}
        {cpfNotFound ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-8 mb-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <UserX size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 font-outfit">CPF não localizado</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Não encontramos nenhum contrato para o CPF <strong className="text-slate-700">{cpf}</strong>.
            </p>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 mb-6 text-left relative overflow-hidden shadow-lg shadow-blue-900/20">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3"></div>
               <h3 className="text-white font-bold text-lg mb-1 relative z-10">Quer ser cliente NAP?</h3>
               <p className="text-blue-100 text-xs mb-4 relative z-10">Temos planos de Fibra Óptica a partir de 500 Mega com instalação grátis e Wi-Fi 6.</p>
               <button 
                 onClick={() => {
                    const btn = document.querySelector('.webchat-toggle-btn');
                    if (btn) (btn as HTMLElement).click();
                 }}
                 className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 relative z-10"
               >
                 <HeadphonesIcon size={18} />
                 Falar com Consultor (Vendas)
               </button>
            </div>

            <button 
              onClick={() => { setCpfNotFound(false); setCpf(''); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all active:scale-95"
            >
              Tentar outro CPF
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-8 mb-4">`;

code = code.replace(mainCardStart, mainCardReplacement);

// Close the ternary + Add Quero ser Cliente button at the end of the normal view
const divClose = `          </div>\n\n          {/* Ficha Completa do Cliente Fictício Selecionado */}`;
const divCloseReplacement = `          
            {/* Botão de Novo Cliente (Abaixo do Login) */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-500 mb-3">Ainda não possui nossa conexão?</p>
              <button 
                type="button"
                onClick={() => {
                   const btn = document.querySelector('.webchat-toggle-btn');
                   if (btn) (btn as HTMLElement).click();
                }}
                className="text-blue-600 font-bold hover:text-blue-700 flex items-center justify-center gap-1.5 mx-auto w-full py-3 bg-blue-50/50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100/50"
              >
                <Sparkles size={16} />
                Quero assinar a NAP Fibra
              </button>
            </div>
          </div>
        )}

          {/* Ficha Completa do Cliente Fictício Selecionado */}`;

code = code.replace(divClose, divCloseReplacement);

// Add webchat widget to the body
code = code.replace(`</main>`, `</main>\n      <div className="fixed bottom-0 right-0 z-50">\n        <WebchatWidget />\n      </div>`);

fs.writeFileSync('src/pages/PortalLogin.tsx', code);
console.log("Patched login");
