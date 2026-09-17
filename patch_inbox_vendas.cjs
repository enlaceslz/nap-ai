const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const hook = `      { id: 7, conversa_id: 3, autor_tipo: 'cliente', conteudo: 'Olá, gostaria de saber se é possível fazer o upgrade para o roteador Wi-Fi 6 Mesh.', enviada_em: '10:04', status: 'entregue' }`;
const inject = `      { id: 7, conversa_id: 3, autor_tipo: 'cliente', conteudo: 'Olá, gostaria de saber se é possível fazer o upgrade para o roteador Wi-Fi 6 Mesh.', enviada_em: '10:04', status: 'lido' },
      { id: 8, conversa_id: 3, autor_tipo: 'ia', conteudo: 'Olá Fernanda! Claro que sim. Como você já é assinante do plano 1GB Gamer, a troca para o roteador Wi-Fi 6 Mesh tem custo de apenas R$ 49,90 na próxima fatura. Deseja confirmar o upgrade e o agendamento da visita técnica?', enviada_em: '10:05', status: 'entregue' }`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log("Inbox Vendas patched");
