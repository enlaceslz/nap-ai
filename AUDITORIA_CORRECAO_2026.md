# Relatório de Congelamento e Auditoria Técnica Inicial — NAP-AI

**Repositório:** `https://github.com/enlaceslz/nap-ai`  
**Data:** 18 de Setembro de 2026  
**Ambiente:** Node.js v22.23.2, Debian 12 64-bit, TypeScript 5.8, Drizzle ORM, Asterisk 20+  
**Objetivo:** Congelar o estado atual do repositório, catalogar com precisão cirúrgica todas as inconsistências técnicas, endpoints, migrations, credenciais padrão, serviços de infraestrutura e dependências antes de iniciar as fases de correção.

---

## 1. Inspeção da Branch e Repositório
- **Branch Base:** `main` (código de produção consolidado em container Debian 12).
- **Commit / Head:** Estado atual pós-auditoria inicial de Setembro/2026.
- **Topologia de Implantação:** Instância Dedicada por Provedor / CNPJ (Single-Tenant isolado).

---

## 2. Identificação da Versão Atual
- **Package Manifest:** `package.json` (`name: "react-example"`, `version: "0.0.0"`).
  - *Ação necessária:* Atualizar para `name: "nap-ai"` e `version: "1.0.0-lts"`.
- **Stack de Runtime:**
  - Node.js: `v22.23.2`
  - TSX: `v4.23.13`
  - React: `19.0.1` / React DOM `19.0.1`
  - Drizzle ORM: `0.45.2` / Drizzle Kit `0.31.10`
  - Express: `4.21.2`
  - Helmet: `8.3.0`
  - Zod: `4.6.5`
  - Ari-Client: `2.2.0`
  - Leaflet: `1.9.4`
  - Tailwind CSS: `4.1.14`

---

## 3. Inventário de Arquivos Mapeados para Modificação

| Componente | Arquivos Alvo |
| :--- | :--- |
| **Segurança & Credenciais** | `.env.example`, `server/security/secretsValidator.ts`, `server/security/httpSecurity.ts`, `src/contexts/ConfigContext.tsx` |
| **Autenticação & RBAC** | `server/auth/types.ts`, `server/auth/rbacMiddleware.ts`, `src/contexts/AuthContext.tsx`, `server.ts` |
| **Banco de Dados & Schema** | `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`, `drizzle/*` (novas migrations SQL) |
| **Governança MaIA / AI** | `server/agent/policyEngine.ts`, `server/agent/toolRegistry.ts`, `server/gemini.ts`, `server/gemini_routes.ts` |
| **Gateways & Webhooks** | `server/webhooks/webhookGateway.ts`, `server/waba.ts`, `server/payments.ts`, `server/zabbix/zabbixRoutes.ts` |
| **Telefonia Asterisk 20+** | `asterisk-config/ari.conf`, `asterisk-config/http.conf`, `asterisk-config/pjsip.conf`, `server/asterisk.ts` |
| **CPE TR-069 & GenieACS** | `server/genieacs/genieacsService.ts`, `server/genieacs/genieacsRoutes.ts` |
| **Módulos Operacionais** | `server/olt/oltRoutes.ts`, `server/crm/crmService.ts`, `server/crm/crmRoutes.ts`, `server/helpdesk/service.ts`, `server/helpdesk/routes.ts`, `server/ipam/service.ts`, `server/ipam/routes.ts` |
| **Infraestrutura & Deploy** | `docker-compose.yml`, `deploy.sh`, `scripts/install.sh`, `DEPLOY.md`, `HARDENING_PLAN.md` |
| **Suíte de Testes** | Criação de testes automatizados em `tests/` com runner nativo Node 22 (`tsx --test`) |

---

## 4. Migrations Existentes vs Schema Real

### Migrations em Disco (`drizzle/`):
1. `0000_sad_ink.sql` (1789057993994):
   - Tabelas criadas: `atendimentos`, `clientes`, `faturas`, `users`.
   - **Falhas críticas encontradas na migration original:**
     - FKs usaram `serial` em vez de `integer` (`cliente_id serial NOT NULL`).
     - Valores monetários em `faturas` usaram `varchar(50) NOT NULL` em vez de `numeric(15,2)`.
2. `0001_long_sir_ram.sql` (1789058434422):
   - Tabelas criadas: `conversas`, `mensagens`.
   - FKs usaram `serial` (`cliente_id serial NOT NULL`, `conversa_id serial NOT NULL`).

