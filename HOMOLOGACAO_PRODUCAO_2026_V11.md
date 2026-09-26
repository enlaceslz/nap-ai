# NAP-AI V11 — Relatório de Fechamento dos Bloqueadores Reais de Autenticação, Financeiro e Estado Operacional

**Data:** 26 de Setembro de 2026  
**Ambiente:** HEAD da branch de desenvolvimento / homologação  
**Status da Suíte de Testes:** 182 testes executados, 182 aprovados (0 falhas)  
**Princípio Norteador:**
> **ERRO EXPLÍCITO > SUCESSO FALSO**  
> **DADO AUSENTE > DADO FABRICADO**  
> **ESTADO INDETERMINADO + RECONCILIAÇÃO > ESTADO FINAL INCORRETO**  
> **IDENTIDADE AUTENTICADA > CPF/ID INFORMADO PELO CLIENTE**  
> **POSTGRESQL > ESTADO OPERACIONAL VOLÁTIL**

---

## 1. Sumário Executivo da V11

A versão V11 fecha definitivamente os bloqueadores reais identificados na auditoria independente do HEAD:
1. **Autenticação Real do Portal do Assinante:** Erradicação de verificação por tamanho de string (`senha.length >= 6`). Implementação de validação criptográfica via Bcrypt (12 rounds) contra hash persistido no PostgreSQL (`clientes.senha_hash`). Rejeição imediata se cliente não possuir senha cadastrada, com fallback seguro para CPF + OTP Real.
2. **OTP Persistente e Auditável:** Substituição de `Map` em memória por tabela relacional PostgreSQL (`portal_otps`), armazenando `otp_hash`, `challenge_id`, `attempts`, `max_attempts`, `expires_at`, `status`, `request_ip`, `user_agent` e `provider_message_id`. OTP com expiração estrita de 300 segundos, uso único e bloqueio após 5 tentativas incorretas.
3. **WABA Sem Falso Sucesso:** Eliminação de blocos `catch` silenciosos. O status de envio para WhatsApp Business API só é marcado como `accepted` se a API da Meta Graph retornar HTTP 200 com `messages[0].id`. Em caso de erro, a requisição propaga falha real e persiste `status: 'failed'` com motivo detalhado.
4. **Erradicação de Pix Fabricado Localmente:** Remoção de geração local de `txid`, `pixPayload` ou `paymentChargeId` sintéticos como se fossem cobrança bancária. IDs internos (`internalChargeId`) são UUIDs próprios e identificados; IDs externos originam-se exclusivamente do gateway.
5. **Integração Real via Enlace-Pay / C6 Bank:** Fluxo oficial NAP → Enlace-Pay Gateway → PSP Banco C6 (336) Pix Cobrança API v2 com mTLS. Em caso de indisponibilidade de credenciais/certificados em produção, retorna HTTP 503 `GATEWAY_UNAVAILABLE`.
6. **Idempotência Financeira no PostgreSQL:** Campo `idempotency_key` persistido na tabela `faturas`. Requisições repetidas com a mesma chave retornam a fatura pré-existente (`idempotent: true`) sem duplicidade ou corrida.
7. **Webhook Financeiro Autenticado e Idempotente:** Proteção no middleware `c6BankMiddleware` exigindo token/secret de autenticação. Deduplicação persistida na tabela `webhooks_recebidos`. Validação estrita de valores: pagamentos com valor divergente são classificados como `amount_mismatch` e encaminhados para reconciliação, sem baixa automática indevida.
8. **PostgreSQL como Fonte da Verdade Financeira:** `Customer360Store` atua exclusivamente como cache/projeção (read model). O estado das faturas, transações, divergências e fila de baixa no ERP (`erp_sync_queue`) reside no PostgreSQL.
9. **Reboot ONU Sem Falso Sucesso:** Rota `POST /api/customers/:id/actions/reboot-onu` registra auditoria com status `pendente` antes do acionamento e só registra conclusão bem-sucedida após resposta afirmativa do GenieACS (TR-069). Em caso de falha ou CPE offline, retorna HTTP 502 `ACS_REBOOT_FAILED` e registra auditoria com status `falha`.

