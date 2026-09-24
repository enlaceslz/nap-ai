DO $$ 
BEGIN
  -- 1. Remoção do default artificial em incidentes_rede
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidentes_rede' AND column_name = 'concentrador_olt'
  ) THEN
    ALTER TABLE "incidentes_rede" ALTER COLUMN "concentrador_olt" DROP DEFAULT;
  END IF;

  -- 2. Colunas granulares para rastreabilidade individual em incident_notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_notifications' AND column_name = 'recipient_type') THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "recipient_type" varchar(50) DEFAULT 'cliente' NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_notifications' AND column_name = 'recipient_id') THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "recipient_id" integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_notifications' AND column_name = 'requested_at') THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "requested_at" timestamp DEFAULT now() NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_notifications' AND column_name = 'accepted_at') THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "accepted_at" timestamp;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_notifications' AND column_name = 'attempt_count') THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "attempt_count" integer DEFAULT 1 NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regua_execucoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"fase" varchar(50) NOT NULL,
	"total_faturas" integer DEFAULT 0 NOT NULL,
	"disparados" integer DEFAULT 0 NOT NULL,
	"sucesso" integer DEFAULT 0 NOT NULL,
	"falhas" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'concluida' NOT NULL,
	"iniciado_em" timestamp DEFAULT now() NOT NULL,
	"finalizado_em" timestamp,
	"erro" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regua_disparos" (
	"id" serial PRIMARY KEY NOT NULL,
	"execucao_id" integer,
	"fatura_id" integer,
	"cliente_id" integer,
	"fase" varchar(50) NOT NULL,
	"canal" varchar(50) DEFAULT 'whatsapp' NOT NULL,
	"destinatario" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'enviado' NOT NULL,
	"provider_message_id" varchar(255),
	"valor" numeric(15, 2),
	"erro" text,
	"disparado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regua_disparos_execucao_id_regua_execucoes_id_fk') THEN
    ALTER TABLE "regua_disparos" ADD CONSTRAINT "regua_disparos_execucao_id_regua_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."regua_execucoes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regua_disparos_fatura_id_faturas_id_fk') THEN
    ALTER TABLE "regua_disparos" ADD CONSTRAINT "regua_disparos_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regua_disparos_cliente_id_clientes_id_fk') THEN
    ALTER TABLE "regua_disparos" ADD CONSTRAINT "regua_disparos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_exec_fase" ON "regua_execucoes" USING btree ("fase");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_exec_status" ON "regua_execucoes" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_exec_iniciado_em" ON "regua_execucoes" USING btree ("iniciado_em");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_disp_exec_id" ON "regua_disparos" USING btree ("execucao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_disp_fatura_id" ON "regua_disparos" USING btree ("fatura_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_disp_cliente_id" ON "regua_disparos" USING btree ("cliente_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_regua_disp_status" ON "regua_disparos" USING btree ("status");
