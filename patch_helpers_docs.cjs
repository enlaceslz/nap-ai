const fs = require('fs');
let text = fs.readFileSync('src/pages/Helpers.tsx', 'utf8');

// We insert a new section object into the array
const newSection = `
    {
      id: 'communications-hub',
      category: 'noc',
      title: 'Communications Hub & Telegram',
      badge: 'Orquestração',
      icon: <MessageSquare className="text-cyan-400" size={24} />,
      tags: ['telegram', 'notificações', 'copilot', 'rag', 'noc', 'zabbix'],
      summary: 'Módulo transversal Omni-Channel para notificações estruturadas de alertas Zabbix, tarefas de campo e Copilot de IA RAG.',
      content: (
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-3">1. Arquitetura do Hub (PRD #71)</h3>
            <p className="text-sm text-slate-400 mb-4">
              O Telegram Operacional atua unicamente como gateway de I/O. Nenhuma regra de negócio reside no bot.
              O NAP (Node.js backend em <code>/server/communications</code>) realiza a orquestração via Event Engine, processando callbacks e garantindo aderência ao RBAC.
            </p>
            <ul className="list-disc list-inside text-sm text-slate-400 space-y-2">
              <li><strong>Zero Duplicação:</strong> O bot não cria clientes no banco. Apenas referencia UUIDs do Zabbix/SGP.</li>
              <li><strong>Copilot MCP:</strong> Ao enviar comandos naturais (ex: "Quantos offline?"), a Gemini 2.5 intercepta via Function Calling e aciona a tool <code>get_active_incidents</code> do Zabbix.</li>
              <li><strong>Idempotência:</strong> Push automático do Zabbix ↔ Hub ↔ Equipe sem sobreposição de mensagens.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'field-service',
      category: 'campo',
      title: 'Field Service (Ordens de Serviço)',
      badge: 'Operação',
      icon: <Wrench className="text-emerald-400" size={24} />,
      tags: ['os', 'técnicos', 'mobile', 'sgp', 'pwa'],
      summary: 'Gestão de ordens de serviço (OS) integrando NOC Zabbix, GIS e PWA de campo.',
      content: (
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-3">1. Ecossistema Field (Fase 8)</h3>
            <p className="text-sm text-slate-400 mb-4">
              O módulo <code>server/field/fieldRoutes.ts</code> expõe a malha REST de atividades de rua. Quando um técnico aciona "Cheguei" no app PWA, o Hub de comunicações recebe um <i>Push</i> e alerta o grupo do NOC automaticamente via Telegram.
            </p>
          </div>
        </div>
      )
    },`;

// Find where to inject: look for an existing section, e.g., the noc category one at line 586
// Easiest is to replace "const HELP_DATA: HelpSection[] = [" with "const HELP_DATA: HelpSection[] = [ \n" + newSection
text = text.replace(
  'const HELP_DATA: HelpSection[] = [',
  'const HELP_DATA: HelpSection[] = [\n' + newSection
);

fs.writeFileSync('src/pages/Helpers.tsx', text, 'utf8');
console.log('Helpers.tsx updated with new modules documentation.');