---

## 2. Evidências dos Bloqueadores Corrigidos

### 2.1 Autenticação Real por Senha no Portal (`server/auth/portalAuth.ts`)
- **Problema:** A rota de login aceitava qualquer senha desde que `senha.length >= 6`.
- **Correção Implementada:**
  - `authenticatePortalClient` consulta o campo `senhaHash` do cliente. Se nulo, rejeita com erro explícito orientando uso de OTP ou cadastro de senha inicial.
  - Validação via `bcrypt.compare(senha, cliente.senhaHash)`.
  - Função `setPortalPassword` aplica Bcrypt com custo 12 e registra auditoria (`PASSWORD_UPDATE`).
  - O hash de senha nunca é retornado no objeto retornado ao frontend (`(result.client as any).senhaHash === undefined`).
- **Evidência de Teste:** Testes 1.1, 1.2, 1.3 e 1.4 em `tests/v11_behavioral_validation.test.ts` aprovados.

### 2.2 OTP Persistente no PostgreSQL (`src/db/schema.ts`, `server/auth/portalAuth.ts`)
- **Problema:** OTPs eram mantidos apenas em `activeOtps = new Map()`, perdendo estado e sem trilha de auditoria.
- **Correção Implementada:**
  - Tabela `portal_otps` no PostgreSQL com campos `cliente_id`, `challenge_id`, `otp_hash`, `attempts`, `max_attempts`, `expires_at`, `status`, `request_ip`, `user_agent`, `provider_message_id`, `consumed_at`.
  - O código numérico nunca é persistido em texto claro (armazena HMAC-SHA256).
  - Consumo único: ao autenticar com sucesso, o registro é atualizado para `consumed` e expurgado da memória.
  - Limite de tentativas: após 5 tentativas incorretas, o status transiciona para `blocked`.
- **Evidência de Teste:** Testes 2.1, 2.2 e 2.3 em `tests/v11_behavioral_validation.test.ts` aprovados.

### 2.3 WABA Sem Falso Sucesso (`server/auth/portalAuth.ts`)
- **Problema:** Falhas na API do WhatsApp eram capturadas com `console.warn` e retornavam sucesso fictício.
- **Correção Implementada:**
  - Se `process.env.NODE_ENV === 'production'` e WABA não estiver configurado ou falhar na chamada da API da Meta Graph, o método lança exceção imediata e persiste `status: 'failed'` na tabela `portal_otps`.
  - `providerMessageId` é obtido exclusivamente de `wabaData.messages[0].id`.
- **Evidência de Teste:** Teste 3.1 em `tests/v11_behavioral_validation.test.ts` aprovado.

### 2.4 EnlacePayGateway & Erradicação de Pix Fictício (`server/payments/enlacePayGateway.ts`, `server/payments.ts`)
- **Problema:** `payments.ts` gerava strings locais simulando QR Code e TXID e persistia como se fossem cobrança bancária real.
- **Correção Implementada:**
  - Classe `EnlacePayGateway` gerencia a comunicação HTTPS mTLS com o Banco C6 (336) na rota `/api/v2/cob/{txid}`.
  - Separação estrita de identificadores:
    - `internalChargeId`: UUID técnico gerado pelo NAP (`chg_<uuid>`).
    - `providerChargeId` e `providerTxid`: TXID e identificadores oficiais do PSP C6 Bank.
  - Se o gateway não estiver configurado em ambiente de produção, lança `GatewayUnavailableError` (HTTP 503).
  - Remoção de valores padrão fictícios (`amount || 100`, `dueDate + 5 dias`, `ERP_${id}`).
- **Evidência de Teste:** Testes 4.1, 4.2 e 4.3 em `tests/v11_behavioral_validation.test.ts` aprovados.

