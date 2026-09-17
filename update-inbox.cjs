const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const desbloqueioFind = `  const handleDesbloqueio48h = () => {
    if (!activeChat) return;
    const desbloqueioText = \`Olá \${activeChat.nome_cliente.split(' ')[0]}! Registramos no SGP o seu Desbloqueio em Confiança válido por 48 horas. Sua conexão já foi liberada com a velocidade contratada.\`;
    setMessageText(desbloqueioText);
    setIsInternalNote(false);
    showToast('Ação de Desbloqueio em Confiança preparada no SGP!');
  };`;

const desbloqueioReplace = `  const handleDesbloqueio48h = async () => {
    if (!activeChat) return;
    try {
      const res = await fetch(\`/api/sgp/desbloqueio-confianca/\${activeChat.id}\`, { method: 'POST' });
      if (res.ok) {
        const desbloqueioText = \`Olá \${activeChat.nome_cliente.split(' ')[0]}! Registramos no SGP o seu Desbloqueio em Confiança válido por 48 horas. Sua conexão já foi liberada no MikroTik.\`;
        setMessageText(desbloqueioText);
        setIsInternalNote(false);
        showToast('🔓 Desbloqueio em Confiança liberado no SGP e Radius!');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor.');
    }
  };`;

code = code.replace(desbloqueioFind, desbloqueioReplace);

const kickFind = `  const handleKickRadius = () => {
    if (!activeChat) return;
    showToast(\`Comando Kick Radius enviado para \${activeChat.status_conexao.concentrador}. Sessão reiniciada.\`);
  };`;

const kickReplace = `  const handleKickRadius = async () => {
    if (!activeChat) return;
    try {
      const res = await fetch(\`/api/network/kick-radius/\${activeChat.status_conexao.ip}\`, { method: 'POST' });
      if (res.ok) {
        showToast(\`⚡ Comando Kick Radius (PoD) enviado para \${activeChat.status_conexao.concentrador}. Sessão PPPoE derrubada com sucesso.\`);
      }
    } catch {
      showToast('Erro ao tentar derrubar a sessão PPPoE.');
    }
  };`;
  
code = code.replace(kickFind, kickReplace);

fs.writeFileSync('src/pages/Inbox.tsx', code);