### Tabelas Definidas no Schema Atual (`src/db/schema.ts`) Sem Migrations Aplicadas:
- `contratos` (Customer 360)
- `pagamentos_transacoes` (Enlace-Pay / Banco C6 336)
- `ordens_servico` (Field Service Técnico)
- `logs_auditoria` (Trilha imutável com hash encadeado SHA-256)
- `webhooks_recebidos` (Tabela de idempotência e auditoria de webhooks)
- `nap_customer_references`, `nap_customer_events`, `nap_integrations`
- `helpdesk_tickets`, `work_orders`, `helpdesk_audit`
- `ipam_subnets`, `ipam_ips`, `ipam_reservations`

*Conclusão da Auditoria:* O schema divergiu das migrations históricas. É mandatória a criação de uma migration oficial consolidada (`0002_nap_production_consolidation.sql`) sem alterações destrutivas em dados reais e com integridade referencial rigorosa.

---

## 5. Catálogo Completo de Endpoints da Aplicação

### 5.1. Núcleo, Configurações e Auditoria (`server.ts`)
- `GET /api/health` — Healthcheck oficial do sistema
- `GET /api/usuarios` — Listagem de usuários do provedor
- `GET /api/tecnicos/mapa` — Posição GPS e status dos técnicos de campo
- `POST /api/push/operator/test` — Teste de push notification Web/PWA
- `GET /api/configuracoes` & `PUT /api/configuracoes` — Leitura e alteração de parâmetros
- `POST /api/configuracoes/restaurar-nativos` — Restauração de defaults
- `GET /api/configuracoes/nativas` — Parâmetros nativos do sistema
- `POST /api/configuracoes/upload-logo` — Upload de logotipo do provedor
- `POST /api/configuracoes/test-erp` — Teste de conectividade com o ERP
- `POST /api/configuracoes/test-asterisk-ari` — Teste de autenticação e ping ARI Asterisk
- `POST /api/configuracoes/test-whatsapp` — Teste de envio WABA
- `POST /api/configuracoes/test-gemini` — Teste da chave Gemini e IA MaIA
- `POST /api/configuracoes/test-ssl` — Teste de certificados TLS
- `POST /api/configuracoes/test-genieacs` — Teste de API NBI TR-069
- `POST /api/configuracoes/test-zabbix` — Teste de autenticação JSON-RPC Zabbix
- `POST /api/configuracoes/test-mapa` — Teste de camadas GIS
- `GET /api/telefonia/status` — Status de canais e troncos SIP Asterisk
- `GET /api/auditoria` — Consulta à trilha de auditoria
- `GET /api/auditoria/estatisticas` — Métricas de segurança e acessos
- `GET /api/auditoria/exportar` — Exportação de logs para compliance LGPD
- `POST /api/auditoria` — Inserção de evento auditável
- `GET /api/v1/auditoria/chain` — Verificação de integridade da cadeia de hash SHA-256
- `GET /api/incidentes` & `POST /api/incidentes` & `PATCH /api/incidentes/:id` — Gestão de incidentes de rede
- `POST /api/incidentes/:id/notificar-massa` — Disparo em massa de aviso de rompimento
- `GET /api/incidentes/verificar-cliente` — Consulta de impacto na conexão do assinante
- `GET /api/cobranca/regua` & `PUT /api/cobranca/regua` — Parâmetros da régua de cobrança
- `POST /api/cobranca/regua/executar` — Execução do ciclo de cobrança D-3 a D+7
- `POST /api/cobranca/regua/disparar-individual` — Cobrança pontual
- `POST /api/cobranca/regua/simular-teste` — Simulação de régua sem envio real
- `GET /api/campanhas` & `POST /api/campanhas` & `POST /api/campanhas/:id/toggle` — Campanhas WABA
- `GET /api/sync/status` & `POST /api/sync/executar` — Sincronização multi-ERP
- `GET /api/noc/security-alerts` — Painel WAF e alertas de tráfego anômalo

