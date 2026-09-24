CREATE TABLE IF NOT EXISTS "campanhas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"canal" varchar(50) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"processados" integer DEFAULT 0 NOT NULL,
	"drop_rate" varchar(20),
	"mensagem_ou_template" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanhas_destinatarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"campanha_id" integer NOT NULL,
	"destinatario" varchar(100) NOT NULL,
	"cliente_id" integer,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"provider_message_id" varchar(255),
	"tentativas" integer DEFAULT 0 NOT NULL,
	"erro" text,
	"enviado_em" timestamp,
	"entregue_em" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanhas_execucoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"campanha_id" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"iniciado_em" timestamp DEFAULT now() NOT NULL,
	"finalizado_em" timestamp,
	"total_alvos" integer DEFAULT 0 NOT NULL,
	"sucesso_count" integer DEFAULT 0 NOT NULL,
	"falha_count" integer DEFAULT 0 NOT NULL,
	"detalhes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanhas_chamadas_voz" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"telefone" varchar(50) NOT NULL,
	"asterisk_channel_id" varchar(150),
	"asterisk_unique_id" varchar(150),
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"started_at" timestamp,
	"ringing_at" timestamp,
	"answered_at" timestamp,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0,
	"hangup_cause" varchar(100),
	"result" varchar(50),
	"error_code" varchar(100),
	"error_message" text,
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campanhas_chamadas_voz_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "incident_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" varchar(100) NOT NULL,
	"customer_id" integer,
	"channel" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"provider_message_id" varchar(255),
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"failed_at" timestamp,
	"error_code" varchar(100),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"endpoint" text NOT NULL,
	"p256dh" text,
	"auth" text,
	"user_agent" text,
	"device_name" varchar(150),
	"operador_nome" varchar(150),
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_chamadas_voz_campaign_id_campanhas_id_fk') THEN
    ALTER TABLE "campanhas_chamadas_voz" ADD CONSTRAINT "campanhas_chamadas_voz_campaign_id_campanhas_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campanhas"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_chamadas_voz_recipient_id_campanhas_destinatarios_id_fk') THEN
    ALTER TABLE "campanhas_chamadas_voz" ADD CONSTRAINT "campanhas_chamadas_voz_recipient_id_campanhas_destinatarios_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."campanhas_destinatarios"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_destinatarios_campanha_id_campanhas_id_fk') THEN
    ALTER TABLE "campanhas_destinatarios" ADD CONSTRAINT "campanhas_destinatarios_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_destinatarios_cliente_id_clientes_id_fk') THEN
    ALTER TABLE "campanhas_destinatarios" ADD CONSTRAINT "campanhas_destinatarios_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campanhas_execucoes_campanha_id_campanhas_id_fk') THEN
    ALTER TABLE "campanhas_execucoes" ADD CONSTRAINT "campanhas_execucoes_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_notifications_customer_id_clientes_id_fk') THEN
    ALTER TABLE "incident_notifications" ADD CONSTRAINT "incident_notifications_customer_id_clientes_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_users_id_fk') THEN
    ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanhas_status" ON "campanhas" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanhas_canal" ON "campanhas" USING btree ("canal");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chamadas_voz_campaign_id" ON "campanhas_chamadas_voz" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chamadas_voz_recipient_id" ON "campanhas_chamadas_voz" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chamadas_voz_status" ON "campanhas_chamadas_voz" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chamadas_voz_channel_id" ON "campanhas_chamadas_voz" USING btree ("asterisk_channel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_destinatarios_campanha_id" ON "campanhas_destinatarios" USING btree ("campanha_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_destinatarios_status" ON "campanhas_destinatarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_execucoes_campanha_id" ON "campanhas_execucoes" USING btree ("campanha_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incident_notif_incident_id" ON "incident_notifications" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incident_notif_status" ON "incident_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incident_notif_customer_id" ON "incident_notifications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_sub_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_sub_user_id" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_sub_active" ON "push_subscriptions" USING btree ("active");