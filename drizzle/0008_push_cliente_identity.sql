-- Migration 0008: Separação estrita de identidades em push_subscriptions e rastreabilidade de subscription no NOC
-- Vincula cliente_id à entidade 'clientes' e user_id à entidade 'users'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE "push_subscriptions" ADD COLUMN "cliente_id" integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'cliente_nome'
  ) THEN
    ALTER TABLE "push_subscriptions" ADD COLUMN "cliente_nome" varchar(150);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incident_notifications' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "subscription_id" integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incident_notifications' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE "incident_notifications" ADD COLUMN "delivered_at" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_cliente_id_clientes_id_fk') THEN
    ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_notifications_subscription_id_push_subscriptions_id_fk') THEN
    ALTER TABLE "incident_notifications" ADD CONSTRAINT "incident_notifications_subscription_id_push_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_sub_cliente_id" ON "push_subscriptions" USING btree ("cliente_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incident_notif_subscription_id" ON "incident_notifications" USING btree ("subscription_id");

