const fs = require('fs');
let text = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

text = text.replace(
  /body: JSON\.stringify\(\{\s*chatId: chatId,\s*nome: chatAlvo\?\.nome_cliente \|\| 'Desconhecido',\s*telefone: chatAlvo\?\.telefone,\s*pilar: chatAlvo\?\.pilar_negocio\s*\}\)/,
  "body: JSON.stringify({ protocolo: chatAlvo?.protocolo || 'N/A', nome: chatAlvo?.nome_cliente || 'Desconhecido', numero: chatAlvo?.telefone, resumo_ia: 'Transferido manualmente' })"
);

fs.writeFileSync('src/pages/Inbox.tsx', text, 'utf8');
console.log('Fixed handoff properties');
