const fs = require('fs');
let code = fs.readFileSync('src/pages/Helpers.tsx', 'utf8');

// I need to add some sections to the Help documentation (Helpers.tsx)
// Wait, Helpers.tsx is already 120KB. I'll just append something gracefully or replace one part if it doesn't exist.

const reguaDoc = `
    {
      id: 'regua-cobranca',
      category: 'crm_kanban',
      title: 'Régua de Cobrança e Campanhas',
      badge: 'Automação Financeira',
      icon: <Megaphone size={18} className="text-amber-400" />,
      tags: ['WABA', 'Marketing', 'Faturas', 'Cron'],
      summary: 'Configuração e disparo da Régua Automática de Cobrança (D-3, D0, D+3, D+7) via WABA.',
      content: (
        <div className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p>
              O Módulo de Campanhas permite agendar e automatizar o envio de notificações de cobrança diretamente no WhatsApp dos clientes, com base no vencimento de suas faturas sincronizadas no SGP/ERP.
            </p>
            <h4>Ciclo de Disparos:</h4>
            <ul>
              <li><strong>D-3 (Lembrete Prévio):</strong> Dispara 3 dias antes do vencimento com o código PIX para incentivar pagamentos com desconto.</li>
              <li><strong>D0 (Vencimento):</strong> Alerta no dia exato de fechamento da fatura.</li>
              <li><strong>D+3 (Atraso Leve):</strong> Alerta de vencimento ultrapassado, lembrando o risco de bloqueio.</li>
              <li><strong>D+7 (Alerta de Suspensão):</strong> Notificação de bloqueio parcial ativado, emitindo boleto com juros e solicitando pagamento imediato.</li>
            </ul>
            <h4>Configuração:</h4>
            <p>O painel permite simulação de envios. No servidor, a rota <code>/api/cobranca/regua/executar</code> orquestra as regras consumindo dados do PostgreSQL via Drizzle e disparando para o Webhook WABA.</p>
          </div>
        </div>
      )
    },
`;

const napDoc = `
    {
      id: 'vitrine-nap',
      category: 'portal',
      title: 'Vitrine B2B SaaS (/nap)',
      badge: 'Vendas ISP',
      icon: <Globe size={18} className="text-blue-400" />,
      tags: ['Landing Page', 'SaaS', 'B2B'],
      summary: 'Gestão da Landing Page Comercial em /nap.',
      content: (
        <div className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p>
              Para ajudar os ISPs a escalarem, o NAP possui uma rota paralela isolada em <code>/nap</code>. Esta Landing Page funciona como um mostruário SaaS B2B, independente do Portal do Cliente final.
            </p>
            <ul>
              <li><strong>Edição Dinâmica:</strong> O conteúdo (textos e preços) é editável in-line se o usuário for um <code>Super Admin</code> e os dados são gravados no Firebase Firestore (Collection: system_config).</li>
              <li><strong>Isolamento:</strong> A rota principal <code>/</code> permanece como página do provedor, garantindo foco para o cliente B2C.</li>
            </ul>
          </div>
        </div>
      )
    },
`;

// Insert the new objects into the helpSections array
if (!code.includes("Régua de Cobrança e Campanhas") && !code.includes("Vitrine B2B SaaS")) {
  code = code.replace(
    /const helpSections: HelpSection\[\] = \[/,
    'const helpSections: HelpSection[] = [\n' + reguaDoc + napDoc
  );
  fs.writeFileSync('src/pages/Helpers.tsx', code);
}
