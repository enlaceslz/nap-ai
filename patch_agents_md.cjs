const fs = require('fs');
let text = fs.readFileSync('AGENTS.md', 'utf8');

const archUpdate = `
- **Communications Hub (Telegram & RAG):** Módulo orquestrador central em \`/server/communications/\`. Recebe payloads do Event Engine (Zabbix/GIS) e notifica via Telegram Gateway. Contém o \`NocCopilot\` (AI Gateway via Gemini) com ferramentas MCP para consultar incidentes e OS via linguagem natural, blindando o backend contra comandos não autorizados (RBAC + Event Driven).
- **Field Service (SGP Mobile):** Desacoplado em \`/server/field/\`. Fornece endpoints REST para Ordens de Serviço. Integra-se nativamente com o Communications Hub para disparar avisos de "ACK" e "Mudança de Status" quando o técnico de campo atualiza via PWA.
- **Event-Driven Correlation (Zabbix -> Hub -> Telegram):** Todos os alarmes críticos gerados no Zabbix e os rompimentos estimados de fibra do GIS (Cálculo OTDR) engatilham a orquestração via webhook local disparando para o Hub.`;

text = text.replace(
  '- **Credenciais Nativas de Infraestrutura:**',
  archUpdate + '\n- **Credenciais Nativas de Infraestrutura:**'
);

fs.writeFileSync('AGENTS.md', text, 'utf8');
console.log('AGENTS.md updated.');
