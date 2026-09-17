# NAP - Núcleo de Atendimento ao Provedor

Uma plataforma Full-Stack SaaS Omnichannel desenvolvida sob medida para **Provedores de Internet (ISPs)**. Foco absoluto em centralização de suporte N1/N2, multi-ERP com monitor de latência (ping), telefonia Asterisk com IA em tempo real, telemetria de rede TR-069 (GenieACS), geolocalização GIS de equipamentos, autoatendimento via PWA do assinante e operação de campo com rastreamento GPS.

*(Nota: O aplicativo opera com arquitetura full-stack segura. Todas as chaves e requisições para LLMs Google GenAI, ERPs e Asterisk são intermediadas exclusivamente pelo servidor Node.js (`server.ts`). Caso a rede externa ou ERP caia, o sistema aciona automaticamente uma **Mock Session** e banco in-memory para manter 100% da experiência funcional).*

---

## 📄 Documentação Oficial
- 📚 [Manual e Base de Conhecimento Interativa (`/admin/ajuda`)](./src/pages/Helpers.tsx)
- 🏗️ [Arquitetura do Ecossistema](./ARCHITECTURE.md)
- 📖 [PRD - Requisitos e Arquitetura do Produto](./docs/PRD.md)
- 📱 [Guia de Compilação APK (Android)](./PWA_TO_APK.md)
- 🚀 [Manual de Deploy em Produção](./MANUAL_DEPLOY.md)

---

## 📡 Roteamento Principal
- `/` - Landing Page de Aquisição (Planos de internet fibra óptica com seletor de temas)
- `/login` - Autenticação com controle de acesso RBAC e fallback de Mock Session
- `/admin` - Painel Operacional Unificado (Inbox Omnichannel, KPIs, CRM 360 e Kanban)
- `/admin/dashboard` - Painel de NOC & Analytics (Radar GPS, PABX e contenção IA)
- `/admin/mapa-rede` - Mapa de Rede GIS (Monitoramento georreferenciado das ONTs via Leaflet/Cluster)
- `/admin/campo` - PWA Mobile-First do Técnico de Campo (Ordens de Serviço, GPS, Diagnóstico Óptico, Foto e Assinatura)
- `/admin/genieacs` - Telemetria de CPEs e monitoramento de potência óptica RX/TX (-18 a -24 dBm)
- `/admin/usuarios` - Gestão de Equipe e Hierarquia de Acesso (4 níveis RBAC)
- `/admin/configuracoes` - Painel SuperAdmin com Catálogo Multi-ERP, Validador de API e Disaster Recovery
- `/admin/ajuda` - Base de Ajuda e Documentação Técnica interativa com pesquisa rápida
- `/portal` - Área do Assinante PWA (2ª via, PIX, gestão de senha Wi-Fi, Webphone e Webchat IA)

---

## 💡 Princípios de Design & Arquitetura
1. **Sem "AI Slop":** Interface profissional, sem gradientes purpúreos arbitrários, bordas brilhantes excessivas ou textos ilegíveis.
2. **Contraste & Tipografia:** Modo escuro de alto contraste (`#0b0f19`, `#06080e`) com espaçamentos milimétricos no painel de gestão; tema claro, acessível e mobile-first no Portal do Assinante.
3. **Segurança Full-Stack:** Todas as integrações externas (Gemini, ERPs, VoIP, GenieACS) são roteadas obrigatoriamente pelo backend `server.ts`, mantendo as chaves privadas totalmente ocultas do navegador.
4. **Isolamento por Tenant:** Uma VPS Debian 12 dedicada por provedor para máxima segurança e conformidade de dados.

---

## 🧱 Módulos do Sistema

### 1. Hub Multi-ERP com Monitor de Ping & Latência em Tempo Real
- **Conectores Homologados:** Suporte nativo a **IXC Soft (IXC Provedor)**, **Hubsoft Telecom**, **MikWeb**, **SGP**, **MK Solutions**, **ISPFy** e **RadiusNet**.
- **Validador de API:** Bateria de testes em tempo real (Handshake TLS, Autenticação, Leitura de Contratos, Emissão de PIX e Auto-desbloqueio 48h).
- **Indicador Visual de Latência (`ErpPingBadge`):** Monitoramento contínuo de ping (`ms`), cálculo de jitter, barras de intensidade de sinal e categorização semântica (Excelente `<60ms`, Estável `<150ms`, Lento `>150ms`).
- **Alternância Dinâmica:** Troca do ERP ativo com 1 clique no painel administrativo.

### 2. Inbox Omnichannel & Triagem IA (Cérebro Gemini 2.5 Flash)
- **WhatsApp Cloud API (WABA) & Webchat:** Recepção unificada de conversas da Meta e do Portal do Assinante.
- **Triagem Automatizada:** Cruzamento instantâneo da mensagem com dados do ERP e telemetria da ONU para autoatendimento.
- **Análise de Sentimento em Tempo Real:** Medição contínua do humor do cliente (Positivo, Neutro ou Frustrado).
- **Ações Rápidas no Chat:** Emissão de código PIX Copia-e-Cola e Desbloqueio em Confiança (48h) com 1 clique direto na conversa.
- **Handoff Inteligente:** Transferência suave para atendente humano quando identificada complexidade ou solicitação explícita.