### 5.2. Customer 360 e Enlace-Pay (`server/payments.ts`)
- `GET /api/customer360/dashboard` — Resumo financeiro consolidado
- `GET /api/customers` & `GET /api/customers/:id` — Cadastro do cliente
- `GET /api/customers/:id/timeline` — Linha do tempo de eventos do assinante
- `GET /api/customers/:id/contracts` — Contratos vigentes
- `GET /api/customers/:id/invoices` — Histórico e faturas em aberto
- `GET /api/customers/:id/payments` — Transações e conciliações
- `GET /api/customers/:id/network` — Parâmetros ópticos e login PPPoE
- `GET /api/customers/:id/tickets` — Chamados de suporte associados
- `GET /api/customers/:id/noc` — Alarmes de rede afetando a região
- `POST /api/customers/:id/actions/reboot-onu` — Comando de reboot via TR-069
- `POST /api/payments/charges` — Emissão de cobrança Pix dinâmica Banco C6
- `POST /api/payments/webhook` & `POST /api/payments/webhooks` — Endpoint de baixa Pix mTLS
- `POST /api/payments/reconcile` — Conciliação transacional
- `GET /api/customer360/reconciliation` & `POST /api/customer360/reconciliation/run` — Auditoria de conciliação
- `POST /api/customer360/reconciliation/:id/resolve` — Resolução de divergência financeira
- `GET /api/customer360/authority-matrix` & `PUT /api/customer360/authority-matrix` — Matriz de alçadas
- `GET /api/payments/c6-config` & `PUT /api/payments/c6-config` — Configuração bancária mTLS
- `POST /api/payments/c6-config/test` — Teste de conexão contra a API Banco C6
- `POST /api/payments/c6-config/upload-cert` — Upload de certificado cliente X.509

### 5.3. WhatsApp Business Cloud API & Webchat (`server/waba.ts`)
- `GET /api/webhooks/waba/incoming` & `GET /api/webhooks/whatsapp` — Validação de Webhook Meta
- `POST /api/webhooks/waba/incoming` & `POST /api/webhooks/whatsapp` — Recepção de mensagens WABA
- `POST /api/webchat/send` — Envio de mensagem pelo Webchat do portal
- `GET /api/waba/chats-full` — Listagem de conversas ativas
- `GET /api/conversas` & `GET /api/conversas/:id/mensagens` — Histórico de diálogo
- `GET /api/waba/templates` — Modelos de mensagem aprovados
- `POST /api/waba/templates/validate` & `POST /api/waba/templates/submit` & `POST /api/waba/templates/send-test` — Gestão de templates HSM

### 5.4. OLT Manager GPON (`server/olt/oltRoutes.ts`)
- `GET /api/v1/olts-dashboard` & `GET /api/v1/olts-alarms` & `POST /api/v1/olts-alarms/:id/ack`
- `GET /api/v1/olts-profiles` & `GET /api/v1/olts` & `GET /api/v1/olts/:id`
- `POST /api/v1/olts` & `PUT /api/v1/olts/:id` & `DELETE /api/v1/olts/:id`
- `POST /api/v1/olts/:id/test-connection` & `POST /api/v1/olts/:id/discovery`
- `GET /api/v1/olts/:id/slots` & `GET /api/v1/olts/:id/pons` & `GET /api/v1/pons`
- `GET /api/v1/onus` & `GET /api/v1/onus/unassigned` & `GET /api/v1/onus/:id`
- `POST /api/v1/onus` & `DELETE /api/v1/onus/:id`
- `POST /api/v1/onus/:id/reboot` & `POST /api/v1/onus/:id/enable` & `POST /api/v1/onus/:id/disable`
- `GET /api/v1/onus/:id/optical` & `GET /api/v1/onus/:id/diagnostics` & `POST /api/v1/onus/batch`

### 5.5. GenieACS TR-069 (`server/genieacs/genieacsRoutes.ts`)
- `GET /api/genieacs/devices` — Inventário e status de CPEs
- `POST /api/genieacs/devices/:id/reboot` — Reinicialização remota de ONU
- `GET /api/genieacs/health` — Status da conexão NBI / MongoDB / Redis

### 5.6. NOC & Zabbix 7.0 LTS (`server/zabbix/zabbixRoutes.ts`)
- `GET /api/zabbix/status` & `GET /api/zabbix/health`
- `POST /api/zabbix/ack` — Reconhecimento de alarme no Zabbix
- `POST /api/zabbix/test-trigger` — Simulação de disparo de trigger
- `GET /api/zabbix/traffic` — Telemetria de tráfego de borda

