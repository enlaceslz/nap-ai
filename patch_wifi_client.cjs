const fs = require('fs');
let code = fs.readFileSync('src/components/PortalWifiModal.tsx', 'utf8');

const injectHooks = `
  const [removingMac, setRemovingMac] = useState<string | null>(null);
  
  const handleRemoveDevice = async (mac: string) => {
    setRemovingMac(mac);
    try {
      const res = await fetch('/api/portal/wifi/remove-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: data.mensagem });
        if (data.sugerirTrocaSenha) {
          setTimeout(() => {
             setFeedback({ tipo: 'erro', texto: 'Este dispositivo foi removido repetidas vezes. Sugerimos trocar a senha do seu Wi-Fi para impedir que ele volte a se conectar.' });
             setActiveTab('alterar');
          }, 4000);
        }
        await fetchWifiConfig(); // Atualiza a lista
      } else {
        setFeedback({ tipo: 'erro', texto: data.erro || 'Erro ao remover dispositivo.' });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Erro de conexão ao tentar remover dispositivo.' });
    }
    setRemovingMac(null);
  };
`;

code = code.replace(`
  // Carregar dados da ONU/Wi-Fi`, `${injectHooks}

  // Carregar dados da ONU/Wi-Fi`);

const target = `
                        <div className="flex items-center gap-3 text-right">
                          <div className="hidden sm:block">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sinal</span>
                            <span className="text-xs font-mono font-bold text-emerald-600">{dev.sinal} dBm</span>
                          </div>
                          <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${
                            dev.banda.includes('5') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }\`}>
                            {dev.banda}
                          </span>
                        </div>
                      </div>
                    ))}`;

const replace = `
                        <div className="flex items-center gap-3 text-right">
                          <div className="hidden sm:block">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sinal</span>
                            <span className="text-xs font-mono font-bold text-emerald-600">{dev.sinal} dBm</span>
                          </div>
                          <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${
                            dev.banda.includes('5') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }\`}>
                            {dev.banda}
                          </span>
                          <button 
                            onClick={() => handleRemoveDevice(dev.mac)}
                            disabled={removingMac === dev.mac}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50 ml-1"
                            title="Desconectar e Bloquear Dispositivo"
                          >
                            {removingMac === dev.mac ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/PortalWifiModal.tsx', code);
console.log("PortalWifiModal patched");
