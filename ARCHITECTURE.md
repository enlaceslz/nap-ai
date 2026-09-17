# Arquitetura do Ecossistema NAP (Núcleo de Atendimento ao Provedor)

O NAP é um orquestrador central e painel de controle (CRM/Kanban/Omnichannel) desenvolvido em React 18 + Node.js (Express), construído especificamente para unificar as principais ferramentas operacionais e comerciais de um **Provedor de Internet (ISP)**.

---

## 🏛️ Componentes do Ecossistema

O NAP atua como o cérebro que interliga os seguintes módulos e serviços:

```
                  +---------------------------------------------------+
                  |                 NAP Core Platform                 |
                  |     (React 18 + Node.js / Express + Drizzle)      |
                  +---------+--------------------+--------------------+
                            |                    |
        +-------------------+                    +--------------------+
        |                                                             |
        v                                                             v
+------------------+   +-------------------+   +------------------+   +------------------+
|  Asterisk/VoIP   |   |   Gemini 2.5 IA   |   |  Multi-ERP Hub   |   |  GenieACS TR-069 |
| (SIP/WSS/WebRTC) |   | (Triagem & Voz)   |   | (IXC, HUB, MIK)  |   | (ONU / Roteador) |
+------------------+   +-------------------+   +------------------+   +------------------+
        |                                              |                       |
        v                                              v                       v
Ramais / Operadores                             Faturas / PIX /             Sinal RX/TX
& Assinantes Webphone                           Desbloqueio 48h             Wi-Fi & Reboot
```

---

### 1. FreePBX & Asterisk (Telefonia Core & WebRTC)
- **Papel no NAP:** Motor principal de telefonia IP (VoIP), filas de atendimento, gravação de chamadas e rotas de entrada/saída.
- **Integração:** Conexão via WebSockets seguros (WSS) para Webphone WebRTC no navegador e eventos AMI (Asterisk Manager Interface), disparando o **CTI Reverso** (pop-up instantâneo da Ficha 360 do cliente antes de o operador atender o ramal).

### 2. Cérebro de Inteligência Artificial (Google Gemini 2.5 Flash)
- **Papel no NAP:** URA Cognitiva, Triagem Autônoma de Mensagens e Copiloto do Atendente.
- **Integração:** Invocado exclusivamente no backend (`server.ts`) via SDK `@google/genai`. Analisa sentimento (Positivo, Neutro, Frustrado), transcreve áudio em tempo real (Speech-to-Text) durante chamadas telefônicas e gera sugestões dinâmicas de resposta e resumos operacionais.

### 3. Hub Multi-ERP (IXC Soft, Hubsoft, MikWeb, SGP, MK Solutions, ISPFy, RadiusNet)
- **Papel no NAP:** Fonte da verdade (Source of Truth) dos dados cadastrais, contratos e status financeiro dos clientes.
- **Integração:** Camada de adaptadores REST/HTTPS com suporte a alternância instantânea. Permite emissão de faturas e chave PIX Copia-e-Cola, Desbloqueio em Confiança (48h) e monitoramento de latência e ping em tempo real (`ErpPingBadge`).

### 4. GenieACS (TR-069 / CWMP - Telemetria de Redes & Wi-Fi)
- **Papel no NAP:** Gerenciamento remoto de ONUs e roteadores Wi-Fi dos assinantes.
- **Integração:** Comunica-se na porta `7557` (NBI API). Possibilita a leitura de potência óptica RX/TX (-18 a -24 dBm), alteração remota de SSID e senha do Wi-Fi pelo próprio cliente no Portal PWA e comandos de reinicialização (`Reboot`).

### 5. PWA do Técnico de Campo (`/admin/campo`) & Radar NOC
- **Papel no NAP:** Interface mobile-first para técnicos de rua executarem ordens de serviço (OS).
- **Integração:** Transmite telemetria GPS contínua para o painel administrativo, permite consulta do sinal óptico da ONU in loco, registro de foto da instalação e coleta de assinatura digital do cliente na tela do celular (Canvas tátil).

---

## 🔄 Fluxos de Atendimento

### Fluxo 1: Chamada Telefônica Receptiva com IA e CTI
1. Assinante liga para o provedor.
2. O **Asterisk** notifica o NAP via AMI com o número do telefone (CallerID).
3. O NAP consulta o **ERP Ativo** e localiza o cadastro do assinante.
4. Abre instantaneamente na tela do operador a **Ficha CRM 360** (contrato, sinal óptico da ONU e faturas abertas).
5. O operador atende via **Webphone WebRTC** no navegador.
6. A chamada é processada pelo Gemini para transcrição Speech-to-Text ao vivo e sugestão de scripts na tela.

### Fluxo 2: Mensagem no WhatsApp com Triagem IA e PIX
1. O cliente envia: *"Gostaria da minha fatura para pagar"*.
2. O webhook do **WhatsApp Cloud API (WABA)** despacha para `/api/webhooks/waba/incoming`.
3. A IA na fila `triagem_ia` identifica a intenção financeira.
4. O NAP consulta a API do ERP, gera o código PIX Copia-e-Cola dinâmico com vencimento e valor.
5. A IA envia o PIX com mensagem humanizada para o cliente no WhatsApp.
6. O pagamento é compensado e o cliente recebe a confirmação imediata.