### 5.7. Help Desk (`server/helpdesk/routes.ts`)
- `GET /api/helpdesk/tickets` & `POST /api/helpdesk/tickets` & `POST /api/helpdesk/tickets/:id/close`
- `GET /api/helpdesk/work-orders` & `POST /api/helpdesk/work-orders` & `POST /api/helpdesk/work-orders/:id/status`
- `POST /api/helpdesk/webhooks/zammad` — Webhook de sincronização Zammad/OSticket

### 5.8. IPAM & NSoT (`server/ipam/routes.ts`)
- Endpoints de alocação de prefixos, endereços IPv4, IPv6 PD, VLANs, VRFs, dispositivos, interfaces e BGP.
- `POST /api/ipam/webhooks/nautobot` — Sincronização com Nautobot NSoT.

### 5.9. CRM, Field Service, Portal PWA e Inteligência Artificial MaIA
- CRM: `/api/crm/contatos`, `/api/crm/deals`, `/api/crm/deals/:id/waba-trigger`, `/api/crm/waba/handoff`
- Field Service: `/api/field/os`, `/api/field/os/:id/status`
- Portal do Assinante: `/api/portal/erp/faturas`, `/api/portal/erp/pix/:id`, `/api/portal/erp/boleto/:id`, `/api/portal/wifi`
- MaIA (Gemini): `/api/gemini/agent/run`, `/api/gemini/agent/tools`, `/api/gemini/config`, `/api/gemini/voice/analyze`

---

## 6. Rotas Críticas que Exigem Autorização e Proteção Máxima

1. **Destrutivas / Físicas de Rede (Telecom):**
   - `POST /api/v1/onus/:id/reboot` (Reboot de ONU)
   - `POST /api/v1/onus/:id/disable` (Corte de sinal PON)
   - `DELETE /api/v1/onus/:id` (Desprovisionamento físico)
   - `DELETE /api/v1/olts/:id` (Remoção de OLT)
   - `POST /api/genieacs/devices/:id/reboot`
2. **Financeiras e Cobrança:**
   - `POST /api/payments/charges` (Geração de Pix)
   - `POST /api/payments/webhook` (Baixa de fatura)
   - `POST /api/customer360/reconciliation/:id/resolve` (Alteração manual de conciliação)
   - `PUT /api/payments/c6-config` (Troca de chaves e certificados mTLS bancários)
3. **Administrativas & Auditoria:**
   - `GET /api/v1/auditoria/chain` & `GET /api/auditoria/exportar`
   - `PUT /api/configuracoes`
   - `POST /api/configuracoes/restaurar-nativos`

---

## 7. Inventário Completo de Secrets e Insecure Defaults Encontrados

| Chave / Secret | Localização Encontrada | Valor Inseguro / Default | Risco |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | `src/db/index.ts`, `drizzle.config.ts`, `deploy.sh`, `scripts/install.sh`, `server.ts` | `postgresql://postgres:nap_secure_pwd@localhost:5432/nap_crm` | **ALTO** |
| `POSTGRES_PASSWORD` | `deploy.sh`, `docker-compose.yml` (anteriormente) | `nap_secure_pwd` | **ALTO** |
| `ASTERISK_SECRET_ARI` | `server.ts:65`, `server/asterisk.ts:9`, `asterisk-config/ari.conf:13` | `nap_ari_secret_2026` | **CRÍTICO** |
| `ASTERISK_SECRET_AMI` | `server.ts:68`, `ConfigContext.tsx:378` | `nap_ami_secret_2026` | **CRÍTICO** |
| `GENIEACS_PASSWORD` | `server.ts:75`, `ConfigContext.tsx:392` | `nap_acs_pwd_2026` | **ALTO** |
| `ZABBIX_TOKEN` | `server.ts:80`, `ConfigContext.tsx:397` | `nap_zabbix_live_token_sec70` | **ALTO** |
| `RADIUS_SECRET` | `server.ts:93`, `ConfigContext.tsx:237` | `nap_radius_secret_2026` | **ALTO** |
| `WABA_VERIFY_TOKEN` | `server.ts:98`, `server/waba.ts:502`, `ConfigContext.tsx:419` | `nap_waba_verify_token_secure` | **ALTO** |
| `ERP_TOKEN` / `SGP_TOKEN` | `server.ts:59`, `ConfigContext.tsx:347` | `nap_native_sec_token_sgp` | **ALTO** |
| `ASTERISK_RAMAL_SECRET` | `server.ts:168`, `asterisk-config/pjsip.conf:53` | `sip_pass_2001_webrtc` | **ALTO** |
| `allowed_origins` | `asterisk-config/ari.conf:7` | `*` (CORS irrestrito em interface ARI) | **CRÍTICO** |

