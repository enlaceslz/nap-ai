CREATE TABLE IF NOT EXISTS "incidentes_rede" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"regioes_afetadas" text NOT NULL,
	"concentrador_olt" varchar(255) DEFAULT 'OLT Central',
	"clientes_afetados" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'em_reparo' NOT NULL,
	"previsao_retorno" varchar(100),
	"iniciado_em" varchar(100) NOT NULL,
	"protocolo" varchar(100) NOT NULL,
	"descricao" text,
	"auto_interceptar" boolean DEFAULT true NOT NULL,
	"notificacoes_enviadas" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidentes_rede_status" ON "incidentes_rede" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidentes_rede_tipo" ON "incidentes_rede" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidentes_rede_protocolo" ON "incidentes_rede" USING btree ("protocolo");
