# NAP (Núcleo de Atendimento ao Provedor) - System Instructions for AI Agents

These are the core architectural and design constraints for any AI agent interacting with the NAP codebase.

## 1. Project Context
NAP is an Omnichannel SaaS platform built for ISPs (Internet Service Providers).
It is designed to run completely isolated per ISP on its own dedicated VPS/VM infrastructure.
The core stack includes Debian 12, Asterisk 20+, GenieACS (TR-069), WABA (WhatsApp Cloud API), Zabbix 7.0 LTS, and SGP (Billing/ERP Emulator). The NAP (Node.js backend) acts directly as the AI Voice Agent via Gemini, connecting with Asterisk via AMI/ARI, and powers a complete Omnichannel CRM.

## 2. Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (Icons), Leaflet & React-Leaflet (GIS Mapping).
- **Backend:** Node.js, Express (running from `server.ts`).
- **Database:** PostgreSQL via Drizzle ORM (connected via `DATABASE_URL`).
- **PWA Portal:** Mobile-first customer portal (`/portal`) using `vite-plugin-pwa` for Service Workers, caching, Web App Manifests, push notifications, direct Webchat queues, and WebRTC Webphone for direct voice calls to the operator.
- **Build System:** Vite builds the SPA, esbuild bundles `server.ts` into a CommonJS server (`dist/server.cjs`).
- **Styling:** "Premium SaaS Dark Theme" for admin (`#0b0f19`, `#101726`), light theme for Customer PWA.
- **Auth:** Firebase Authentication with a built-in Mock Session fallback inside `AuthContext.tsx` if Firebase API fails locally.

## 3. Core Principles
- **Idioma do Assistente:** Todas as explicações, resumos, mensagens e comunicações com o usuário devem ser estritamente em **Português Brasileiro (pt-BR)**.
- **No AI Slop:** Keep the UI strictly professional. No gratuitous gradients, glowing shadows, or nested boxes. Use mathematical padding, structural borders, and refined typography.
- **Full-stack by default:** All external integrations MUST be routed through `/api/*` endpoints in `server.ts` to protect credentials. Never expose Gemini, WABA, Zabbix, or ERP API Keys on the client side.
- **Tenant Isolation:** Although the code supports multi-tenancy, the deployment model assumes one ISP per VM for strict data privacy and telephony isolation.

## 4. Key Modules to Preserve
- **Customer 360 & Enlace-Pay (C6 Bank 336):** Módulo financeiro e cadastral unificado em `/admin/customer360`. Inclui integração Pix Cobrança-API via mTLS com o Banco C6 (336), conciliação instantânea, detecção de divergências de valores, emissão de cobranças Pix dinâmicas (QR Code e Copia e Cola) e baixa automática no ERP (SGP / IXC / HubSoft) com fila de contingência resiliente (`erpSyncQueue`). Conta com guia visual interativo de procedimentos C6 Empresas (`C6BankProcedimentosGuia.tsx`).
- **Inbox Unificado & Triagem IA:** Handles WhatsApp WABA and Webchat integrations fetching from PostgreSQL via Drizzle. Inclui modo Triagem IA com o Cérebro Gemini operando como Copiloto e filtro dedicado para Handoff (transferência humano-IA).
- **Help Desk Central (Zammad/OSticket Engine):** Módulo de orquestração unificada de tickets de suporte, NOC e alarmes de rua localizado em `/admin/helpdesk`.
- **Centro de Controle Operacional (NOC & GIS):** Integra dashboards em `/admin/dashboard` (Radar de técnicos, PABX), o mapa georreferenciado `/admin/mapa-rede` (Leaflet com clusters de ONTs) e a central `/admin/infra` com telemetria Zabbix 7.0 LTS, alarmes de WAF e OLTs em tempo real.
- **CRM 360 & Kanban:** Uses Slide-over panels to show customer context and manages SGP billing operations (PIX, Unblocks, promessas de pagamento).
- **Multi-ERP Hub:** Adaptadores de integração para SGP, MikWeb, IXC Soft e Hubsoft em `/admin/erp-integracoes` com suporte a baixa automática e sincronização bidirecional.
- **GenieACS:** Dashboard for CPE telemetry (ONU Power, Uptime, Wi-Fi, reboot remoto via TR-069 CWMP).
- **Régua de Cobrança e Campanhas (Marketing ISP):** Orquestrador em `/admin/campanhas` integrado ao backend (`server/marketing/reguaRoutes.ts`) para automatizar envios de cobrança via WABA com base no vencimento de faturas (D-3, D0, D+3, D+7) do ERP e push notifications.
- **Vitrine SaaS B2B:** Rota landing isolada (`/nap`) projetada para exibição aos ISPs, com conteúdo editável (Firestore `system_config`) pelo SuperAdmin.
- **Portal do Cliente (PWA):** Mobile-first auto-service app (`/portal`). Features Webchat routing, invoice payments, and WebRTC Webphone.
- **Técnico de Campo (PWA) & Geolocalização:** Módulo em `/admin/campo` Mobile-First para gestão de Ordens de Serviço na rua. Conta com rastreamento GPS em tempo real transmitido para o "Radar" no dashboard administrativo.
- **Ajuda, Documentação & Homologação:** Módulo interativo em `/admin/ajuda` com matriz de pendências de homologação (Staging/UAT), guias operacionais de cada subsistema (incluindo C6 Bank mTLS e SGP) e guia completo de deploy.
- **Hierarquia de Usuários & Auditoria:** Módulo de controle de permissões em 4 níveis (Admin Geral, Operador, Técnico N1, Técnico N2) e trilha de auditoria LGPD em `/admin/auditoria`.

