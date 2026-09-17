const fs = require('fs');
let code = fs.readFileSync('src/pages/Campanhas.tsx', 'utf8');

// Add Ativos Tab
const hookTabs = `        <button 
          onClick={() => setActiveTab('push')}
          className={\`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors \${activeTab === 'push' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-400'}\`}
        >
          <Bell size={18} /> Notificações Push (PWA)
        </button>
      </div>`;

const injectTabs = `        <button 
          onClick={() => setActiveTab('push')}
          className={\`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors \${activeTab === 'push' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-400'}\`}
        >
          <Bell size={18} /> Notificações Push (PWA)
        </button>
        <button 
          onClick={() => setActiveTab('ativos')}
          className={\`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors \${activeTab === 'ativos' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-500 hover:text-slate-400'}\`}
        >
          <Sparkles size={18} /> Ativos & Templates
        </button>
      </div>`;
code = code.replace(hookTabs, injectTabs);

// Update Type State if needed
code = code.replace(`useState<'whatsapp' | 'voz' | 'push' | 'regua'>('regua')`, `useState<'whatsapp' | 'voz' | 'push' | 'regua' | 'ativos'>('regua')`);

// Add the KPIs for ativos
code = code.replace(`{activeTab === 'regua' ? 'Clientes Notificados Hoje' : activeTab === 'push' ? 'Dispositivos Inscritos (Push)' : 'Leads Ativos'}`,
`{activeTab === 'regua' ? 'Clientes Notificados Hoje' : activeTab === 'push' ? 'Dispositivos Inscritos (Push)' : activeTab === 'ativos' ? 'Templates Aprovados' : 'Leads Ativos'}`);

code = code.replace(`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.totalDisparadosHoje || 84) : activeTab === 'push' ? (pushStatus?.total_inscritos || 1) : '5,300'}`,
`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.totalDisparadosHoje || 84) : activeTab === 'push' ? (pushStatus?.total_inscritos || 1) : activeTab === 'ativos' ? '24' : '5,300'}`);

code = code.replace(`{activeTab === 'regua' ? 'Recuperado via PIX Hoje' : activeTab === 'push' ? 'Taxa de Entrega Push' : 'Taxa de Conversão'}`,
`{activeTab === 'regua' ? 'Recuperado via PIX Hoje' : activeTab === 'push' ? 'Taxa de Entrega Push' : activeTab === 'ativos' ? 'Taxa de Aprovação HSM' : 'Taxa de Conversão'}`);

code = code.replace(`{activeTab === 'regua' ? \`R$ \${(reguaConfig?.estatisticas?.valorRecuperadoHoje || 3896).toFixed(2)}\` : activeTab === 'push' ? '98.5%' : '18.4%'}`,
`{activeTab === 'regua' ? \`R$ \${(reguaConfig?.estatisticas?.valorRecuperadoHoje || 3896).toFixed(2)}\` : activeTab === 'push' ? '98.5%' : activeTab === 'ativos' ? '98%' : '18.4%'}`);

code = code.replace(`{activeTab === 'regua' ? 'Taxa de Conversão PIX' : activeTab === 'push' ? 'Disparos Push Efetuados' : 'Campanhas Rodando'}`,
`{activeTab === 'regua' ? 'Taxa de Conversão PIX' : activeTab === 'push' ? 'Disparos Push Efetuados' : activeTab === 'ativos' ? 'Áudios de URA' : 'Campanhas Rodando'}`);

code = code.replace(`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.taxaConversaoPix || '46.4%') : activeTab === 'push' ? (pushStatus?.historico_recente?.length || 1) : '2'}`,
`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.taxaConversaoPix || '46.4%') : activeTab === 'push' ? (pushStatus?.historico_recente?.length || 1) : activeTab === 'ativos' ? '12' : '2'}`);

code = code.replace(`{activeTab === 'regua' ? 'Faturas Baixadas Hoje' : 'Sincronia Radius / MikroTik'}`,
`{activeTab === 'regua' ? 'Faturas Baixadas Hoje' : activeTab === 'ativos' ? 'Sincronização Meta' : 'Sincronia Radius / MikroTik'}`);

code = code.replace(`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.faturasRecuperadasPix || 39) : '100%'}`,
`{activeTab === 'regua' ? (reguaConfig?.estatisticas?.faturasRecuperadasPix || 39) : activeTab === 'ativos' ? 'Online' : '100%'}`);

fs.writeFileSync('src/pages/Campanhas.tsx', code);
console.log("Patched Campanhas headers");
