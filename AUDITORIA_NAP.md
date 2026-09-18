# Relatório de Auditoria Técnica e Hardening de Segurança — NAP

**Projeto:** NAP (Núcleo de Atendimento ao Provedor)  
**Repositório:** `https://github.com/enlaceslz/nap-ai`  
**Escopo:** Auditoria de Segurança, Hardening de Aplicação e Infraestrutura, Consolidação de Banco de Dados e Governança de Inteligência Artificial.  
**Arquitetura:** Single-Tenant Dedicado por Provedor / Instância VPS Debian 12  
**Data:** Setembro de 2026  
**Status:** APROVADO PARA PRODUÇÃO (CONSOLIDADO) ✅

---

## 1. Sumário Executivo

O **NAP (Núcleo de Atendimento ao Provedor)** foi submetido a uma auditoria arquitetural rigorosa com foco em:
1. **Segurança de Autenticação e Autorização:** Extinção total de autenticação baseada em headers não assinados e implementação de RBAC nativo com tokens criptográficos JWT.
2. **Gestão Segura de Credenciais:** Eliminação de senhas default, remoção de credenciais expostas em código e no `docker-compose.yml`, ativação de validação no boot (`secretsValidator`) com bloqueio de inicialização em modo de produção caso existam chaves inseguras.
3. **Hardening HTTP e Mitigação de Ataques:** Inclusão de Helmet com CSP estrito, rate limiting por IP, sanitização contra SQL Injection e XSS, e tratador de erros global sem vazamento de stack traces internos.
4. **Governança e Política de IA (MaIA / Gemini):** Implementação do `AiPolicyEngine` intermediando todas as invocações de ferramentas (`toolRegistry`). Ações com impacto crítico em telecomunicações (ex: `reboot_onu`, `desbloqueio_confianca`, `reset_porta_olt`) agora são submetidas à validação de permissões, controle de risco e auditoria obrigatória.
5. **Consolidação de Dados & Customer 360:** Unificação de tabelas concorrentes (`clientes` vs `nap_customers`, `faturas` vs `nap_invoices`) em modelo relacional coeso com integridade referencial, soft-delete para conformidade LGPD e tipos numéricos de alta precisão (`numeric(15,2)`).
6. **Integridade de Webhooks e Idempotência:** Assinatura HMAC SHA-256 para webhooks do Meta WhatsApp WABA, chave de idempotência com deduplicação para pagamentos Pix (Banco C6) e retenção transacional via `erpSyncQueue`.

---

## 2. Vulnerabilidades Identificadas e Ações Corretivas

| Item | Vulnerabilidade Original | Severidade | Ação Corretiva Aplicada | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Confiança cega em headers do frontend (`x-user-id`, `x-user-role`) | **CRÍTICA** | Criado `server/auth/rbacMiddleware.ts` com validação de JWT, papéis tipados (`UserRole`) e verificação estrita de permissões (`requirePermission`). Headers não autenticados são descartados. | **RESOLVIDO** |
| **SEC-02** | Credenciais padrão em `docker-compose.yml` (`POSTGRES_PASSWORD: nap_secure_pwd`) e portas de BD expostas para a internet | **ALTA** | Removidas credenciais estáticas do Compose; portas do Postgres, Redis e Mongo agora realizam bind exclusivo em `127.0.0.1`. Variáveis são injetadas exclusivamente via `.env` do host. | **RESOLVIDO** |
| **SEC-03** | Ausência de validação de inicialização de segredos em produção | **ALTA** | Implementado `server/security/secretsValidator.ts` que executa no startup de `server.ts` e bloqueia a inicialização se segredos padrão forem detectados em ambiente de produção. | **RESOLVIDO** |
| **SEC-04** | Falta de proteção contra replay attacks em Webhooks WABA e C6 Bank | **ALTA** | Implementado `server/webhooks/webhookGateway.ts` com validação de assinatura HMAC SHA-256 e tabela `webhooks_recebidos` com índice único composto (`origem`, `identificadorExterno`). | **RESOLVIDO** |
| **SEC-05** | Execução direta de ferramentas de IA sem controle de privilégio e risco | **ALTA** | Implementado `server/agent/policyEngine.ts`. Ações como `onu_reboot`, `olt_disable` e `sgp_desbloqueio_confianca` passam por avaliação de risco e exigem contexto autenticado. | **RESOLVIDO** |
| **SEC-06** | Esquema de banco duplicado (`clientes` e `nap_customers`, `faturas` e `nap_invoices`) | **MÉDIA** | Unificado `src/db/schema.ts` sob o modelo oficial do Customer 360, mantendo retrocompatibilidade sem duplicidade física de dados. | **RESOLVIDO** |
| **SEC-07** | Ausência de cabeçalhos de segurança HTTP e taxa de requisições desprotegida | **MÉDIA** | Integrado `helmet` e `createRateLimiter` em `server.ts`, mitigando clickjacking, MIME sniffing e ataques de negação de serviço. | **RESOLVIDO** |
| **SEC-08** | Logs de auditoria voláteis sujeitos a adulteração | **MÉDIA** | Implementado encadeamento criptográfico SHA-256 (`previousHash` -> `entryHash`) em `logs_auditoria`, tornando os registros imutáveis e auditáveis perante a LGPD e Marco Civil da Internet. | **RESOLVIDO** |

---

## 3. Arquitetura de Isolamento Single-Tenant

O NAP foi desenhado e homologado para operar com **isolamento absoluto**:
- **Uma Instância por Provedor (Single-Tenant):** Cada ISP executa sua própria máquina virtual Debian 12 ou contêiner dedicado com banco de dados PostgreSQL local.
- **Não Compartilhamento de Recursos:** Não há banco compartilhado, pool compartilhado de sessões ou roteamento compartilhado entre provedores distintos.
- **Proteção dos Dados dos Assinantes:** Informações confidenciais, tráfego de voz Asterisk SIP/RTP, telemetria CWMP/TR-069 e chaves bancárias mTLS residem exclusivamente dentro dos limites da infraestrutura do próprio ISP.

---

## 4. Conclusão da Auditoria

O sistema foi compilado com sucesso via Vite e esbuild (`dist/server.cjs`), sem erros de tipagem TypeScript ou quebras de dependências. Todas as vulnerabilidades de autenticação, injeção, concorrência e vazamento de segredos foram sanadas de acordo com as melhores práticas da indústria Telecom e OWASP Top 10.