---

## 8. Inventário das Ferramentas da MaIA (`agentToolRegistry`)

1. `consultar_status_conexao` — Consulta telemetria de sinal óptico e status PPPoE.
2. `gerar_pix_segunda_via` — Emissão de chave Pix dinâmica para fatura em aberto.
3. `consultar_faturas_aberto` — Listagem de faturas do cliente via documento/telefone.
4. `desbloqueio_confianca` — Concessão de promessa de pagamento (desbloqueio 48h no ERP).
5. `reiniciar_equipamento_cpe` — Envio de comando CWMP TR-069 para reboot da ONU do cliente.
6. `alterar_wifi_cpe` — Reprogramação remota de SSID/senha Wi-Fi na CPE.
7. `desconectar_sessao_radius` — Envio de pacote Packet-of-Disconnect (PoD/CoA) para derrubar sessão PPPoE.
8. `consultar_viabilidade_tecnica` — Consulta viabilidade de rede e CTOs próximas.
9. `criar_lead_vendas` — Inserção de oportunidade no funil de vendas.
10. `abrir_chamado_suporte` — Abertura de ticket no Help Desk.
11. `agendar_visita_tecnica` — Agendamento de Ordem de Serviço em campo.
12. `ipam_consultar_prefixo` & `ipam_alocar_ip` — Ferramentas MCP IPAM delegadas ao NSoT.

*Problema identificado:* O método `ToolRegistry.executeTool()` não passava pelo `AiPolicyEngine.evaluate()`, permitindo potencial bypass de políticas por chamadas programáticas diretas.

---

## 9. Serviços Docker (`docker-compose.yml`)

1. `nap-app` — Aplicação NAP (Backend Express + Frontend Vite bundle).
2. `db` — PostgreSQL 16 Alpine.
3. `mongo` — MongoDB 6.0 (Armazenamento de parâmetros TR-069 do GenieACS).
4. `redis` — Redis 7 Alpine (Filas e cache do GenieACS e NAP).
5. `genieacs-cwmp` — Servidor TR-069 CWMP (comunicação com ONUs).
6. `genieacs-nbi` — API REST Northbound Interface do GenieACS.
7. `genieacs-fs` — File Server de firmwares para ONUs.
8. `genieacs-ui` — Interface Web de administração do GenieACS.

---

## 10. Matriz de Exposição de Portas

| Serviço | Porta | Escopo Atual no Compose / Host | Escopo Recomendado | Veredito |
| :--- | :---: | :---: | :---: | :---: |
| **NAP Core Web/API** | `3000` | `127.0.0.1:3000:3000` | Privado (Apenas Nginx) | **CORRETO** |
| **PostgreSQL CRM** | `5432` | `127.0.0.1:5432:5432` | Privado (Loopback/Docker) | **CORRETO** (Corrigido; `deploy.sh` ainda continha `ufw allow 5432` que deve ser revogado) |
| **MongoDB GenieACS** | `27017` | `127.0.0.1:27017:27017` | Privado (Loopback/Docker) | **CORRETO** |
| **Redis Cache** | `6379` | `127.0.0.1:6379:6379` | Privado (Loopback/Docker) | **CORRETO** |
| **GenieACS CWMP** | `7547` | `0.0.0.0:7547:7547` | Público (WAN ONUs) | **CORRETO** |
| **GenieACS NBI API** | `7557` | `127.0.0.1:7557:7557` | Privado (Loopback/Docker) | **CORRETO** |
| **GenieACS FS** | `7567` | `0.0.0.0:7567:7567` | WAN (Download firmware) | **CORRETO** |
| **GenieACS UI** | `3005` | `127.0.0.1:3005:3000` | Privado (Loopback) | **CORRETO** |
| **Asterisk ARI** | `8088` | `0.0.0.0:8088` (`http.conf`) | Privado (`127.0.0.1:8088`) | **INSEGURO (Corrigir)** |
| **Asterisk WSS** | `8089` | `0.0.0.0:8089` | Público (WebRTC Portal) | **CORRETO** |
| **Asterisk SIP** | `5060` | `0.0.0.0:5060` UDP/TCP | Público (Troncos SIP) | **CORRETO** |
| **Asterisk RTP** | `10000-20000` | `0.0.0.0:10000-20000` UDP | Público (Áudio VoIP) | **CORRETO** |
| **Radius PoD/CoA** | `3799` | `0.0.0.0:3799` UDP | Rede Interna / CGNAT | **CORRETO** |

