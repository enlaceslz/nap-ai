CREATE TABLE "conversas" (
	"id" serial PRIMARY KEY NOT NULL,
	"telefone" varchar(20) NOT NULL,
	"nome_cliente" varchar(255),
	"cliente_id" serial NOT NULL,
	"fila" varchar(50) DEFAULT 'triagem_ia',
	"status_conexao" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversas_telefone_unique" UNIQUE("telefone")
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversa_id" serial NOT NULL,
	"remetente" varchar(50) NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" varchar(50) DEFAULT 'texto',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas"("id") ON DELETE no action ON UPDATE no action;