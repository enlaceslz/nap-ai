import { pgTable, serial, text, timestamp, varchar, boolean, integer, numeric, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * 1. USUÁRIOS & CONTROLE DE ACESSO (RBAC)
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senha: varchar('senha', { length: 255 }).notNull(),
  cargo: varchar('cargo', { length: 50 }).notNull().default('ATENDIMENTO'), // ADMIN, GESTOR, NOC, SUPORTE, FINANCEIRO, CAMPO, ATENDIMENTO, AUDITOR
  ramal: varchar('ramal', { length: 20 }),
  ativo: boolean('ativo').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 2. CUSTOMER 360 - TABELA OFICIAL CENTRAL (CLIENTES / ASSINANTES)
 * Fonte de verdade única para CRM, ERPs (SGP, IXC, Hubsoft) e WABA
 */
export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  documento: varchar('documento', { length: 50 }).notNull().unique(), // CPF ou CNPJ normalizado
  email: varchar('email', { length: 255 }),
  telefone: varchar('telefone', { length: 50 }),
  whatsapp: varchar('whatsapp', { length: 50 }),
  contrato: varchar('contrato', { length: 50 }),
  plano: varchar('plano', { length: 150 }),
  status: varchar('status', { length: 50 }).default('ativo').notNull(), // ativo, bloqueado, cancelado, negociacao
  endereco: text('endereco'),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  cep: varchar('cep', { length: 20 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  
  // Metadados de sincronismo com ERP
  erpOrigem: varchar('erp_origem', { length: 50 }).default('sgp'),
  erpId: varchar('erp_id', { length: 100 }),
  ultimaSincronizacao: timestamp('ultima_sincronizacao'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete LGPD
}, (table) => {
  return {
    documentoIdx: index('idx_clientes_documento').on(table.documento),
    telefoneIdx: index('idx_clientes_telefone').on(table.telefone),
    whatsappIdx: index('idx_clientes_whatsapp').on(table.whatsapp),
    statusIdx: index('idx_clientes_status').on(table.status),
    erpRefIdx: index('idx_clientes_erp_ref').on(table.erpOrigem, table.erpId)
  };
});

/**
 * 3. CONTRATOS E SERVIÇOS TÉCNICOS ASSOCIADOS AO CLIENTE
 */
export const contratos = pgTable('contratos', {
  id: serial('id').primaryKey(),
  clienteId: integer('cliente_id').references(() => clientes.id).notNull(),
  numeroContrato: varchar('numero_contrato', { length: 100 }).notNull(),
  planoNome: varchar('plano_nome', { length: 150 }).notNull(),
  velocidadeDownload: integer('velocidade_download'), // Mbps
  velocidadeUpload: integer('velocidade_upload'), // Mbps
  valorMensal: numeric('valor_mensal', { precision: 15, scale: 2 }).notNull(),
  diaVencimento: integer('dia_vencimento').notNull(),
  status: varchar('status', { length: 50 }).default('ativo').notNull(),
  dataAtivacao: date('data_ativacao'),
  dataCancelamento: date('data_cancelamento'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    clienteContratoIdx: index('idx_contratos_cliente_id').on(table.clienteId),
    numContratoIdx: index('idx_contratos_numero').on(table.numeroContrato)
  };
});

/**
 * 4. FATURAS & COBRANÇAS FINANCEIRAS
 */
export const faturas = pgTable('faturas', {
  id: serial('id').primaryKey(),
  clienteId: integer('cliente_id').references(() => clientes.id).notNull(),
  contratoId: integer('contrato_id').references(() => contratos.id),
  valor: numeric('valor', { precision: 15, scale: 2 }).notNull(),
  valorPago: numeric('valor_pago', { precision: 15, scale: 2 }),
  vencimento: date('vencimento').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'pendente', 'pago', 'vencido', 'cancelado'
  linhaDigitavel: text('linha_digitavel'),
  codigoBarras: text('codigo_barras'),
  pixCopiaECola: text('pix_copia_e_cola'),
  txid: varchar('txid', { length: 255 }).unique(), // TXID Oficial PIX (Banco C6)
  transactionId: varchar('transaction_id', { length: 255 }).unique(), // ID da transação no Gateway
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
  dataPagamento: timestamp('data_pagamento'),
  formaPagamento: varchar('forma_pagamento', { length: 50 }), // 'PIX', 'BOLETO', 'CARTAO'
  erpFaturaId: varchar('erp_fatura_id', { length: 100 }),
  erpBaixaStatus: varchar('erp_baixa_status', { length: 50 }).default('pendente'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    clienteIdx: index('idx_faturas_cliente_id').on(table.clienteId),
    vencimentoIdx: index('idx_faturas_vencimento').on(table.vencimento),
    statusIdx: index('idx_faturas_status').on(table.status),
    txidIdx: index('idx_faturas_txid').on(table.txid)
  };
});

/**
 * 5. TRANSAÇÕES DE PAGAMENTO (LOG FINANCEIRO DETALHADO)
 */
export const pagamentos_transacoes = pgTable('pagamentos_transacoes', {
  id: serial('id').primaryKey(),
  faturaId: integer('fatura_id').references(() => faturas.id).notNull(),
  clienteId: integer('cliente_id').references(() => clientes.id).notNull(),
  txid: varchar('txid', { length: 255 }).notNull(),
  gateway: varchar('gateway', { length: 50 }).default('C6_BANK').notNull(), // C6_BANK, ENLACE_PAY, MANUAL
  valor: numeric('valor', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('CONCLUIDO').notNull(),
  e2eId: varchar('e2e_id', { length: 255 }), // End-to-End ID do Banco Central
  payloadRetorno: text('payload_retorno'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    faturaTransacaoIdx: index('idx_transacoes_fatura_id').on(table.faturaId),
    txidTransacaoIdx: index('idx_transacoes_txid').on(table.txid)
  };
});

/**
 * 6. CONVERSAS & MENSAGENS (WHATSAPP WABA / WEBCHAT / OMNICHANNEL)
 */
export const conversas = pgTable('conversas', {
  id: serial('id').primaryKey(),
  telefone: varchar('telefone', { length: 50 }).notNull().unique(), // Telefone normalizado com DDI
  nomeCliente: varchar('nome_cliente', { length: 255 }),
  clienteId: integer('cliente_id').references(() => clientes.id),
  canal: varchar('canal', { length: 50 }).default('whatsapp').notNull(), // 'whatsapp', 'webchat', 'portal'
  fila: varchar('fila', { length: 50 }).default('triagem_ia').notNull(), // 'triagem_ia', 'fila_geral', 'suporte_n1', 'suporte_n2', 'financeiro', 'finalizados'
  operadorResponsavelId: integer('operador_responsavel_id').references(() => users.id),
  statusConexao: text('status_conexao'), // Contexto TR-069 / ONU em cache
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => {
  return {
    telefoneIdx: index('idx_conversas_telefone').on(table.telefone),
    filaIdx: index('idx_conversas_fila').on(table.fila),
    clienteIdIdx: index('idx_conversas_cliente_id').on(table.clienteId)
  };
});

export const mensagens = pgTable('mensagens', {
  id: serial('id').primaryKey(),
  conversaId: integer('conversa_id').references(() => conversas.id).notNull(),
  remetente: varchar('remetente', { length: 50 }).notNull(), // 'cliente', 'operador', 'ia', 'sistema'
  conteudo: text('conteudo').notNull(),
  tipo: varchar('tipo', { length: 50 }).default('texto').notNull(), // 'texto', 'audio', 'imagem', 'documento'
  wabaMessageId: varchar('waba_message_id', { length: 255 }).unique(), // Idempotência de mensagens Meta
  statusEntrega: varchar('status_entrega', { length: 50 }).default('enviado'), // 'enviado', 'entregue', 'lido', 'falha'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    conversaIdx: index('idx_mensagens_conversa_id').on(table.conversaId),
    wabaMsgIdx: index('idx_mensagens_waba_id').on(table.wabaMessageId)
  };
});

/**
 * 7. HELP DESK, TICKETS E ATENDIMENTOS UNIFICADOS
 */
export const atendimentos = pgTable('atendimentos', {
  id: serial('id').primaryKey(),
  clienteId: integer('cliente_id').references(() => clientes.id),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  estagio: varchar('estagio', { length: 100 }).notNull(), // 'triagem', 'em_analise', 'visita_agendada', 'resolvido'
  pipeline: varchar('pipeline', { length: 100 }).notNull(), // 'suporte', 'vendas', 'financeiro', 'noc'
  contato: varchar('contato', { length: 255 }),
  telefone: varchar('telefone', { length: 50 }),
  endereco: text('endereco'),
  plano: varchar('plano', { length: 100 }),
  prioridade: integer('prioridade').default(2), // 1: Baixa, 2: Media, 3: Alta, 4: Urgente
  contextoIa: text('contexto_ia'),
  criadoEm: varchar('criado_em', { length: 50 }),
  criadoPor: integer('criado_por').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    clienteAtendimentoIdx: index('idx_atendimentos_cliente_id').on(table.clienteId),
    pipelineIdx: index('idx_atendimentos_pipeline').on(table.pipeline),
    estagioIdx: index('idx_atendimentos_estagio').on(table.estagio)
  };
});

/**
 * 8. ORDENS DE SERVIÇO / FIELD SERVICE (TÉCNICOS DE CAMPO)
 */
export const ordens_servico = pgTable('ordens_servico', {
  id: serial('id').primaryKey(),
  clienteId: integer('cliente_id').references(() => clientes.id).notNull(),
  tecnicoId: integer('tecnico_id').references(() => users.id),
  tipo: varchar('tipo', { length: 100 }).notNull(), // 'instalacao', 'reparo', 'mudanca_endereco', 'recolhimento'
  status: varchar('status', { length: 50 }).default('pendente').notNull(), // 'pendente', 'em_deslocamento', 'em_execucao', 'concluido', 'cancelado'
  descricao: text('descricao').notNull(),
  dataAgendamento: timestamp('data_agendamento').notNull(),
  dataConclusao: timestamp('data_conclusao'),
  sinalOpticoInstalado: numeric('sinal_optico_instalado', { precision: 5, scale: 2 }), // dBm
  onuSerial: varchar('onu_serial', { length: 100 }),
  observacoesTecnicas: text('observacoes_tecnicas'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    clienteOsIdx: index('idx_os_cliente_id').on(table.clienteId),
    tecnicoOsIdx: index('idx_os_tecnico_id').on(table.tecnicoId),
    statusOsIdx: index('idx_os_status').on(table.status)
  };
});

/**
 * 9. AUDITORIA APPEND-ONLY (LGPD & COMPLIANCE TELECOM)
 * Registros imutáveis com encadeamento de hash SHA-256
 */
export const logs_auditoria = pgTable('logs_auditoria', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 100 }),
  usuario: varchar('usuario', { length: 150 }).notNull(),
  usuarioEmail: varchar('usuario_email', { length: 255 }),
  usuarioRole: varchar('usuario_role', { length: 50 }),
  requestId: varchar('request_id', { length: 100 }), // correlationId
  modulo: varchar('modulo', { length: 100 }).notNull(),
  acao: varchar('acao', { length: 100 }).notNull(),
  recurso: varchar('recurso', { length: 150 }),
  resultado: varchar('resultado', { length: 50 }).default('sucesso'), // 'sucesso', 'falha', 'bloqueado'
  detalhes: text('detalhes').notNull(),
  categoria: varchar('categoria', { length: 50 }).default('operacional'),
  severidade: varchar('severidade', { length: 20 }).default('info'), // 'info', 'atencao', 'critico'
  ip: varchar('ip', { length: 50 }),
  userAgent: text('user_agent'),
  status: varchar('status', { length: 20 }).default('sucesso'),
  previousHash: varchar('previous_hash', { length: 64 }).notNull(),
  entryHash: varchar('entry_hash', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    moduloIdx: index('idx_auditoria_modulo').on(table.modulo),
    acaoIdx: index('idx_auditoria_acao').on(table.acao),
    createdAtIdx: index('idx_auditoria_created_at').on(table.createdAt),
    requestIdIdx: index('idx_auditoria_request_id').on(table.requestId)
  };
});

