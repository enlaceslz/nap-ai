-- =============================================================================
-- NAP (Núcleo de Atendimento ao Provedor) - Schema Inicial
-- Baseado no PRD v2.0
-- =============================================================================

CREATE TABLE configuracoes (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    chave VARCHAR(100) NOT NULL,
    valor JSONB NOT NULL,
    atualizado_em TIMESTAMP DEFAULT NOW(),
    atualizado_por INTEGER,
    UNIQUE(provedor_id, categoria, chave)
);

CREATE TABLE operadores (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    totp_secret VARCHAR(100),
    totp_ativo BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'offline',
    filas_atribuidas JSONB DEFAULT '[]',
    max_conversas_simultaneas INTEGER DEFAULT 5,
    criado_em TIMESTAMP DEFAULT NOW(),
    ultimo_acesso TIMESTAMP
);

CREATE TABLE contatos (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco JSONB,
    contrato_sgp_id INTEGER,
    plano VARCHAR(50),
    status_cliente VARCHAR(20) DEFAULT 'ativo',
    attributes JSONB DEFAULT '{}',
    ultima_sincronizacao_sgp TIMESTAMP,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(provedor_id, cpf_cnpj)
);

CREATE TABLE conversas (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) NOT NULL,
    canal VARCHAR(20) NOT NULL,
    contato_id INTEGER NOT NULL REFERENCES contatos(id),
    operador_id INTEGER REFERENCES operadores(id),
    status VARCHAR(20) DEFAULT 'aberta',
    prioridade INTEGER DEFAULT 2,
    sla_segundos INTEGER DEFAULT 60,
    ticket_deal_id INTEGER,
    criada_em TIMESTAMP DEFAULT NOW(),
    fechada_em TIMESTAMP
);

CREATE TABLE mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    autor_tipo VARCHAR(20) NOT NULL,
    autor_id INTEGER,
    conteudo TEXT NOT NULL,
    midia_url VARCHAR(500),
    midia_tipo VARCHAR(50),
    enviada_em TIMESTAMP DEFAULT NOW(),
    lida_em TIMESTAMP
);

CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    estagios JSONB NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    provedor_id VARCHAR(50) NOT NULL,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id),
    contato_id INTEGER NOT NULL REFERENCES contatos(id),
    operador_id INTEGER REFERENCES operadores(id),
    titulo VARCHAR(200) NOT NULL,
    valor DECIMAL(12, 2),
    estagio_atual VARCHAR(50) NOT NULL,
    prioridade INTEGER DEFAULT 2,
    sla_segundos INTEGER,
    conversa_id INTEGER REFERENCES conversas(id),
    dados JSONB DEFAULT '{}',
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    fechado_em TIMESTAMP,
    resultado VARCHAR(20)
);

CREATE INDEX idx_deals_pipeline_estagio ON deals(pipeline_id, estagio_atual);
CREATE INDEX idx_deals_contato ON deals(contato_id);