## 5. Development Workflow
When making changes:
1. Ensure Vite development proxy handles API routes to `server.ts`.
2. Do not modify the build scripts in `package.json` unless absolutely necessary for the Express + Vite setup.
3. Test layout changes across Desktop and Mobile.
4. Keep documentation in `/admin/ajuda`, `DEPLOY.md`, `deploy.sh` and `AGENTS.md` synchronized whenever new architecture, ports or APIs are introduced.

## 6. Architectural Upgrades & Rules to Remember (Setembro 2026)
- **Enlace-Pay & C6 Bank (336):** O gateway de pagamentos opera com conexão mTLS direta (`/api/payments/c6-config`) e webhook seguro (`/api/payments/webhook`). O processamento de pagamentos Pix efetua baixa em tempo real no ERP através de `ErpFactory.getAdapter(...).baixarFatura()`. Em caso de indisponibilidade transitória do ERP, a transação é retida na `erpSyncQueue` para reprocessamento automático garantido (Zero Data Loss).
- **IPAM (Network Source of Truth):** Adapters nativos (`server/ipam/service.ts`) para gestão de alocação de IPv4/IPv6, integrado com o ERP para Binding e delegando reservas via `NautobotAdapter` ou fallback em DB nativo (`ipam_reservations`).
- **Resiliência e Memory Fallback:** Todos os módulos (CRM, Help Desk, IPAM, WABA, C6 Bank) foram consolidados para operar silenciosamente em "Memory Fallback" quando o PostgreSQL ou APIs externas (como Zammad/SGP/C6) não estiverem acessíveis no ambiente (como no Preview). Isto significa que você nunca deve lançar `.error()` explícitos ou deixar vazar a palavra "failed" que dispare triggers de "Fix It" falsos na UI da plataforma. Use o padrão `[Fallback] Utilizando dados em memória para...`.
- **Database (PostgreSQL + Drizzle):** As tabelas `conversas`, `mensagens`, `users`, `faturas` estão consolidadas no schema. A conexão via string (Docker ou nativa) é o fallback e motor oficial de dados WABA/CRM.
- **Agent Tool Registry:** Gemini AI logic must always use the `agentToolRegistry` in `server/gemini.ts`. Do not revert to static prompts for WABA webhooks. The webhook (`server/waba.ts`) must pass intents to the main agent engine for dynamic tool calling (PIX, NOC Check, TR-069 Reboot, desbloqueio em confiança).
- **Handoff WABA ↔ SGP (Kanban):** Any Handoff (operator intervention) triggering from the unified inbox (`/admin/inbox`) must call `/api/waba/handoff` to synchronize the state with the SGP Kanban (Sales/Support/Billing) and notify the end-user via WhatsApp Cloud API.
- **Deploy & Portas Oficiais:** O NAP roda em Debian 12 em portas bem definidas: 3000 (Web/API), 80/443 (Nginx + SSL), 8089 (Asterisk WSS), 5060/5061 (SIP), 10000:20000 (RTP), 7547/7567 (TR-069 GenieACS), 3005 (GenieACS UI), 10050/10051 (Zabbix Agent/Server), 5432 (PostgreSQL), 3799 (Radius PoD/CoA). Certificados mTLS residem em `/opt/nap/certs/`. O script de deploy oficial é o `./deploy.sh`.
- **Communications Hub (Telegram & RAG):** Módulo orquestrador central em `/server/communications/`. Recebe payloads do Event Engine (Zabbix/GIS) e notifica via Telegram Gateway. Contém o `NocCopilot` (AI Gateway via Gemini).
- **Field Service (SGP Mobile):** Desacoplado em `/server/field/`. Fornece endpoints REST para Ordens de Serviço. Integra-se nativamente com o Communications Hub.
- **Event-Driven Correlation:** Todos os alarmes críticos gerados no Zabbix e os rompimentos estimados de fibra do GIS engatilham orquestração via webhook local disparando para o Hub.

## 7. Database Typings & Idempotency Rules (CRITICAL)
- **Foreign Keys**: NEVER use `serial` for foreign keys in `schema.ts`. ALWAYS use `integer().references(...)`.
- **Financial Types**: ALL monetary values MUST be `numeric('...', { precision: 15, scale: 2 })`. Never use `varchar` or `float`.
- **Soft Delete**: Core tables (`clientes`, `conversas`) utilize `deletedAt` for LGPD compliance. Never hard-delete records.
- **Idempotency**: Webhook entries (`waba_webhooks`) and financial transactions (`faturas`) MUST use unique keys (`wabaMessageId`, `idempotencyKey`, `transactionId`) to prevent race conditions and duplicate processing.