/**
 * 10. WEBHOOKS RECEBIDOS (IDEMPOTÊNCIA & REPLAY PROTECTION)
 */
export const webhooks_recebidos = pgTable('webhooks_recebidos', {
  id: serial('id').primaryKey(),
  origem: varchar('origem', { length: 50 }).notNull(), // 'waba', 'c6_bank', 'zabbix', 'zammad'
  identificadorExterno: varchar('identificador_externo', { length: 255 }).notNull(), // wabaMessageId, txid, eventId
  payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  processadoComSucesso: boolean('processado_com_sucesso').default(false).notNull(),
  respostaHttp: integer('resposta_http').default(200),
  erroProcessamento: text('erro_processamento'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    origemIdUniq: uniqueIndex('uniq_webhooks_origem_identificador').on(table.origem, table.identificadorExterno)
  };
});

/**
 * 11. TABELAS DE COMPATIBILIDADE E ALIASES LEGADOS
 * Mantidas para que código em transição continue compilando perfeitamente sem quebras de tipos
 */
export const nap_customers = clientes;
export const nap_invoices = faturas;
export const nap_payment_transactions = pagamentos_transacoes;
export const waba_webhooks = webhooks_recebidos;

export const nap_customer_references = pgTable('nap_customer_references', {
  id: serial('id').primaryKey(),
  napCustomerId: integer('nap_customer_id').references(() => clientes.id),
  externalSystem: varchar('external_system', { length: 50 }).notNull(),
  externalCustomerId: varchar('external_customer_id', { length: 100 }).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: varchar('sync_status', { length: 50 }).default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const nap_customer_events = pgTable('nap_customer_events', {
  id: serial('id').primaryKey(),
  napCustomerId: integer('nap_customer_id').references(() => clientes.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  source: varchar('source', { length: 50 }),
  referenceId: varchar('reference_id', { length: 100 }),
  metadata: text('metadata'),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const nap_integrations = pgTable('nap_integrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('DISCONNECTED'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * 12. HELPDESK & TICKETING AVANÇADO (INTEGRAÇÃO ZAMMAD/OSTICKET)
 */
export const helpdesk_tickets = pgTable('helpdesk_tickets', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  descricao: text('descricao'),
  status: varchar('status', { length: 50 }).default('novo').notNull(), // 'novo', 'aberto', 'pendente', 'fechado'
  prioridade: varchar('prioridade', { length: 50 }).default('normal').notNull(),
  cliente_id: integer('cliente_id').references(() => clientes.id),
  assigned_to: integer('assigned_to').references(() => users.id),
  external_id: varchar('external_id', { length: 100 }),
  closed_at: timestamp('closed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const work_orders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  ticket_id: integer('ticket_id').references(() => helpdesk_tickets.id),
  cliente_id: integer('cliente_id').references(() => clientes.id),
  assigned_tech_id: integer('assigned_tech_id').references(() => users.id),
  type: varchar('type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('agendada').notNull(),
  scheduled_start: timestamp('scheduled_start'),
  scheduled_end: timestamp('scheduled_end'),
  started_at: timestamp('started_at'),
  arrived_at: timestamp('arrived_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const work_order_tasks = pgTable('work_order_tasks', {
  id: serial('id').primaryKey(),
  work_order_id: integer('work_order_id').references(() => work_orders.id).notNull(),
  description: text('description').notNull(),
  completed: boolean('completed').default(false).notNull(),
  completed_at: timestamp('completed_at'),
});

export const work_order_evidence = pgTable('work_order_evidence', {
  id: serial('id').primaryKey(),
  work_order_id: integer('work_order_id').references(() => work_orders.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'photo', 'signature', 'optical_reading'
  url: text('url').notNull(),
  captured_at: timestamp('captured_at').defaultNow().notNull(),
});

export const helpdesk_audit = pgTable('helpdesk_audit', {
  id: serial('id').primaryKey(),
  ticket_id: integer('ticket_id'),
  entity: varchar('entity', { length: 100 }),
  entity_id: varchar('entity_id', { length: 100 }),
  action: varchar('action', { length: 100 }).notNull(),
  actor_id: integer('actor_id'),
  details: text('details'),
  old_value: text('old_value'),
  new_value: text('new_value'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 13. IPAM & NSoT (NETWORK SOURCE OF TRUTH - NAUTOBOT/NETBOX)
 */
export const ipam_bindings = pgTable('ipam_bindings', {
  id: serial('id').primaryKey(),
  backend: varchar('backend', { length: 50 }).notNull(),
  backend_object_id: varchar('backend_object_id', { length: 100 }).notNull(),
  nap_entity_type: varchar('nap_entity_type', { length: 100 }).notNull(),
  nap_entity_id: varchar('nap_entity_id', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const ipam_audit = pgTable('ipam_audit', {
  id: serial('id').primaryKey(),
  actor_id: integer('actor_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  object_type: varchar('object_type', { length: 100 }).notNull(),
  object_id: varchar('object_id', { length: 100 }).notNull(),
  before: text('before'),
  after: text('after'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const ipam_reservations = pgTable('ipam_reservations', {
  id: serial('id').primaryKey(),
  prefix_id: varchar('prefix_id', { length: 100 }).notNull(),
  ip_address: varchar('ip_address', { length: 100 }).notNull(),
  customer_id: integer('customer_id').references(() => clientes.id),
  purpose: varchar('purpose', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
