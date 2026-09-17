const fs = require('fs');
let code = fs.readFileSync('AGENTS.md', 'utf8');

if (!code.includes('Régua de Cobrança e Campanhas')) {
  code = code.replace(
    /- \*\*Portal do Cliente \(PWA\):\*\*/,
    `- **Régua de Cobrança e Campanhas (Marketing ISP):** Orquestrador em \`/admin/campanhas\` integrado ao backend (\`server/marketing/reguaRoutes.ts\`) para automatizar envios de cobrança via WABA com base no vencimento de faturas (D-3, D0, D+3, D+7) do ERP e push notifications.
- **Vitrine SaaS B2B:** Rota landing isolada (\`/nap\`) projetada para exibição aos ISPs, com conteúdo editável (Firestore \`system_config\`) pelo SuperAdmin.
- **Portal do Cliente (PWA):**`
  );
  fs.writeFileSync('AGENTS.md', code);
}
