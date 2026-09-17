# 📘 PRD - NAP (Núcleo de Atendimento ao Provedor)

**Versão:** 2.6 (Atualizada)  
**Data:** 11/09/2026  
**Status:** Em Produção / Homologado  

---

## 1. Visão Geral do Produto

O **NAP (Núcleo de Atendimento ao Provedor)** é uma plataforma SaaS Omnichannel completa para **Provedores de Internet (ISPs)**. Ela atua como a camada central de inteligência que interliga telefonia Asterisk, atendimento WhatsApp (WABA) e Webchat com IA Gemini 2.5 Flash, múltiplos ERPs de telecom (IXC Soft, Hubsoft, MikWeb, SGP, etc.), telemetria de rede TR-069 (GenieACS), autoatendimento em PWA mobile para o assinante e gestão de campo com geolocalização.

---

## 2. Proposta de Valor & Indicadores-Chave (KPIs)
- **Redução de até 70%** dos chamados repetitivos de suporte N1 e financeiro através de autoatendimento (2ª via PIX, auto-desbloqueio 48h e troca de senha Wi-Fi).
- **Unificação Omnichannel:** Conversas do WhatsApp Oficial e Webchat do Portal na mesma fila com handoff para atendentes humanos.
- **Isolamento e Soberania:** Uma VPS dedicada por provedor, garantindo sigilo das credenciais e dados cadastrais.
- **Resiliência Máxima:** Fallback automático para modo Mock em memória caso conexões externas oscilem.

---

## 3. Arquitetura do Sistema
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, PWA (`vite-plugin-pwa`), Recharts e Canvas Signature.
- **Backend:** Node.js, Express (`server.ts`), Drizzle ORM, WebSockets e ESBuild.
- **Inteligência Artificial:** Google GenAI SDK (`@google/genai`) com modelo **Gemini 2.5 Flash** para triagem, copiloto e análise de voz.
- **Rede & Telecom:** GenieACS (TR-069 NBI API na porta 7557), Asterisk AMI / WebSockets (WSS) e Radius PoD (porta 3799).

---

## 4. Módulos do Sistema Entregues

### 1. Hub Multi-ERP & Monitor de Latência (Ping)
- Conectores para **IXC Soft**, **Hubsoft Telecom**, **MikWeb**, **SGP**, **MK Solutions**, **ISPFy** e **RadiusNet**.
- Validador em tempo real (Handshake TLS, Autenticação, Leitura de Contratos, PIX e Desbloqueio 48h).
- Monitor de latência contínuo (`ErpPingBadge`) com tempo de resposta em milissegundos, cálculo de jitter e barras de intensidade de sinal.

### 2. Inbox Omnichannel & Triagem IA
- Recepção unificada de conversas do WhatsApp Cloud API (WABA) e Webchat do Portal.
- Fila de triagem automatizada com análise de sentimento (Positivo, Neutro ou Frustrado).
- Botões de ação rápida no chat: Emissão de PIX Copia-e-Cola e Desbloqueio em Confiança (48h).
- Regra de transbordo (handoff) para operadores humanos no Kanban.

### 3. Portal do Assinante PWA (`/portal`)
- Dashboard mobile-first para o cliente final.
- 2ª via de faturas com pagamento via PIX dinâmico.
- Gestão de rede Wi-Fi via TR-069 (alteração de SSID/senha, medidor de segurança e QR Code).
- Reinicialização remota de ONU (`Reboot`) e Webphone WebRTC nativo.

### 4. PWA do Técnico de Campo (`/admin/campo`) & Rastreamento GPS
- Módulo responsivo para execução de Ordens de Serviço na rua.
- Telemetria de localização em tempo real transmitida para o Radar do NOC (`/api/usuarios/localizacao`).
- Diagnóstico óptico in loco da potência RX da ONU (-18 a -24 dBm).
- Coleta de evidências: foto da instalação da CTO/ONU e assinatura digital na tela com canvas tátil.

### 5. Telefonia VoIP Asterisk & Webphone com IA
- Webphone WebRTC no navegador para operadores e clientes.
- Pop-up de CTI Reverso com a Ficha 360 do assinante antes de atender a chamada.
- Transcrição Speech-to-Text ao vivo e recomendação dinâmica de scripts pelo Gemini.

### 6. GenieACS & Telemetria Óptica de CPEs (TR-069)
- Diagnóstico em tempo real de potência óptica RX/TX, temperatura do laser e modulação de fibra.

### 7. Hierarquia de Acesso (RBAC) em 4 Níveis
- **Admin Geral (Super Admin):** Acesso completo e gestão de conexões.
- **Operador de Atendimento:** Inbox, CRM 360, Kanban e Webphone.
- **Técnico NOC (N1/N2):** GenieACS, telemetria e diagnóstico avançado.
- **Técnico de Campo:** Acesso exclusivo ao PWA mobile de ordens de serviço (`/admin/campo`).

### 8. Disaster Recovery & Manutenção
- Rotas para exportação e importação de snapshots JSON (`/api/backup` e `/api/restore`).