---

## 11. Mapeamento de Mocks no Backend

1. `erpDatabase_mock` em `server.ts` (linhas 338-346) — Clientes fictícios injetados caso ERP não responda.
2. `usuariosProvedor` em `server.ts` (linhas 348-430) — Usuários fictícios (`admin`, `operador`, `tecnico1`, etc.).
3. `mockWabaChats` e `mockWabaMessages` em `server.ts` (linhas 53-54).
4. `getMockDevices()` em `GenieacsService` — CPEs simuladas.
5. `mockSgpHandler` — Rota interna simulando API SGP.

*Ação necessária para FASE 2 e FASE 16:*
Em `NODE_ENV=production`, o sistema não deve recorrer a mocks ou dados falsos. Mocks devem ser isolados em fixtures para desenvolvimento/testes, e qualquer tentativa de usar mock de banco ou ERP em produção deve emitir erro controlado sem degradação silenciosa.

---

## 12. Mecanismos de Autenticação Identificados

1. **Backend Real (RBAC via JWT HMAC-SHA256):**
   - Implementado em `server/auth/rbacMiddleware.ts`.
   - Gera e valida tokens contendo `sub`, `email`, `role` e `permissions`.
   - Rejeita explicitamente headers forjáveis (`x-user-id`, `x-user-role`).
2. **Frontend (`AuthContext.tsx`):**
   - Atualmente conecta ao Firebase Auth e possui fallback para objeto salvo em `localStorage`.
   - **Gargalo:** Não havia integração bidirecional trocando credenciais por JWT do backend e incluindo `Authorization: Bearer <token>` em requisições `/api/*`.
   - *Ação necessária para FASE 4:* Adicionar endpoint oficial de autenticação `/api/auth/login` e `/api/auth/me` no backend, integrado ao `AuthContext.tsx` de modo que toda chamada do frontend anexe o Bearer token válido.

---

## 13. Status de Execução das Fases de Hardening

### ✅ Fase 1 — Secrets e Credenciais (CONCLUÍDO)
- **Eliminação Completa:** Removidas todas as senhas default hardcoded (`nap_secure_pwd`, `nap_ari_secret_2026`, `nap_ami_secret_2026`, `nap_acs_pwd_2026`, `nap_zabbix_live_token_sec70`, `nap_radius_secret_2026`, `nap_waba_verify_token_secure`, `nap_native_sec_token_sgp`, `sip_pass_2001_webrtc`) de `server.ts`, `server/waba.ts`, `server/asterisk.ts`, `src/contexts/ConfigContext.tsx`, `src/db/index.ts`, `drizzle.config.ts`, `deploy.sh`, `scripts/install.sh`, `asterisk-config/*` e `.env.example`.
- **Validador em Boot:** `server/security/secretsValidator.ts` ativado no boot. Em `NODE_ENV=production`, o boot falha imediatamente com código 1 caso qualquer segredo obrigatório esteja ausente ou utilize valor inseguro.

### ✅ Fase 2 — Banco de Dados & Fail-Fast (CONCLUÍDO)
- **Bloqueio de Memory Fallback:** `src/db/index.ts` e `server.ts` configurados para falhar de forma controlada em produção (`NODE_ENV=production`) sem criar bancos falsos nem simular sucesso de gravações.
- **Healthcheck e Indicador:** `isDatabaseConnected` exposto para verificação de integridade operacional.

### ✅ Fase 3 — Schema e Migrações (CONCLUÍDO)
- **Tipos Estritos:** Todas as chaves estrangeiras usam `integer().references(...)`. Valores monetários usam `numeric({ precision: 15, scale: 2 })`.
- **Soft Delete e Idempotência:** `deletedAt` implementado em `clientes` e `conversas`. `uniqueIndex` composto implementado em `webhooks_recebidos` (`origem` + `identificadorExterno`) e chaves únicas em `faturas` (`txid`, `idempotencyKey`).
- **Scripts:** `npm run db:generate` e `npm run db:push` validados.

