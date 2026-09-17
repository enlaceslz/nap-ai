import { pgTable, serial, text, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senha: varchar('senha', { length: 255 }).notNull(),
  cargo: varchar('cargo', { length: 50 }).notNull(), // 'admin', 'operador', 'tecnico_campo', 'tecnico_noc'
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  documento: varchar('documento', { length: 20 }).notNull().unique(), // CPF/CNPJ
  telefone: varchar('telefone', { length: 20 }),
  contrato: varchar('contrato', { length: 50 }),
  plano: varchar('plano', { length: 100 }),
  status: varchar('status', { length: 50 }).default('ativo'), // ativo, bloqueado, cancelado
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const faturas = pgTable('faturas', {
  id: serial('id').primaryKey(),
  clienteId: serial('cliente_id').references(() => clientes.id),
  valor: varchar('valor', { length: 50 }).notNull(), // Pode ser decimal(10,2) na vida real, simplificando com varchar p/ demo
  vencimento: varchar('vencimento', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'pendente', 'pago', 'vencido'
  linhaDigitavel: text('linha_digitavel'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const atendimentos = pgTable('atendimentos', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  estagio: varchar('estagio', { length: 100 }).notNull(),
  pipeline: varchar('pipeline', { length: 100 }).notNull(),
  contato: varchar('contato', { length: 255 }),
  telefone: varchar('telefone', { length: 50 }),
  endereco: text('endereco'),
  plano: varchar('plano', { length: 100 }),
  prioridade: integer('prioridade'),
  contextoIa: text('contexto_ia'),
  criadoEm: varchar('criado_em', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const conversas = pgTable('conversas', {
  id: serial('id').primaryKey(),
  telefone: varchar('telefone', { length: 20 }).notNull().unique(), // O ID do WABA ou telefone real
  nomeCliente: varchar('nome_cliente', { length: 255 }),
  clienteId: serial('cliente_id').references(() => clientes.id),
  fila: varchar('fila', { length: 50 }).default('triagem_ia'), // 'triagem_ia', 'fila_geral', 'meus', 'finalizados'
  statusConexao: text('status_conexao'), // JSON com uptime, sinal onu etc p/ contexto
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mensagens = pgTable('mensagens', {
  id: serial('id').primaryKey(),
  conversaId: serial('conversa_id').references(() => conversas.id),
  remetente: varchar('remetente', { length: 50 }).notNull(), // 'cliente', 'operador', 'ia', 'sistema'
  conteudo: text('conteudo').notNull(),
  tipo: varchar('tipo', { length: 50 }).default('texto'), // 'texto', 'audio', 'imagem'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- HELP DESK & WORK ORDERS ---

export const helpdesk_queues = pgTable('helpdesk_queues', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  active: boolean('active').default(true),
});

export const helpdesk_slas = pgTable('helpdesk_slas', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  response_minutes: serial('response_minutes'),
  resolution_minutes: serial('resolution_minutes'),
  priority: varchar('priority', { length: 50 }).notNull(),
  active: boolean('active').default(true),
});

export const helpdesk_tickets = pgTable('helpdesk_tickets', {
  id: serial('id').primaryKey(),
  external_id: varchar('external_id', { length: 255 }),
  backend_id: varchar('backend_id', { length: 255 }), // Zammad ID
  backend_type: varchar('backend_type', { length: 50 }).default('zammad'),
  customer_id: integer('customer_id').references(() => clientes.id),
  incident_id: varchar('incident_id', { length: 255 }), // Zabbix or GIS incident
  priority: varchar('priority', { length: 50 }).default('normal'),
  status: varchar('status', { length: 50 }).default('novo'),
  queue_id: integer('queue_id').references(() => helpdesk_queues.id),
  sla_id: integer('sla_id').references(() => helpdesk_slas.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  source: varchar('source', { length: 50 }).default('manual'), // manual, zabbix, ia, waba
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  closed_at: timestamp('closed_at'),
});

export const work_orders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  ticket_id: integer('ticket_id').references(() => helpdesk_tickets.id),
  incident_id: varchar('incident_id', { length: 255 }),
  customer_id: serial('customer_id').references(() => clientes.id),
  technician_id: serial('technician_id').references(() => users.id),
  team_id: varchar('team_id', { length: 100 }),
  status: varchar('status', { length: 50 }).default('ABERTA'),
  priority: varchar('priority', { length: 50 }).default('NORMAL'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  scheduled_at: timestamp('scheduled_at'),
  started_at: timestamp('started_at'),
  arrived_at: timestamp('arrived_at'),
  completed_at: timestamp('completed_at'),
  closed_at: timestamp('closed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const work_order_tasks = pgTable('work_order_tasks', {
  id: serial('id').primaryKey(),
  work_order_id: serial('work_order_id').references(() => work_orders.id),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).default('pendente'),
  technician_id: serial('technician_id').references(() => users.id),
  completed_at: timestamp('completed_at'),
});

export const work_order_evidence = pgTable('work_order_evidence', {
  id: serial('id').primaryKey(),
  work_order_id: serial('work_order_id').references(() => work_orders.id),
  type: varchar('type', { length: 50 }).notNull(), // photo, signature, document
  storage_key: text('storage_key').notNull(),
  checksum: varchar('checksum', { length: 255 }),
  metadata: text('metadata'),
  created_by: serial('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const helpdesk_assignments = pgTable('helpdesk_assignments', {
  id: serial('id').primaryKey(),
  ticket_id: serial('ticket_id').references(() => helpdesk_tickets.id),
  technician_id: serial('technician_id').references(() => users.id),
  assigned_at: timestamp('assigned_at').defaultNow(),
  accepted_at: timestamp('accepted_at'),
  completed_at: timestamp('completed_at'),
});

export const helpdesk_audit = pgTable('helpdesk_audit', {
  id: serial('id').primaryKey(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entity_id: varchar('entity_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  actor_id: varchar('actor_id', { length: 100 }).notNull(),
  old_value: text('old_value'),
  new_value: text('new_value'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// --- IPAM & NETWORK SOURCE OF TRUTH (NSoT) ---

export const ipam_bindings = pgTable('ipam_bindings', {
  id: serial('id').primaryKey(),
  backend: varchar('backend', { length: 50 }).default('nautobot'),
  backend_object_id: varchar('backend_object_id', { length: 255 }).notNull(),
  nap_entity_type: varchar('nap_entity_type', { length: 100 }).notNull(),
  nap_entity_id: varchar('nap_entity_id', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const ipam_sync_events = pgTable('ipam_sync_events', {
  id: serial('id').primaryKey(),
  backend: varchar('backend', { length: 50 }).default('nautobot'),
  object_type: varchar('object_type', { length: 100 }),
  object_id: varchar('object_id', { length: 255 }),
  event_type: varchar('event_type', { length: 100 }),
  payload_hash: varchar('payload_hash', { length: 255 }),
  status: varchar('status', { length: 50 }),
  error: text('error'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const ipam_reservations = pgTable('ipam_reservations', {
  id: serial('id').primaryKey(),
  prefix_id: varchar('prefix_id', { length: 255 }),
  ip_address: varchar('ip_address', { length: 50 }).notNull(),
  customer_id: serial('customer_id').references(() => clientes.id),
  service_id: varchar('service_id', { length: 100 }),
  purpose: varchar('purpose', { length: 255 }),
  status: varchar('status', { length: 50 }).default('reserved'),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const ipam_audit = pgTable('ipam_audit', {
  id: serial('id').primaryKey(),
  actor_id: varchar('actor_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  object_type: varchar('object_type', { length: 100 }),
  object_id: varchar('object_id', { length: 255 }),
  before: text('before'),
  after: text('after'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
