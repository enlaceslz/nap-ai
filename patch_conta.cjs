const fs = require('fs');
let code = fs.readFileSync('src/pages/PortalConta.tsx', 'utf8');

const hook = `        </div>
      </div>`;

const inject = `        </div>
        
        {/* Botão de Sair (Mobile Destacado) */}
        <div className="md:hidden mt-8">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all border border-red-200 shadow-sm active:scale-95"
          >
            <LogOut size={20} />
            Sair da Conta (Logout)
          </button>
          <p className="text-center text-slate-400 text-xs mt-3">Versão do App: 2.4.1</p>
        </div>
      </div>`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/PortalConta.tsx', code);
console.log("PortalConta patched");
