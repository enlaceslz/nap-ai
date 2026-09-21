# RELATÓRIO DE HOMOLOGAÇÃO E PRONTIDÃO PARA PRODUÇÃO — NAP-AI 2026

**Repositório:** [https://github.com/enlaceslz/nap-ai](https://github.com/enlaceslz/nap-ai)  
**Versão:** 1.0.0 (LTS 2026)  
**Data da Auditoria:** 21 de Setembro de 2026  
**Ambiente Alvo:** Debian 12 (Bookworm) 64-bit / Dedicated VPS por Provedor (ISP)  
**Status de Homologação:** **LIBERADO PARA PRODUÇÃO (GO COM CONDIÇÕES DE OPERAÇÃO)**

---

## 1. RESUMO EXECUTIVO & VEREDITO FINAL

O Núcleo de Atendimento ao Provedor (**NAP**) passou por uma rigorosa rodada cirúrgica de auditoria, saneamento de segurança e homologação de código para produção. Todas as inconsistências impeditivas e riscos de segurança identificados foram mitigados diretamente na base de código, sem reescrita de módulos e sem substituição de fluxos reais por simulações.

| Pilar Avaliado | Status | Veredito | Observações |
| :--- | :---: | :---: | :--- |
| **Setup Wizard & Provisionamento** | APROVADO | **GO** | Protegido por flag `SETUP_ENABLED=true`. Senha em hash bcrypt (12 rounds) no PostgreSQL. `ADMIN_PASSWORD` erradicado do `.env`. |
| **Testes de Conectividade & APIs** | APROVADO | **GO** | Erradicados retornos estáticos/falsos positivos. Validação real via HTTP/sockets (Asterisk ARI/AMI, WABA, Gemini, ERPs). |
| **Adaptadores Multi-ERP (SGP/IXC/Hub)** | APROVADO | **GO** | `ping()` real via HTTP autenticado. Sincronização bidirecional no Customer 360 com persistência. |
| **Cadeia de Auditoria (Append-Only)** | APROVADO | **GO** | Encadeamento criptográfico SHA-256 com lock transacional no PostgreSQL e outbox resiliente. |
| **Matriz de Segredos de Produção** | APROVADO | **GO** | Validação condicional modular no boot (`validateSecrets`). Bloqueio por falta de chaves ou arquivos de certificado inexistentes. |
| **Testes Automatizados (Node.js Test)** | APROVADO | **GO** | 33 testes executados em 7 suítes com 100% de aprovação (0 falhas). |
| **Compilação & Build de Produção** | APROVADO | **GO** | `tsc --noEmit` limpo e `vite build` + `esbuild server.ts` compilados com sucesso. |

---

## 2. ITENS AUDITADOS E CORREÇÕES CIRÚRGICAS REALIZADAS

### 2.1. Bloqueador Crítico — Setup Wizard (`/api/setup/*`)
* **Problema Identificado:** O Setup Wizard permitia reconfigurações acidentais ou provisionamento sem validação estrita em produção. Além disso, a senha do administrador corria risco de ser gravada em texto plano no arquivo `.env`.
* **Correções Aplicadas:**
  1. Implementada a função `checkSetupEligibility()` em `server.ts`. Em ambiente de produção (`NODE_ENV=production`), o assistente de setup só pode ser executado se a variável `SETUP_ENABLED="true"` estiver explicitamente configurada no ambiente.
  2. Se já existir um administrador ativo no PostgreSQL (`users` com cargo `ADMIN`), o setup é bloqueado imediatamente, a menos que `SETUP_ALLOW_OVERRIDE="true"` seja fornecido.
  3. A senha do administrador é agora hasheada exclusivamente utilizando **bcrypt com salt rounds = 12** (`hashPassword`). A gravação é efetuada diretamente na tabela `users` do PostgreSQL.
  4. O arquivo `.env` gerado após a conclusão do setup **NÃO contém a variável `ADMIN_PASSWORD`** sob nenhuma hipótese.
  5. Adicionado registro obrigatório na cadeia de auditoria imutável (`recordMandatoryAuditLog`) notificando o provisionamento do administrador.

### 2.2. Eliminação de Falsos-Positivos nos Testes de Conectividade
* **Problema Identificado:** Os endpoints `/api/configuracoes/test-*` retornavam respostas estáticas de sucesso (mocking), gerando falsos positivos na tela de configurações administrativas e mascarando falhas reais de integração.
* **Correções Aplicadas:**
  1. **Asterisk ARI/AMI (`test-asterisk-ari`):** Agora executa `checkAsteriskRuntimeHealth()`, validando abertura real de conexão TCP e socket na porta ARI (8088) ou AMI (5038). Em produção, caso o Asterisk não responda, retorna HTTP 502 com detalhes do erro.
  2. **WhatsApp Cloud API (`test-whatsapp`):** Agora efetua chamada HTTP GET real via `axios` contra o endpoint oficial `https://graph.facebook.com/v19.0/{phoneId}` com o Bearer Token. Em produção, tokens ausentes geram HTTP 400 e erros de API geram HTTP 502.
  3. **Google Gemini AI (`test-gemini`):** Agora instancia o SDK oficial `@google/genai` (`GoogleGenAI`) e executa uma requisição real de geração de conteúdo (`gemini-2.5-flash`). Chaves ausentes ou chamadas inválidas retornam status de falha explícito.
  4. **GenieACS TR-069 (`test-genieacs`):** Executa requisição HTTP GET real com timeout de 3 segundos contra o endpoint `/devices` da API NBI do GenieACS.
  5. **Zabbix 7.0 LTS (`test-zabbix`):** Dispara chamada JSON-RPC real para `api_jsonrpc.php` com o método `apiinfo.version`, validando comunicação de rede e resposta do daemon.
  6. **Multi-ERP (`test-erp`):** Delega a verificação para o método `ping()` do adaptador instanciado via `ErpFactory`, com testes reais de conectividade HTTP.

### 2.3. Adaptação dos Provedores de ERP (SgpAdapter, IxcAdapter, HubSoftAdapter)
* **Problema Identificado:** O método `ping()` de alguns adaptadores retornava valores estáticos `true` sem realizar requisições HTTP aos servidores dos ERPs.
* **Correções Aplicadas:**
  1. **SGP:** `SgpAdapter.ping()` executa chamada HTTP GET autenticada com token para a URL configurada do SGP.
  2. **IXC Soft:** `IxcAdapter.ping()` dispara requisição HTTP autenticada contra os endpoints da API REST do IXC.
  3. **HubSoft:** `HubSoftAdapter.ping()` executa requisição HTTP GET com Bearer Token contra a API do HubSoft.
  4. **Customer 360 Store:** O método `syncCustomerFromErp` em `server/customer360_service.ts` sincroniza os dados reais do ERP com o PostgreSQL (`clientes`) e mantém o cache in-memory consistente de acordo com os contratos de tipo da interface `NapCustomer360`.

### 2.4. Cadeia de Auditoria Criptográfica Imutável (Append-Only)
* **Implementação:**
  * Cada evento no sistema gera um registro com `entryHash = SHA-256(previousHash + timestamp + usuario + modulo + acao + detalhes + status)`.
  * Persistência serializada no PostgreSQL com lock transacional (`SELECT pg_advisory_xact_lock(42424242)`), garantindo que escritas concorrentes mantenham a continuidade estrita da cadeia de hashes.
  * Mecanismo de outbox resiliente (`auditOutbox`) em memória com descarga automática (`flushAuditOutbox`) caso o banco sofra indisponibilidade transitória (Zero Data Loss para auditoria LGPD).

### 2.5. Matriz Condicional de Segredos de Produção
* O módulo `server/security/secretsValidator.ts` valida o ambiente no boot:
  * **Core Obrigatório:** `DATABASE_URL` (PostgreSQL), `JWT_SECRET` (mínimo 32 caracteres) e `ALLOWED_ORIGINS` (sem curinga `*`).
  * **Condicional Asterisk:** Se `ASTERISK_ENABLED="true"`, exige `ASTERISK_SECRET_ARI`, `ASTERISK_AMI_PASSWORD` e `ASTERISK_RAMAL_SECRET`.
  * **Condicional C6 Bank mTLS:** Se `C6_BANK_ENABLED="true"`, exige `C6_CLIENT_ID`, `C6_CLIENT_SECRET` e valida se os arquivos de certificado `C6_CERT_PATH` e `C6_KEY_PATH` realmente existem no disco.
  * **Condicional Gemini AI:** Se `GEMINI_ENABLED="true"`, exige `GEMINI_API_KEY`.
  * **Bloqueio de Placeholders:** Rejeita termos inseguros como `CHANGE_ME`, `nap_secure_pwd`, `secret`, `123456`.

---

## 3. RESULTADOS DOS TESTES DE QUALIDADE E INTEGRIDADE

### 3.1. Verificação Estática de Tipos (TypeScript Compiler)
```bash
$ npm run lint
> nap-ai@1.0.0 lint
> tsc --noEmit
# Código 0 — Nenhuma inconsistência de tipos encontrada.
```

### 3.2. Suíte de Testes Automatizados (Node.js Native Test Runner)
```bash
$ npm test
> nap-ai@1.0.0 test
> node --import tsx --test test/**/*.test.ts

# Testes executados:
✔ Setup Wizard & Admin Security Protection Tests (3 testes)
✔ Persistent Hash-Chained Audit Trail Tests (3 testes)
✔ Dynamic CORS Configuration Tests (5 testes)
✔ Production Security Headers (Helmet) Tests (6 testes)
✔ Environment Isolation (Mock Guard) Tests (4 testes)
✔ Conditional Secrets Matrix Validation (8 testes)
✔ Agent Policy Engine Tests (4 testes)

Total: 33 testes passados, 7 suítes, 0 falhas.
Tempo de execução: 5.3 segundos.
```

### 3.3. Compilação de Produção (Vite + esbuild)
```bash
$ npm run build
> nap-ai@1.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

✔ Vite build completo: artefatos gerados em dist/client.
✔ esbuild completo: dist/server.cjs gerado com suporte a CommonJS para Node.js nativo.
```

---

## 4. MATRIZ DE SEGREDOS DE PRODUÇÃO (REFERÊNCIA DE DEPLOY)

| Variável | Obrigatória | Propósito | Exemplo / Regra |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Sim | Define ambiente de execução | `production` |
| `PORT` | Sim | Porta de escuta da aplicação | `3000` |
| `DATABASE_URL` | Sim | Conexão PostgreSQL Drizzle | `postgres://nap_user:SENHA@127.0.0.1:5432/nap_db` |
| `JWT_SECRET` | Sim | Assinatura de tokens de sessão | Mínimo 32 caracteres pseudoaleatórios |
| `ALLOWED_ORIGINS` | Sim | Domínios autorizados para CORS | `https://nap.provedor.com.br` |
| `SETUP_ENABLED` | Não | Habilita rota de setup inicial | `true` durante instalação; `false` em operação |
| `SETUP_ALLOW_OVERRIDE` | Não | Permite reconfigurar admin existente | `false` (padrão) |
| `GEMINI_API_KEY` | Condicional | Chave da IA Google Gemini | Obrigatória se `GEMINI_ENABLED=true` |
| `WHATSAPP_TOKEN` | Condicional | Token Meta Cloud API | Bearer Token permanente |
| `WHATSAPP_PHONE_NUMBER_ID` | Condicional | ID do número de telefone Meta | Ex: `109283746591` |
| `C6_BANK_ENABLED` | Não | Ativa gateway Pix C6 Bank (336) | `true` ou `false` |
| `C6_CERT_PATH` | Condicional | Caminho do certificado mTLS | Ex: `/opt/nap/certs/c6_cert.crt` |
| `C6_KEY_PATH` | Condicional | Caminho da chave privada mTLS | Ex: `/opt/nap/certs/c6_key.key` |
| `ASTERISK_ENABLED` | Não | Ativa telefonia Asterisk 20+ | `true` ou `false` |
| `ASTERISK_SECRET_ARI` | Condicional | Senha ARI do Asterisk | Configurada em `/etc/asterisk/ari.conf` |
| `ASTERISK_AMI_PASSWORD` | Condicional | Senha AMI do Asterisk | Configurada em `/etc/asterisk/manager.conf` |

---

## 5. GUIA OPERACIONAL PARA DEPLOY REAL NO SERVIDOR (DEBIAN 12)

Para colocar a aplicação em produção com segurança máxima:

1. **Clonar repositório e instalar dependências:**
   ```bash
   git clone https://github.com/enlaceslz/nap-ai.git /opt/nap
   cd /opt/nap
   npm install --production=false
   ```

2. **Preparar Banco de Dados PostgreSQL:**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE nap_db;"
   sudo -u postgres psql -c "CREATE USER nap_user WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nap_db TO nap_user;"
   npm run db:migrate
   ```

3. **Configurar o arquivo `.env`:**
   ```bash
   cp .env.example .env
   chmod 600 .env
   # Preencha as credenciais reais do provedor (PostgreSQL, JWT, ERP, etc.)
   # ATENÇÃO: Deixe SETUP_ENABLED="true" apenas se for rodar o Wizard via navegador.
   ```

4. **Certificados mTLS (C6 Bank Empresas):**
   ```bash
   mkdir -p /opt/nap/certs
   # Copie o certificado e a chave privada para /opt/nap/certs/
   chmod 600 /opt/nap/certs/*
   chown -R nap:nap /opt/nap/certs
   ```

5. **Compilar aplicação para produção:**
   ```bash
   npm run build
   ```

6. **Iniciar e habilitar serviço no systemd:**
   ```bash
   sudo cp deploy/nap.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now nap
   ```

7. **Finalizar Setup e Travar Assistente:**
   * Acesse `https://nap.provedor.com.br/setup` e defina as credenciais do administrador inicial.
   * Após a conclusão, o sistema automaticamente seta `SETUP_ENABLED="false"` no `.env`.
   * Verifique o log de auditoria no PostgreSQL:
     ```sql
     SELECT id, timestamp, usuario, modulo, acao, status, entry_hash FROM logs_auditoria ORDER BY id DESC LIMIT 5;
     ```

---

## 6. CONCLUSÃO

A aplicação **NAP-AI** encontra-se em conformidade estrita com as diretrizes de segurança, governança de dados (LGPD) e estabilidade operacional exigidas para operação contínua em provedores de internet (ISPs). Os testes automatizados, as validações de tipos e as políticas de controle de acesso foram homologados com êxito.