### ✅ Fase 4 — Autenticação Unificada (CONCLUÍDO)
- **Autoridade Única:** Centralizado endpoint `/api/login`, `/api/auth/me` e `/api/auth/logout` no backend (`server/auth/authRoutes.ts`).
- **Criptografia Segura:** Implementado hash de senhas com sal aleatório e derivação via `scrypt` com verificação em tempo constante (`crypto.timingSafeEqual`). Rejeição de senhas em texto plano em produção.
- **Header Sanitization:** O `authMiddleware` remove explicitamente headers do cliente (`x-user-id`, `x-user-role`) e extrai identidade exclusivamente do token JWT assinado (`HS256`).

### ✅ Fase 5 — Controle de Acesso e RBAC (CONCLUÍDO)
- **Guardas Granulares:** Implementado middleware `requireRole` e `requirePermission`.
- **Proteção de Rotas Críticas:**
  - `/api/configuracoes/*` -> `ADMIN`
  - `/api/auditoria/*` -> `ADMIN`, `AUDITOR`
  - `/api/telefonia/*` -> `ADMIN`, `SUPORTE`
  - `/api/olt/*` e `/api/cpe/*` -> `ADMIN`, `NOC`, `CAMPO`, `SUPORTE`
  - `/api/financeiro/*` e `/api/payments/c6-config` -> `ADMIN`, `FINANCEIRO`

### ✅ Fase 6 — Docker e Isolamento de Rede (CONCLUÍDO)
- **Multi-Stage Build:** `Dockerfile` reformulado para multi-stage com `node:22-alpine`, instalando apenas dependências de produção na imagem final e executando sob usuário sem privilégios (`USER node`).
- **Segurança de Artefatos:** Arquivo `.dockerignore` criado para impedir inclusão acidental de `.env`, certificados mTLS ou chaves privadas na imagem.
- **docker-compose.yml:** Portas de serviços de infraestrutura (Postgres 5432, Redis 6379, Mongo 27017, GenieACS NBI 7557, UI 3005) restritas ao bind `127.0.0.1` e conectadas na rede interna em ponte `nap_internal_network`. Healthchecks automatizados adicionados.

### ✅ Fase 7 — Script de Deploy Hardened (CONCLUÍDO)
- **deploy.sh:** Senha fixa removida. Geração aleatória com `openssl rand -hex 24` integrada e gravação de `.env` com permissão estrita `chmod 600`.
- **Firewall UFW:** Política padrão `deny incoming`. Fechadas portas 5432 e 3000 contra acesso externo. Apenas portas essenciais liberadas (80, 443, 5060/udp, 8089/tcp, 10000:20000/udp, 7547/tcp).

### ✅ Fase 8 — Asterisk 20+ Nativo (CONCLUÍDO)
- **Origens e Binds Restritos:** `ari.conf` restringe origens a `127.0.0.1:3000,localhost:3000`. `http.conf` restringe bind a `127.0.0.1:8088`.
- **AMI e RTP:** Criado `manager.conf` com bind exclusivo em `127.0.0.1:5038`. Criado `rtp.conf` com range 10000-20000 e `strictrtp=yes`. Senhas parametrizadas via variáveis de ambiente.
- **Codecs e WebRTC:** Codecs seguros (`opus,ulaw,alaw`) e criptografia DTLS mantidos em `pjsip.conf`.

---

## 14. Próximas Etapas (Fases 9 a 22)
- **Fase 9 & 10:** GenieACS e Zabbix (reforço de autenticação, timeouts e validação de webhooks).
- **Fase 11 & 12:** MaIA (integração obrigatória do `AiPolicyEngine` no `ToolRegistry.executeTool()`, níveis de risco e deny por padrão).
- **Fase 13 & 14:** Pagamentos e WABA (transação Postgres, idempotência garantida e verificação de assinatura).
- **Fase 15:** Auditoria (garantia de persistência oficial no Postgres com hash encadeado).
- **Fase 16:** Mocks (separação estrita entre ambientes).
- **Fase 17 a 19:** Backend modular, validação Zod e tratamento seguro de erros.
- **Fase 20 a 22:** Suíte de testes automatizados, scan final e checklist de homologação de produção.