### 2.5 Idempotência Financeira no PostgreSQL (`server/payments.ts`)
- **Problema:** Falta de verificação de idempotência no banco possibilitava geração de cobranças duplicadas em conexões instáveis.
- **Correção Implementada:**
  - Consulta ao banco `db.select().from(faturas).where(eq(faturas.idempotencyKey, idempotencyKey))` antes de disparar para o gateway.
  - Se já existir cobrança com a mesma chave, retorna HTTP 200 com a cobrança existente e flag `idempotent: true`.
- **Evidência de Teste:** Teste 3.3 em `tests/v10_behavioral_validation.test.ts` aprovado.

### 2.6 Webhook Financeiro Seguro, Idempotente e com Detecção de Divergência (`server/webhooks/webhookGateway.ts`, `server/payments.ts`)
- **Problema:** Webhooks eram aceitos sem autenticação, com risco de replay e aceitação de pagamentos parciais como integrais.
- **Correção Implementada:**
  - Middleware `c6BankMiddleware` valida cabeçalho `Authorization: Bearer <token>` contra `C6_WEBHOOK_SECRET` ou `WEBHOOK_SECRET`.
  - Idempotência verificada em duas camadas: tabela `webhooks_recebidos` no PostgreSQL e cache LRU em memória. Webhooks já processados retornam HTTP 200 com `{ duplicated: true }`.
  - Validação de valor: se `Math.abs(expectedAmount - numValor) > 0.01`, a fatura é marcada como `divergente`, a transação é registrada na tabela `financeiro_reconciliacao` com status `divergent`, e a rota retorna HTTP 422 com status `amount_mismatch`, bloqueando a baixa automática indevida no ERP.
- **Evidência de Teste:** Testes 5.1, 5.2 e 5.3 em `tests/v11_behavioral_validation.test.ts` aprovados.

### 2.7 Reboot ONU Sem Falso Sucesso (`server/payments.ts`)
- **Problema:** Auditoria de sucesso era gravada antes da execução e falhas no TR-069 eram mascaradas.
- **Correção Implementada:**
  - Trilha de auditoria prévia grava status `pendente` com ação `ONU_REBOOT_REQUESTED`.
  - Chamada real ao `GenieacsService.getInstance().rebootDevice(onuSerial)`.
  - Se `acsResult.success === false`, grava auditoria com ação `ONU_REBOOT_FAILED`, status `falha`, e responde HTTP 502 `ACS_REBOOT_FAILED`.
  - Somente após confirmação positiva do GenieACS, grava auditoria `ONU_REBOOT_COMPLETED` com status `sucesso` e responde HTTP 200 `REBOOT_ACCEPTED`.
- **Evidência de Teste:** Teste 6.1 em `tests/v11_behavioral_validation.test.ts` e Teste 4.2 em `tests/v10_behavioral_validation.test.ts` aprovados.

---

## 3. Matriz de Resultados dos Testes Automatizados

Execução dos testes comportamentais via `npm test` no ambiente Node.js / TypeScript:

| Suíte | Testes | Sucesso | Falhas | Duração |
|---|:---:|:---:|:---:|:---:|
| `v11_behavioral_validation.test.ts` | 15 | 15 | 0 | 3.9s |
| `v10_behavioral_validation.test.ts` | 35 | 35 | 0 | 1.8s |
| Suítes Regulares (CRM, WABA, Zabbix, Push, Asterisk) | 132 | 132 | 0 | 15.2s |
| **TOTAL** | **182** | **182** | **0** | **~21s** |

---

## 4. Declaração de Homologação

- **Homologação Lógica, Arquitetural e Comportamental:** **APROVADA**. Todos os bloqueadores de lógica, persistência, autorização, autenticação e idempotência foram verificados e cobertos por testes automatizados.
- **Homologação Física de Campo:** **PENDENTE DE IMPLANTAÇÃO NO HARDWARE**. A homologação física real (testes com ONT física conectada a OLT e certificados mTLS emitidos pela autoridade certificadora do Banco C6) deve ser realizada na VPS/VM Debian 12 do provedor conforme o guia `DEPLOY.md`.
