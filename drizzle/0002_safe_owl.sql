CREATE TABLE "contratos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"numero_contrato" varchar(100) NOT NULL,
	"plano_nome" varchar(150) NOT NULL,
	"velocidade_download" integer,
	"velocidade_upload" integer,
	"valor_mensal" numeric(15, 2) NOT NULL,
	"dia_vencimento" integer NOT NULL,
	"status" varchar(50) DEFAULT 'ativo' NOT NULL,
	"data_ativacao" date,
	"data_cancelamento" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "helpdesk_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer,
	"entity" varchar(100),
	"entity_id" varchar(100),
	"action" varchar(100) NOT NULL,
	"actor_id" integer,
	"details" text,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "helpdesk_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text,
	"status" varchar(50) DEFAULT 'novo' NOT NULL,
	"prioridade" varchar(50) DEFAULT 'normal' NOT NULL,
	"cliente_id" integer,
	"assigned_to" integer,
	"external_id" varchar(100),
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ipam_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"object_type" varchar(100) NOT NULL,
	"object_id" varchar(100) NOT NULL,
	"before" text,
	"after" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ipam_bindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"backend" varchar(50) NOT NULL,
	"backend_object_id" varchar(100) NOT NULL,
	"nap_entity_type" varchar(100) NOT NULL,
	"nap_entity_id" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ipam_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"prefix_id" varchar(100) NOT NULL,
	"ip_address" varchar(100) NOT NULL,
	"customer_id" integer,
	"purpose" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario" varchar(150) NOT NULL,
	"usuario_email" varchar(255),
	"usuario_role" varchar(50),
	"modulo" varchar(100) NOT NULL,
	"acao" varchar(100) NOT NULL,
	"detalhes" text NOT NULL,
	"categoria" varchar(50) DEFAULT 'operacional',
	"severidade" varchar(20) DEFAULT 'info',
	"ip" varchar(50),
	"user_agent" text,
	"status" varchar(20) DEFAULT 'sucesso',
	"previous_hash" varchar(64) NOT NULL,
	"entry_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nap_customer_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"nap_customer_id" integer,
	"event_type" varchar(100) NOT NULL,
	"source" varchar(50),
	"reference_id" varchar(100),
	"metadata" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nap_customer_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"nap_customer_id" integer,
	"external_system" varchar(50) NOT NULL,
	"external_customer_id" varchar(100) NOT NULL,
	"last_sync_at" timestamp,
	"sync_status" varchar(50) DEFAULT 'synced',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nap_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'DISCONNECTED',
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos_transacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"fatura_id" integer NOT NULL,
	"cliente_id" integer NOT NULL,
	"txid" varchar(255) NOT NULL,
	"gateway" varchar(50) DEFAULT 'C6_BANK' NOT NULL,
	"valor" numeric(15, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'CONCLUIDO' NOT NULL,
	"e2e_id" varchar(255),
	"payload_retorno" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ordens_servico" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"tecnico_id" integer,
	"tipo" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"descricao" text NOT NULL,
	"data_agendamento" timestamp NOT NULL,
	"data_conclusao" timestamp,
	"sinal_optico_instalado" numeric(5, 2),
	"onu_serial" varchar(100),
	"observacoes_tecnicas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks_recebidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"origem" varchar(50) NOT NULL,
	"identificador_externo" varchar(255) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"processado_com_sucesso" boolean DEFAULT false NOT NULL,
	"resposta_http" integer DEFAULT 200,
	"erro_processamento" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" integer NOT NULL,
	"description" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer,
	"cliente_id" integer,
	"assigned_tech_id" integer,
	"type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'agendada' NOT NULL,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"started_at" timestamp,
	"arrived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimentos" ALTER COLUMN "prioridade" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "atendimentos" ALTER COLUMN "prioridade" SET DEFAULT 2;--> statement-breakpoint
ALTER TABLE "atendimentos" ALTER COLUMN "prioridade" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "documento" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "telefone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "plano" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversas" ALTER COLUMN "telefone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "conversas" ALTER COLUMN "cliente_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "conversas" ALTER COLUMN "cliente_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conversas" ALTER COLUMN "fila" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faturas" ALTER COLUMN "cliente_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "faturas" ALTER COLUMN "valor" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "faturas" ALTER COLUMN "vencimento" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "mensagens" ALTER COLUMN "conversa_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "mensagens" ALTER COLUMN "tipo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "cargo" SET DEFAULT 'ATENDIMENTO';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "ativo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD COLUMN "cliente_id" integer;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD COLUMN "criado_por" integer;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "whatsapp" varchar(50);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "endereco" text;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "bairro" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "cidade" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "cep" varchar(20);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "erp_origem" varchar(50) DEFAULT 'sgp';--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "erp_id" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "ultima_sincronizacao" timestamp;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversas" ADD COLUMN "canal" varchar(50) DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversas" ADD COLUMN "operador_responsavel_id" integer;--> statement-breakpoint
ALTER TABLE "conversas" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "contrato_id" integer;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "valor_pago" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "codigo_barras" text;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "pix_copia_e_cola" text;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "txid" varchar(255);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "data_pagamento" timestamp;--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "forma_pagamento" varchar(50);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "erp_fatura_id" varchar(100);--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "erp_baixa_status" varchar(50) DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE "faturas" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mensagens" ADD COLUMN "waba_message_id" varchar(255);--> statement-breakpoint
ALTER TABLE "mensagens" ADD COLUMN "status_entrega" varchar(50) DEFAULT 'enviado';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ramal" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ipam_reservations" ADD CONSTRAINT "ipam_reservations_customer_id_clientes_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nap_customer_events" ADD CONSTRAINT "nap_customer_events_nap_customer_id_clientes_id_fk" FOREIGN KEY ("nap_customer_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nap_customer_references" ADD CONSTRAINT "nap_customer_references_nap_customer_id_clientes_id_fk" FOREIGN KEY ("nap_customer_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos_transacoes" ADD CONSTRAINT "pagamentos_transacoes_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos_transacoes" ADD CONSTRAINT "pagamentos_transacoes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tecnico_id_users_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_evidence" ADD CONSTRAINT "work_order_evidence_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_tasks" ADD CONSTRAINT "work_order_tasks_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_ticket_id_helpdesk_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."helpdesk_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_tech_id_users_id_fk" FOREIGN KEY ("assigned_tech_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contratos_cliente_id" ON "contratos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_contratos_numero" ON "contratos" USING btree ("numero_contrato");--> statement-breakpoint
CREATE INDEX "idx_auditoria_modulo" ON "logs_auditoria" USING btree ("modulo");--> statement-breakpoint
CREATE INDEX "idx_auditoria_acao" ON "logs_auditoria" USING btree ("acao");--> statement-breakpoint
CREATE INDEX "idx_auditoria_created_at" ON "logs_auditoria" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transacoes_fatura_id" ON "pagamentos_transacoes" USING btree ("fatura_id");--> statement-breakpoint
CREATE INDEX "idx_transacoes_txid" ON "pagamentos_transacoes" USING btree ("txid");--> statement-breakpoint
CREATE INDEX "idx_os_cliente_id" ON "ordens_servico" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_os_tecnico_id" ON "ordens_servico" USING btree ("tecnico_id");--> statement-breakpoint
CREATE INDEX "idx_os_status" ON "ordens_servico" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_webhooks_origem_identificador" ON "webhooks_recebidos" USING btree ("origem","identificador_externo");--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_operador_responsavel_id_users_id_fk" FOREIGN KEY ("operador_responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_atendimentos_cliente_id" ON "atendimentos" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_atendimentos_pipeline" ON "atendimentos" USING btree ("pipeline");--> statement-breakpoint
CREATE INDEX "idx_atendimentos_estagio" ON "atendimentos" USING btree ("estagio");--> statement-breakpoint
CREATE INDEX "idx_clientes_documento" ON "clientes" USING btree ("documento");--> statement-breakpoint
CREATE INDEX "idx_clientes_telefone" ON "clientes" USING btree ("telefone");--> statement-breakpoint
CREATE INDEX "idx_clientes_whatsapp" ON "clientes" USING btree ("whatsapp");--> statement-breakpoint
CREATE INDEX "idx_clientes_status" ON "clientes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_clientes_erp_ref" ON "clientes" USING btree ("erp_origem","erp_id");--> statement-breakpoint
CREATE INDEX "idx_conversas_telefone" ON "conversas" USING btree ("telefone");--> statement-breakpoint
CREATE INDEX "idx_conversas_fila" ON "conversas" USING btree ("fila");--> statement-breakpoint
CREATE INDEX "idx_conversas_cliente_id" ON "conversas" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_faturas_cliente_id" ON "faturas" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "idx_faturas_vencimento" ON "faturas" USING btree ("vencimento");--> statement-breakpoint
CREATE INDEX "idx_faturas_status" ON "faturas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_faturas_txid" ON "faturas" USING btree ("txid");--> statement-breakpoint
CREATE INDEX "idx_mensagens_conversa_id" ON "mensagens" USING btree ("conversa_id");--> statement-breakpoint
CREATE INDEX "idx_mensagens_waba_id" ON "mensagens" USING btree ("waba_message_id");--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_txid_unique" UNIQUE("txid");--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_transaction_id_unique" UNIQUE("transaction_id");--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_idempotency_key_unique" UNIQUE("idempotency_key");--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_waba_message_id_unique" UNIQUE("waba_message_id");