CREATE TABLE "atendimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"estagio" varchar(100) NOT NULL,
	"pipeline" varchar(100) NOT NULL,
	"contato" varchar(255),
	"telefone" varchar(50),
	"endereco" text,
	"plano" varchar(100),
	"prioridade" serial NOT NULL,
	"contexto_ia" text,
	"criado_em" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"documento" varchar(20) NOT NULL,
	"telefone" varchar(20),
	"contrato" varchar(50),
	"plano" varchar(100),
	"status" varchar(50) DEFAULT 'ativo',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
CREATE TABLE "faturas" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" serial NOT NULL,
	"valor" varchar(50) NOT NULL,
	"vencimento" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"linha_digitavel" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha" varchar(255) NOT NULL,
	"cargo" varchar(50) NOT NULL,
	"ativo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;