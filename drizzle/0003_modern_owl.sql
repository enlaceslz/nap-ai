ALTER TABLE "logs_auditoria" ADD COLUMN "user_id" varchar(100);--> statement-breakpoint
ALTER TABLE "logs_auditoria" ADD COLUMN "request_id" varchar(100);--> statement-breakpoint
ALTER TABLE "logs_auditoria" ADD COLUMN "recurso" varchar(150);--> statement-breakpoint
ALTER TABLE "logs_auditoria" ADD COLUMN "resultado" varchar(50) DEFAULT 'sucesso';--> statement-breakpoint
CREATE INDEX "idx_auditoria_request_id" ON "logs_auditoria" USING btree ("request_id");