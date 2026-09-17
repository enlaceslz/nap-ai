# NAP (Núcleo de Atendimento ao Provedor) - Omnichannel SaaS para ISPs

O **NAP** é uma plataforma SaaS completa BSS/OSS projetada para Provedores de Internet (ISPs). Ele atua como um hub central, unificando atendimento, orquestração de rede, CRM, faturamento e gestão técnica de campo.

## 🚀 Principais Módulos

*   **Copiloto IA & Inbox Omnichannel:** Integração oficial WABA (WhatsApp) com Triagem por IA (Gemini) e transbordo transparente para o atendimento humano (Kanban de CRM).
*   **Gestão Financeira & Régua de Cobrança:** Automação de notificações de vencimento (D-3 a D+7) e integração Multi-ERP (SGP, IXC, Hubsoft) via padrão *Adapter*.
*   **Telemetria & NOC:** Dashboards interativos de monitoramento, integração com Zabbix (Alarmes) e GenieACS (TR-069) para gerenciamento de ONTs.
*   **GIS & Field Service (Técnicos de Campo):** Mapa georreferenciado Leaflet com rastreio de técnicos em tempo real e App Mobile-first (PWA) para baixa de O.S.
*   **Portal do Cliente (PWA B2C):** Autoatendimento para 2ª via de PIX/Boleto, troca de senha Wi-Fi, e alertas proativos de quedas na rede.

## 🏗 Arquitetura & Stack Tecnológico

A plataforma adota um modelo **Full-Stack Híbrido** e roda em ambiente isolado (Tenant por VM):
*   **Frontend:** React 18, Vite, Tailwind CSS, Shadcn/UI, Leaflet.
*   **Backend:** Node.js (Express) encapsulado com Esbuild (`dist/server.cjs`).
*   **Banco de Dados:** PostgreSQL via **Drizzle ORM** (Migrações tipadas, Idempotência transacional, Controle de concorrência e Soft Deletes).
*   **IA & Integrações:** Firebase Auth, Google Gemini AI (Vertex/AI Studio), Asterisk (AMI/ARI) e WebRTC.

## 🛡 Segurança & Disaster Recovery
A camada de dados do NAP foi projetada para suportar a transição BSS/ERP, utilizando:
*   Chaves Estrangeiras Inteiras e Tratamento de Transações (Idempotência).
*   Campos Financeiros rigorosamente tipados (`numeric(15,2)`).
*   Scripts nativos de Backup e Restauração Transacional (`scripts/backup_db.sh`).
*   Trilha de Auditoria (LGPD) acoplada no Drizzle.

## 📄 Documentações do Ecossistema
Consulte a documentação dedicada para cada pilar operacional:
- [`infra.md`](./infra.md) - Modelagem ERD do Banco e Fluxo de Arquitetura de Dados.
- [`AGENTS.md`](./AGENTS.md) - Regras de negócios críticas para IA e Motor WABA.
- [`DEPLOY.md`](./DEPLOY.md) - Guia de implantação oficial no Debian 12 com PM2.
- [`RELATORIO_AUDITORIA_DB.md`](./RELATORIO_AUDITORIA_DB.md) - Diagnóstico arquitetural do banco PostgreSQL.
- [`PWA_TO_APK.md`](./PWA_TO_APK.md) - Como converter os Portais em App Android Nativos.

---
*Engenharia BSS/OSS desenvolvida sob os mais altos padrões de resiliência e resguardo de dados.*

## 🔒 Auditoria e Homologação
A infraestrutura, banco de dados (Drizzle) e lógicas de orquestração (Gemini / WABA / ERP) foram rigorosamente auditadas e certificadas para uso em produção corporativa.
Consulte o **[Relatório Final de Auditoria (BSS/OSS)](./AUDITORIA_ARQUITETURA_FINAL.md)** para mais detalhes sobre as travas de idempotência, segurança relacional e Memory Fallback.
