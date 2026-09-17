const fs = require('fs');
let code = fs.readFileSync('server/agent/toolRegistry.ts', 'utf8');

const newTool = `
// 10. Tool: Captura de Lead / Criação de Oportunidade no CRM
agentToolRegistry.register({
  name: "criar_lead_vendas",
  label: "Criar Lead no Kanban CRM",
  description: "Cria uma nova oportunidade de venda no funil do Kanban (CRM) quando um visitante/prospect demonstra interesse em assinar um plano de internet, informando nome, plano desejado e CEP.",
  category: "comercial",
  keywords: ["assinar", "comprar", "plano", "contratar", "lead", "viabilidade", "novo cliente", "vendas"],
  parametersSchema: {
    type: "OBJECT",
    properties: {
      nome: { type: "STRING", description: "Nome do potencial cliente" },
      telefone: { type: "STRING", description: "Telefone ou WhatsApp do cliente" },
      plano_interesse: { type: "STRING", description: "Plano de internet que demonstrou interesse (ex: 500 Mega, 1 Giga)" },
      endereco_cep: { type: "STRING", description: "Endereço ou CEP informado pelo cliente" }
    },
    required: ["nome", "telefone"]
  },
  execute: async ({ prompt, telefone, contexto, ...args }) => {
    const nome = args.nome || "Novo Prospect";
    const telefoneFinal = args.telefone || telefone || "(00) 00000-0000";
    const plano = args.plano_interesse || "A definir";
    const endereco = args.endereco_cep || "A consultar";

    const dados = {
      titulo: \`Lead via WhatsApp: \${nome}\`,
      contato: nome,
      telefone: telefoneFinal,
      plano_interesse: plano,
      endereco: endereco,
      status: "lead_criado",
      acao_sugerida: "handoff_vendas"
    };

    const resposta = \`Excelente escolha! Já separei as melhores condições para o plano de \${plano}. Estou transferindo o nosso atendimento agora mesmo para a nossa equipe de vendas concluir a sua viabilidade para \${endereco} e agendar sua instalação!\`;

    return {
      toolExecutada: "criar_lead_vendas",
      toolDados: dados,
      respostaGerada: resposta,
      handoff: true,
      fila_destino: 'vendas'
    };
  }
});
`;

code = code + '\n' + newTool;
fs.writeFileSync('server/agent/toolRegistry.ts', code);