### 3. Centro de Controle Operacional (NOC & GIS)
- **Mapa de Rede Georreferenciado:** Plotagem visual interativa de milhares de ONTs simuladas através do Leaflet com Marker Clustering dinâmico. Status codificado por cores (Online, Alerta e LOS).
- **Radar NOC em Tempo Real:** Grid espacial mostrando técnicos em rota, status live da central Asterisk PABX (filas e TME) e indicadores de FCR (First Call Resolution) da IA.

### 4. Portal do Assinante PWA (`/portal`)
- **Autoatendimento Financeiro:** Histórico de faturas, código de barras e QR Code PIX com baixa em tempo real.
- **Autoatendimento Wi-Fi (TR-069):** Alteração de nome de rede (SSID) e senha, medidor de segurança de senha, QR Code para conexão de visitas e reinicialização remota de ONU.
- **Webphone WebRTC:** Ligação gratuita pelo próprio navegador até a central de suporte do provedor.
- **Webchat com Suporte IA:** Resolução autônoma de dúvidas frequentes.

### 5. PWA do Técnico de Campo (`/admin/campo`) & Rastreamento GPS
- **Mobile-First para Rua:** Otimizado para smartphones de técnicos em campo.
- **Telemetria GPS em Tempo Real:** Envio contínuo de coordenadas para o Radar do NOC (`/api/usuarios/localizacao`).
- **Diagnóstico Óptico TR-069:** Leitura de potência óptica RX da ONU in loco com alertas de faixa recomendada (-18 a -24 dBm).
- **Evidências Digitais:** Captura de fotos da instalação/CTO via câmera e assinatura digital do cliente na tela do celular (Canvas tátil).

### 6. Telefonia VoIP Asterisk/FreePBX & Webphone com IA de Voz
- **Webphone WebRTC no Navegador:** Chamadas SIP diretas sem softphone externo.
- **CTI Reverso:** Abertura automática da Ficha 360 do cliente assim que o ramal toca via eventos AMI do Asterisk.
- **IA de Escuta Ativa:** Transcrição Speech-to-Text ao vivo, análise de sentimento da voz e sugestão de scripts dinâmicos na tela do operador.

### 7. GenieACS & Telemetria Óptica de CPEs (TR-069)
- **Comunicação CWMP / NBI (Porta 7557):** Diagnóstico de potência óptica RX/TX dBm, temperatura do laser, tempo de atividade (uptime) e reinicialização remota (`Reboot`).

### 8. Hierarquia de Acesso (RBAC) em 4 Níveis
1. **Admin Geral (Super Admin):** Acesso total a configurações, Disaster Recovery, ERPs e gestão de equipe.
2. **Operador de Atendimento:** Acesso ao Inbox Omnichannel, CRM 360, Kanban e Webphone.
3. **Técnico NOC (N1/N2):** Acesso a telemetria GenieACS, dashboard de rede e diagnóstico técnico.
4. **Técnico de Campo:** Acesso exclusivo ao PWA mobile de ordens de serviço (`/admin/campo`).

### 9. Disaster Recovery & Manutenção
- **Exportação de Snapshot (`GET /api/backup`):** Download de arquivo `.json` unificado com todas as tabelas e dados operacionais.
- **Restauração de Base (`POST /api/restore`):** Upload e validação de integridade para restauração imediata.

---

## 🚀 Últimas Atualizações e Refinamentos de Arquitetura (Setembro 2026)

Durante a fase de validação e *Production-Readiness*, os seguintes módulos críticos receberam atualizações de arquitetura:

1. **WABA + Motor de IA Gemini (Triagem Ativa):** O Webhook do WhatsApp foi totalmente integrado ao `Agent Tool Registry`. Agora a IA entende a intenção do cliente, consulta diretamente o NOC (rompimentos), TR-069 (atenuação óptica) ou SGP (emissão de PIX), devolvendo a resolução no chat do cliente sem intervenção humana, e registrando um Log interno no Inbox.
2. **Auditoria de WAF (Web Application Firewall):** As defesas anti-DDoS e brute-force da aplicação agora despejam os logs criminais de IPs banidos diretamente no banco de auditoria (`/admin/auditoria`), cumprindo requisitos de transparência e LGPD.
3. **PWA do Técnico (GPS Nativo):** Validação da transmissão de background (`navigator.geolocation`) que alimenta o Radar NOC com quilometragem em tempo real dos carros da equipe.
4. **Mapa NOC Dark (OpenStreetMap Livre):** Substituição de mapas comerciais fechados pelo OpenStreetMap raiz com implementação de filtros CSS GPU-accelerated (`.map-tiles-dark`). Isso elimina os problemas de *API Key* vencida e quebra de cota em telas NOC ligadas 24/7.
5. **Correção Leaflet Fullscreen:** Implementação do trigger `invalidateSize()` no acionamento da Tela Cheia do mapa, consertando o bug de renderização de tiles "meia-página" em monitores ultrawide.
