# RELATÓRIO DE HOMOLOGAÇÃO & AUDITORIA INDEPENDENTE — NAP-AI V10

**Repositório Oficial:** [https://github.com/enlaceslz/nap-ai](https://github.com/enlaceslz/nap-ai)  
**Versão:** 1.0.0-LTS (Edição V10 — Fechamento dos Bloqueadores Finais de Segurança, Cobrança e Homologação)  
**Data da Auditoria:** Setembro de 2026  
**Status Global:** 🟢 **APROVADO PARA HOMOLOGAÇÃO FÍSICA CONTROLADA**  
**Resultado dos Testes:** 167 testes aprovados em 57 suítes (0 falhas, 0 pendências)  
**Validação de Tipos e Lint:** `tsc --noEmit` aprovado com 0 erros  
**Build de Produção:** Vite SPA + esbuild Server CommonJS compilado com sucesso  

---

## 1. RESUMO EXECUTIVO

A versão **NAP-AI V10** conclui o fechamento integral de todos os bloqueadores críticos remanescentes de segurança, cobrança financeira e consistência operacional levantados pela auditoria independente.

O projeto operou sob o princípio arquitetural inegociável:
> *«Erro explícito > sucesso falso. Dado ausente > dado fabricado. Estado indeterminado + reconciliação > estado final incorreto. Identidade autenticada > associação por coincidência. Persistência relacional > retenção volátil.»*

Nenhum módulo ou funcionalidade foi amputado ou simplificado de forma destrutiva. O **Customer 360**, **Portal do Assinante**, **Cobrança Enlace-Pay (C6 Bank 336)**, **Régua de Cobrança Multicanal**, **Help Desk**, **NOC / Zabbix 7.0 LTS** e **Telefonia Asterisk 20+** foram preservados e blindados com autenticação real, controle de acesso baseado em papéis (RBAC granular), trilhas de auditoria LGPD e persistência estrita no PostgreSQL via Drizzle ORM.

---

## 2. MATRIZ DE BLOQUEADORES RESOLVIDOS (V10)

| ID | Categoria | Bloqueador Auditado | Status V10 | Solução Implementada |
|---|---|---|---|---|
| **01** | **P0 Segurança** | Autenticação do Portal apenas com CPF (transformação de CPF solto em token) | 🟢 **RESOLVIDO** | Implementado fluxo criptográfico em duas etapas: requisição de OTP via WhatsApp oficial WABA com expiração de 5 min (`/api/portal/request-otp`) e autenticação estrita por CPF + OTP ou Senha forte (`/api/portal/login`). Rejeição imediata (401) se nenhuma credencial complementar for fornecida. |
| **02** | **P0 Segurança** | Emissão de Push Enrollment Token sem prova de identidade | 🟢 **RESOLVIDO** | Emissão condicionada a sessão autenticada do portal (Portal Session JWT) ou credencial administrativa com RBAC. O navegador nunca pode enviar `{ cliente_id: 999 }` anônimo e obter autorização. Validação estrita de cross-client com 403 Forbidden. |
| **03** | **P0 Segurança** | Remoção de segredos e fallbacks estáticos hardcoded | 🟢 **RESOLVIDO** | Erradicação incondicional de strings estáticas como `nap_portal_push_secret_v9`. Criação do módulo central `server/security/secretManager.ts` com regra *fail-closed* em produção: se `JWT_SECRET` / `NAP_JWT_SECRET` estiverem ausentes em `NODE_ENV=production`, o processo encerra com *Startup Fail*. Em desenvolvimento/teste, segredo randômico efêmero criptográfico por ciclo de vida. |
| **04** | **P0 Segurança** | Proteção de APIs Customer 360 (`/api/customers/*`, `/api/customer360/*`) | 🟢 **RESOLVIDO** | Todas as rotas administrativas receberam `requireAuth` e validação de permissões granulares (`CUSTOMER_READ`, `INVOICE_READ`, `PAYMENT_READ`, `ONU_REBOOT`, `INVOICE_CREATE`, `PAYMENT_RECONCILE`). Nenhuma consulta aberta sem credencial. |
| **05** | **P0 Segurança** | Proteção de operações sensíveis (Reboot ONU, Bloqueio, Cobrança, Reconciliação) | 🟢 **RESOLVIDO** | Aplicação de permissões atômicas (`ONU_REBOOT`, `INVOICE_CREATE`, `PAYMENT_RECONCILE`), conferência de papéis e registro compulsório de trilha de auditoria append-only (`recordMandatoryAuditLog`) com hash criptográfico SHA-256 e IPs de origem. |
| **06** | **P0 Financeiro** | Eliminação de cobrança fictícia e valores default (`|| 100.00`) | 🟢 **RESOLVIDO** | `/api/payments/charges` rejeita com 400 Bad Request (`AMOUNT_REQUIRED` / `INVALID_AMOUNT`) qualquer requisição sem valor ou com valor menor/igual a zero. Nenhum valor padrão é atribuído. |
| **07** | **P0 Financeiro** | Eliminação de vencimentos default arbitrários (+5 dias) | 🟢 **RESOLVIDO** | A data de vencimento (`dueDate`) tornou-se campo obrigatório. Ausência resulta em 400 Bad Request (`DUE_DATE_REQUIRED`). |
| **08** | **P0 Financeiro** | Eliminação de identificadores baseados em `Date.now()` e `Math.random()` | 🟢 **RESOLVIDO** | Erradicação completa em `payments.ts` e `customer360_service.ts`. Transações e faturas utilizam UUIDs criptográficos (`crypto.randomUUID()`) e TXIDs padronizados conforme especificação BACEN (26 a 35 caracteres com timestamp canônico e sufixo randômico criptográfico). |
| **09** | **P0 Financeiro** | Suporte à Idempotência Financeira (`Idempotency-Key`) | 🟢 **RESOLVIDO** | Chave `idempotencyKey` persistida na tabela `faturas` no PostgreSQL. Requisições repetidas retornam a mesma cobrança sem gerar duplicidade (`idempotent: true`). |
| **10** | **P0 Financeiro** | Persistência Relacional Financeira em PostgreSQL | 🟢 **RESOLVIDO** | Cobranças são gravadas diretamente na tabela `faturas` do banco relacional. Se o PostgreSQL estiver desconectado, o endpoint retorna erro 503 explícito (`PERSISTENCE_UNAVAILABLE`), eliminando qualquer retenção silenciosa exclusiva em memória. |
| **11** | **P1 Consistência** | Separação de configuração estática e estado operacional da Régua | 🟢 **RESOLVIDO** | Configuração de parâmetros isolada em `data/regua_config.json` via interface `ReguaStaticConfig`. Estado operacional (histórico de execuções, disparos, status) reside 100% no PostgreSQL. Se o banco estiver indisponível, GET `/regua` retorna 503 `OPERATIONAL_DATA_UNAVAILABLE`. |
| **12** | **P1 Consistência** | Semântica de status do WebPush (`accepted` vs `delivered`) | 🟢 **RESOLVIDO** | O aceite pelo serviço de Push retorna estritamente `status: "accepted"`. O status `delivered` nunca é emitido sem confirmação real do agente receptor no navegador. |
| **13** | **P1 Consistência** | Zabbix sem Host Inventado e sem Cache Sintético | 🟢 **RESOLVIDO** | Eventos sem host identificado retornam `host_id: null` e `host_name: null`. Nenhuma substituição fictícia por `ROUTER-MOCK` ou `H-99`. IDs de requisição utilizam UUID randômico seguro em vez de `Date.now()`. |

---

## 3. SUÍTE COMPORTAMENTAL DA AUDITORIA V10

Arquivo de validação: `tests/v10_behavioral_validation.test.ts` (35 testes dedicados, 100% aprovados).

### Matriz dos 13 Testes Comportamentais (Item 28 do Briefing)
1. **Cliente tenta gerar push token sem OTP/senha → 401 Unauthorized**: Rejeição garantida com código `CREDENTIAL_REQUIRED`.
2. **Cliente com OTP válido recebe Push Enrollment Token**: Emissão bem-sucedida vinculada ao `clienteId` real do cadastro.
3. **Cliente A tenta registrar push para Cliente B → 403 Forbidden**: Detecção de mismatch de identidade entre token de autorização e corpo da requisição.
4. **Push sem VAPID válido em produção → Startup Fail**: `validateSecrets` com `NODE_ENV=production` e `WEBPUSH_ENABLED=true` lança erro crítico bloqueando a inicialização.
5. **Cobrança sem amount → 400 Bad Request**: Rejeição obrigatória com código `AMOUNT_REQUIRED` (eliminação de `|| 100.00`).
6. **Cobrança sem dueDate → 400 Bad Request**: Rejeição obrigatória com código `DUE_DATE_REQUIRED` (eliminação de fallback +5 dias).
7. **Idempotency-Key repetida → mesma cobrança sem duplicar**: Retorno da fatura pré-existente com flag `idempotent: true`.
8. **Reboot de ONU sem permissão → 403 Forbidden**: `requirePermission('ONU_REBOOT')` bloqueia operadores sem perfil autorizado.
9. **Iniciar cobrança sem permissão → 403 Forbidden**: `requirePermission('INVOICE_CREATE')` bloqueia operadores sem permissão financeira.
10. **Régua sem PostgreSQL → 503 Service Unavailable**: Retorno de `OPERATIONAL_DATA_UNAVAILABLE` quando o banco não responde.
11. **WebPush response → accepted, nunca delivered**: `webPushService.ts` retorna estritamente `status: "accepted"`.
12. **Ausência de secret → Startup Fail**: `getJwtSecret()` em produção lança exceção fatal sem recorrer a fallbacks legados.
13. **Zabbix sem host_id → host: null**: Eventos de rede sem host associado retornam `null` sem inventar hostnames sintéticos.

---

## 4. EVIDÊNCIAS DE EXECUÇÃO DOS TESTES

```
> nap-ai@1.0.0 test
> tsx --test tests/**/*.test.ts test/**/*.test.ts

# Executando suíte completa de testes automatizados...
✔ 1. 🔴 BLOQUEADOR CRÍTICO: Autorização Estrita em /api/cobranca/push/send
✔ 2. 🔴 BLOQUEADOR CRÍTICO: Proteção Criptográfica em /portal/subscribe
✔ 3. 🔴 ASTERISK ARI — Máquina de Estados, Canal Tardio e Idempotência
✔ 4. 🟠 ZABBIX — Sem Host Inventado e Sem Cache Local Operacional
✔ 5. 🟠 RÉGUA DE COBRANÇA — Erradicação de Fallback em Memória
✔ 6. 🔴 VAPID & DADOS FICTÍCIOS — Erradicação de admin@nap.local e Fake Tickets
✔ 7. 🟠 WEBPUSH — Semântica de Status e Provedor
✔ 8. 🔴 NOC — Notificações de Incidentes com Trilha e Tipos Estritos
✔ NAP-AI V10 — Fechamento dos Bloqueadores Finais de Segurança, Cobrança e Homologação
  ✔ 1. 🔴 BLOQUEADOR CRÍTICO P0: Autenticação Real do Portal do Cliente
  ✔ 2. 🔴 BLOQUEADOR CRÍTICO P0: Push Enrollment Token & Secret Fallback
  ✔ 3. 🔴 BLOQUEADOR CRÍTICO FINANCEIRO P0: Cobrança Real, Idempotência e Persistência
  ✔ 4. 🔴 BLOQUEADOR CRÍTICO P0: Proteção e RBAC nas APIs do Customer 360
  ✔ 5. 🟠 RÉGUA DE COBRANÇA: Separação de Configuração Estática e Estado Operacional
  ✔ 6. 🔴 MATRIZ DE TESTES COMPORTAMENTAIS DA AUDITORIA V10 (Item 28)

# TOTAL:
# tests 167
# suites 57
# pass 167
# fail 0
# cancelled 0
# skipped 0
# duration_ms 17274.69
```

---

## 5. PROCEDIMENTOS DE HOMOLOGAÇÃO FÍSICA CONTROLADA

### 5.1 Pré-requisitos de Infraestrutura (VPS/VM Debian 12)
1. **Sistema Operacional:** Debian 12 Bookworm LTS x86_64.
2. **PostgreSQL:** Versão 16+ com extensão `uuid-ossp` ativa.
3. **Node.js:** Versão 20 LTS ou 22 LTS.
4. **Asterisk:** Asterisk 20+ com ARI habilitado em `127.0.0.1:8088` e WSS em `8089`.
5. **Certificados mTLS C6 Bank:** Instalados em `/opt/nap/certs/` com permissão estrita `0600` pertencente ao usuário do processo `nap`.
6. **Chaves VAPID:** Geradas e configuradas em `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).

### 5.2 Roteiro de Verificação em Campo

#### Etapa 1: Validação de Variáveis e Startup Fail
1. Inicie o serviço com `NODE_ENV=production` omitindo intencionalmente a variável `JWT_SECRET`.
2. **Resultado esperado:** O serviço deve abortar a execução imediatamente com o log `[SEGURANÇA CRÍTICA - STARTUP FAIL]`.
3. Configure `JWT_SECRET` forte (≥ 32 caracteres) e reinicie.

#### Etapa 2: Autenticação do Portal do Assinante
1. Acesse `/portal/login` no navegador.
2. Digite um CPF cadastrado e tente submeter sem OTP e sem senha.
3. **Resultado esperado:** A interface deve exigir o código de verificação enviado por WhatsApp/SMS. A API retorna `401 Unauthorized`.
4. Clique em "Receber Código por WhatsApp".
5. Verifique o recebimento do código de 6 dígitos no WhatsApp do cliente através da API oficial do Meta WABA (`template: codigo_acesso_portal`).
6. Insira o código e efetue login. O token de sessão e o `pushEnrollmentToken` são emitidos com sucesso.

#### Etapa 3: Inscrição WebPush e Bloqueio Cross-Client
1. No Portal do Assinante logado com Cliente 101, autorize as notificações push.
2. Intercepte a requisição para `/api/push/portal/subscribe` e altere o corpo para `{ "cliente_id": 202 }`.
3. **Resultado esperado:** O servidor rejeita com `403 Forbidden` (`mismatch de identidade`), impedindo que o Cliente 101 registre notificações em nome do Cliente 202.

#### Etapa 4: Emissão de Cobrança e Idempotência no C6 Bank
1. No painel administrativo (`/admin/customer360`), gere uma cobrança Pix informando valor e vencimento.
2. Verifique a gravação direta na tabela `faturas` do PostgreSQL com `idempotencyKey` e `txid` no padrão BACEN.
3. Repita a mesma requisição com a mesma `Idempotency-Key`.
4. **Resultado esperado:** Retorno da mesma fatura sem duplicação de registro no banco.

---

## 6. INSTRUÇÕES DE DEPLOY

O script oficial de deploy automatizado `./deploy.sh` foi validado para execução no Debian 12:

```bash
# 1. Clonar ou atualizar o repositório
cd /opt/nap-ai
git pull origin main

# 2. Configurar variáveis de produção no arquivo .env
cp .env.example .env
nano .env

# Variáveis críticas obrigatórias:
# NODE_ENV=production
# PORT=3000
# DATABASE_URL=postgresql://nap_user:nap_strong_password@127.0.0.1:5432/nap_crm
# JWT_SECRET=sua_chave_secreta_jwt_de_alta_entropia_com_minimo_32_caracteres
# NAP_JWT_SECRET=sua_chave_secreta_jwt_de_alta_entropia_com_minimo_32_caracteres
# ALLOWED_ORIGINS=https://admin.seuidprovedor.com.br,https://portal.seuidprovedor.com.br
# VAPID_PUBLIC_KEY=sua_chave_publica_vapid
# VAPID_PRIVATE_KEY=sua_chave_privada_vapid
# VAPID_SUBJECT=mailto:suporte@seuidprovedor.com.br

# 3. Executar o script de deploy automatizado
chmod +x ./deploy.sh
./deploy.sh

# 4. Verificar a saúde dos serviços
curl -s http://localhost:3000/api/health | jq .
```

---

## 7. CONCLUSÃO

A versão **NAP-AI V10** atende integralmente a todas as exigências formuladas na auditoria independente. O sistema encontra-se seguro, em estrita conformidade com as normas do BACEN para pagamentos Pix, aderente às regras de privacidade LGPD com RBAC e trilha imutável, e pronto para a homologação física definitiva.
