# PRD - Product Requirements Document
## NAP - Núcleo de Atendimento ao Provedor

### 1. Visão Geral
O **NAP** é uma plataforma SaaS Omnichannel B2B focada em resolver os gargalos de atendimento, suporte técnico e cobrança de Provedores de Internet (ISPs). A arquitetura prioriza o isolamento de dados e a performance, operando em um modelo onde cada provedor (tenant) recebe sua própria infraestrutura isolada (VM/VPS).

### 2. Objetivos de Negócio
- Reduzir o tempo médio de atendimento (TMA) dos ISPs automatizando suporte N1 através de Triagem IA (Gemini).
- Diminuir a inadimplência centralizando rotinas de cobrança (WhatsApp, SMS, E-mail) cruzadas com o ERP (SGP).
- Eliminar o uso de dezenas de ferramentas paralelas (Zendesk, Zenvia, ERP isolado) através de um **Inbox Unificado**.
- Dar mobilidade total aos técnicos de campo através de um PWA Mobile-First offline-ready e geolocalizado.

### 3. Perfis e Hierarquia de Acesso (RBAC)
- **Administrador / SuperAdmin:** Controle total do sistema, painéis gerenciais, faturamento, integrações de API, usuários e acesso root às configurações de automação.
- **Operador de Atendimento:** Acesso ao Inbox Unificado, CRMs de Cobrança e Vendas, Kanban de chamados e consulta de clientes/faturas no SGP. Não acessa configurações.
- **Técnico NOC (Nível 2):** Monitoramento de redes avançado, controle do GenieACS (TR-069), reinicializações remotas de ONU (OLT/Radius) e gestão da equipe de campo.
- **Técnico de Campo (PWA):** Acesso estritamente via celular. Visualiza a rota do dia, preenche Ordens de Serviço (OS), faz upload de fotos (instalação) e envia localização GPS em tempo real.
- **Cliente Final (PWA / Autoatendimento):** Acesso autenticado via CPF, onde o assinante consegue extrair 2ª via de boleto/PIX, solicitar desbloqueio em confiança e conversar via Webchat/Webphone.

### 4. Arquitetura e Stack
O sistema é projetado para máxima velocidade (Vite + React) e retaguarda em uma stack unificada JavaScript/TypeScript.
- **Frontend:** React 18, Tailwind CSS, Lucide React (Ícones).
- **Backend:** Node.js, Express (Arquitetura Full-stack segura via `/api/*`).
- **Banco de Dados:** PostgreSQL (gerenciado através de Drizzle ORM).
- **IA Generativa:** Google Gemini 2.5 Flash / Pro (via `@google/genai`).

### 5. Integrações Core (Módulos Essenciais)
1. **SGP (Sistema de Gestão de Provedores):** Sincronização via Webhooks. Base de clientes, planos, status de conexão, bloqueios e emissão de cobranças (PIX/Boleto).
2. **WhatsApp Cloud API (WABA):** Envio e recebimento nativo de mensagens sem uso de celular físico (QR Code). Totalmente espelhado no banco.
3. **GenieACS / TR-069:** Telemetria da ONU do cliente (Verificação de perda de sinal óptico - LOS Vermelho, Uptime do Roteador, Nível de RX/TX).
4. **FreePBX 17 / Asterisk:** VoIP. Integração via AMI/ARI para disparar ligações ou receber chamadas direto no Webphone do operador.
5. **PWA Customer Portal & Webchat IA:** Módulo mobile-first para o cliente final. Contém rota nativa segura para um Chat integrado à IA (`/api/webchat/send`), que divide as mesmas tabelas de Omnichannel do WhatsApp, permitindo transição contínua entre autoatendimento e atendimento humano.
6. **PWA Técnico de Campo & Comprovação Digital:** Ordem de Serviço mobile-first com telemetria GPS, diagnóstico de sinal óptico in loco, captura de fotos de instalação (câmera) e assinatura digital do assinante na tela.
7. **Disaster Recovery (Backup & Restore):** Exportação e importação completa em JSON (`/api/backup` e `/api/restore`) do banco de dados relacional com fallback resiliente para continuidade operacional.

### 6. Fluxos Automatizados (Copiloto IA)
O NAP processa eventos em tempo real. 
- Quando uma mensagem chega no WhatsApp (`/api/webhooks/waba/incoming`), o sistema identifica o telefone.
- O sistema verifica o banco (Drizzle/PostgreSQL) ou o SGP para encontrar o CPF do cliente.
- A IA (Gemini) analisa se o cliente está com a fatura atrasada ou se a ONU (GenieACS) caiu.
- A IA gera uma resposta baseada no contexto real e atua como "Nível 1" (Triagem) antes de passar para um Operador Humano.

### 7. Requisitos Não-Funcionais
- **Segurança Full-Stack:** Nenhuma API Key (SGP, Gemini, Asterisk) deve vazar para o Client-Side. Todas as chamadas DEVEM usar rotas `/api/*` criadas no Express (`server.ts`).
- **Resiliência de Desenvolvimento (Mock Fallback):** O sistema deve continuar renderizando mock-data na falta de conexão com APIs externas ou banco de dados durante o ambiente de dev/design.
- **PWA e Offline:** Os portais do Cliente e do Técnico devem instalar como aplicativos e suportar Service Workers e Web Push Notifications.
