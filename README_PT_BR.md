# NAP - Núcleo de Atendimento ao Provedor (Documentação Principal)

O **NAP (Núcleo de Atendimento ao Provedor)** é uma plataforma Omnichannel Full-Stack desenvolvida para Provedores de Internet (ISPs). O sistema unifica Inteligência Artificial, atendimento ao cliente, gestão de campo e monitoramento de infraestrutura em uma única plataforma isolada (Multi-tenant/Single-tenant).

## 🚀 Arquitetura e Tecnologias
O projeto é construído sobre uma arquitetura moderna e escalável, utilizando tecnologias de ponta para garantir performance e manutenibilidade.

### Tecnologias Principais
*   **Frontend (Cliente PWA & Painel Administrativo):**
    *   **React 18:** Biblioteca base para a construção da interface.
    *   **Vite:** Build tool ultrarrápida.
    *   **Tailwind CSS:** Framework CSS utilitário para um design responsivo e com "Premium SaaS Dark Theme".
    *   **Lucide React:** Biblioteca oficial de ícones SVG do sistema.
    *   **Leaflet & React-Leaflet:** Integração GIS para renderização do mapa georreferenciado (Radar NOC).
    *   **vite-plugin-pwa:** Configuração avançada de Progressive Web App, garantindo que o portal do cliente funcione offline, com service workers e cache nativo.
*   **Backend (Motor de API e Integrações):**
    *   **Node.js & Express:** Servidor da aplicação (montado em `server.ts`).
    *   **Drizzle ORM:** Camada de banco de dados fortemente tipada.
    *   **PostgreSQL:** Banco de Dados Relacional oficial da aplicação (guardando Faturas, Conversas, OS e Usuários).
    *   **Google Gemini AI:** O "Cérebro" do sistema (Copilot, Triagem Automática, NOC RAG Engine).
*   **Integrações de Infraestrutura de ISP:**
    *   **Asterisk 20+ (AMI/ARI):** Telefonia VoIP, Softphone WebRTC e roteamento PABX.
    *   **Zabbix 7.0 LTS:** Telemetria de rede e geração de alarmes.
    *   **GenieACS (TR-069):** Gerenciamento remoto de roteadores (CPE) nas casas dos clientes.
    *   **API Meta Cloud (WABA):** Gateway oficial para envio e recebimento de mensagens no WhatsApp.

## 📁 Estrutura de Diretórios
Abaixo, explicamos a organização dos arquivos para que a manutenção seja facilitada:

*   `/src/` - **Frontend (React)**
    *   `/pages/` - As telas principais (Dashboard, Inbox, CRM, NOC, Ajuda, Portal do Cliente, etc).
    *   `/components/` - Componentes reutilizáveis (Botões, Modais, Cards, Headers).
    *   `/lib/` e `/utils/` - Funções utilitárias.
    *   `/db/` - Esquema do banco de dados relacional usando Drizzle ORM (`schema.ts`).
    *   `App.tsx` - O roteador central definindo quem acessa qual tela.
*   `/server/` - **Backend (Node.js)**
    *   `server.ts` - Ponto de entrada do backend. Ele expõe a API (`/api/*`) e também serve o Frontend via middleware do Vite.
    *   `/ai/` e `/gemini.ts` - Registro de ferramentas para a Inteligência Artificial (Agent Tool Registry).
    *   `/asterisk/` - Adaptações e comandos para PABX.
    *   `/communications/` - Hub de notificações (Integração com Telegram).
    *   `/waba.ts` - O webhook que recebe as conversas do WhatsApp Cloud API.
    *   `/zabbix/`, `/olt/`, `/gis/` - Controladores da rede.

## 🛠 Como Iniciar o Desenvolvimento

A inicialização do projeto em sua máquina local é simples, pois utilizamos o `tsx` para compilar o backend no modo desenvolvimento, enquanto o Vite gerencia o front.

1.  **Copie o arquivo de variáveis de ambiente:**
    ```bash
    cp .env.example .env
    ```
    *Obs: Ajuste `DATABASE_URL`, sua `GEMINI_API_KEY` e as credenciais do Firebase Authentication.*
2.  **Instale as dependências NPM:**
    ```bash
    npm install
    ```
3.  **Inicie o ambiente Dev (Proxy Express + Vite na porta 3000):**
    ```bash
    npm run dev
    ```

## 📦 Como Funciona o Build e Deploy de Produção

O NAP foi desenhado para rodar isolado por provedor, dentro de uma VPS (Debian 12).
No arquivo `package.json`, existe o script oficial de build:
```bash
npm run build
```
**O que este script faz:**
1.  Ele chama o `vite build`, empacotando todo o frontend React estático para a pasta `/dist`.
2.  Imediatamente após, ele roda o `esbuild`, pegando seu backend (`server.ts`) e o compilando em um único arquivo CJS (`dist/server.cjs`).

No momento do deploy (veja o script `deploy.sh`), você apenas roda o `dist/server.cjs` com o PM2 (Gerenciador de Processos do Node), e ele já servirá automaticamente tanto as rotas de API `/api/*` quanto as páginas React em `/`.

## 🔐 Pilares de Segurança
*   **Proteção de Chaves de API:** Chaves como WABA Token, Gemini API, Zabbix Token e as senhas do ERP **jamais** devem ser utilizadas no frontend (`/src/`). O Frontend só se comunica com o backend enviando `Authorization: Bearer <token>`.
*   **Trilha de Auditoria LGPD:** Todo Handoff (passagem de chatbot para humano) no Inbox, Reboot TR-069 e reconhecimento (ACK) de alarmes no Zabbix invoca a função nativa de auditoria, registrando na trilha permanente do CRM.
*   **Modo de Sessão de Fallback:** Se o Firebase estiver inoperante (ou mal configurado localmente), há um modo de Mock/Fallback contido no `AuthContext.tsx` que garante a entrada dos desenvolvedores para manutenção emergencial de layout.

---
*Este documento é gerado e mantido pela Inteligência Artificial do Google AI Studio como fonte de verdade para o motor NAP.*
