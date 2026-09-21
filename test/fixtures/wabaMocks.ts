/**
 * Fixtures de Desenvolvimento e Testes para WABA (WhatsApp Cloud API)
 * ESTE ARQUIVO É DESTINADO EXCLUSIVAMENTE PARA TESTES E DESENVOLVIMENTO LOCAL.
 * PROIBIDO O USO OU IMPORTAÇÃO EM CAMINHOS DE EXECUÇÃO DE PRODUÇÃO (NODE_ENV=production).
 */

export const devMockWabaChats = [
  {
    id: 1,
    canal: "whatsapp",
    contatoId: 9982,
    nomeCliente: "Maria Oliveira",
    telefone: "(11) 98765-4321",
    status: "aberta",
    fila: "Suporte Técnico N1",
    prioridade: 1,
    updatedAt: new Date()
  },
  {
    id: 2,
    canal: "whatsapp",
    contatoId: 9985,
    nomeCliente: "Carlos Eduardo Silva",
    telefone: "(11) 97654-3210",
    status: "aberta",
    fila: "Financeiro & Cobrança",
    prioridade: 2,
    updatedAt: new Date()
  },
  {
    id: 3,
    canal: "webchat",
    contatoId: 9990,
    nomeCliente: "Fernanda Costa",
    telefone: "(11) 96543-2109",
    status: "aberta",
    fila: "Vendas & Upgrades",
    prioridade: 3,
    updatedAt: new Date()
  },
  {
    id: 4,
    canal: "whatsapp",
    contatoId: 9999,
    nomeCliente: "João Cliente (Teste IA)",
    telefone: "(11) 91111-2222",
    status: "triagem_ia",
    fila: "Triagem IA",
    prioridade: 1,
    updatedAt: new Date()
  }
];

export const devMockWabaMessages = [
  { id: 1, conversaId: 1, remetente: "cliente", conteudo: "Olá, bom dia! Notei uma pequena oscilação na velocidade da internet aqui em casa.", status: "lido", createdAt: new Date(Date.now() - 3600000) },
  { id: 2, conversaId: 1, remetente: "ia", conteudo: "Olá, Maria! Verifiquei sua ONU no sistema SGP: o sinal óptico está em -19.4 dBm (excelente) e a sessão PPPoE está ativa há 15 dias. Como posso te auxiliar no diagnóstico?", status: "lido", createdAt: new Date(Date.now() - 3500000) },
  { id: 3, conversaId: 1, remetente: "operador", autorTipo: "operador", tipo: "nota_interna", conteudo: "Cliente ligou ontem com o mesmo sintoma. Roteador dela é Wi-Fi 5 dual-band no canal 36.", status: "entregue", createdAt: new Date(Date.now() - 3400000) },
  { id: 4, conversaId: 1, remetente: "cliente", conteudo: "Estou usando o Wi-Fi no quarto do fundo. Poderia verificar se o roteador precisa ser reiniciado?", status: "entregue", createdAt: new Date(Date.now() - 3300000) },
  { id: 5, conversaId: 2, remetente: "cliente", conteudo: "Bom dia! Gostaria de pagar minha mensalidade via PIX, pode me mandar a chave copia e cola?", status: "lido", createdAt: new Date(Date.now() - 2500000) },
  { id: 6, conversaId: 2, remetente: "ia", conteudo: "Com certeza, Carlos! Estou localizando sua fatura com vencimento em 05/09.", status: "lido", createdAt: new Date(Date.now() - 2400000) },
  { id: 7, conversaId: 3, remetente: "cliente", conteudo: "Olá, gostaria de saber se é possível fazer o upgrade para o roteador Wi-Fi 6 Mesh.", status: "lido", createdAt: new Date(Date.now() - 1500000) },
  { id: 8, conversaId: 3, remetente: "ia", conteudo: "Olá Fernanda! Claro que sim. Como você já é assinante do plano 1GB Gamer, a troca para o roteador Wi-Fi 6 Mesh tem custo de apenas R$ 49,90 na próxima fatura.", status: "entregue", createdAt: new Date(Date.now() - 1400000) },
  { id: 10, conversaId: 4, remetente: "ia", conteudo: "Olá João! Sou o MaIA do DJD Telecom. Identifiquei seu contrato, como posso ajudar hoje?", status: "entregue", createdAt: new Date(Date.now() - 500000) }
];
