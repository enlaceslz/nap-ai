# NAP - Guia Oficial de Implantação (Deployment)

Este documento detalha as etapas de implantação da plataforma NAP (Núcleo de Atendimento ao Provedor) em um ambiente Debian 12 limpo (VPS/Bare-metal).

## Arquitetura do Sistema
O NAP foi projetado para rodar de forma encapsulada por Provedor de Internet (Multi-Tenant isolado ou Single-Tenant), garantindo máxima privacidade (LGPD).

### Portas Utilizadas
Para que o sistema opere corretamente, os seguintes serviços e portas devem estar liberados no Firewall da VPS:

| Serviço | Porta TCP | Porta UDP | Descrição |
| :--- | :---: | :---: | :--- |
| **HTTP/HTTPS** | 80, 443 | - | Tráfego web via Nginx Proxy Reverso (com SSL Let's Encrypt) |
| **Node.js (NAP API)**| 3000 | - | Backend da Aplicação (Express + Vite SPA Fallback) |
| **PostgreSQL** | 5432 | - | Banco de Dados Relacional (Core do NAP com Drizzle ORM) |
| **SIP (Asterisk)** | 5060, 5061| 5060 | Sinalização SIP de Ramais PABX e Operadores |
| **RTP (Voz)** | - | 10000-20000 | Fluxo de mídia de áudio (WebRTC e Softphones) |
| **WSS (Asterisk)** | 8089 | - | WebSockets Seguros para o Webphone do Portal PWA |
| **GenieACS CWMP** | 7547, 7567| - | Comunicação TR-069 com CPEs e Roteadores Wi-Fi |
| **GenieACS UI** | 3005 | - | Painel Administrativo do GenieACS TR-069 |
| **Zabbix Agent** | 10050 | - | Agente local de métricas do host e traps |
| **Zabbix Server** | 10051 | - | Telemetria ativa e passiva do NOC e OLTs |
| **Radius (PoD/CoA)**| 3799 | 3799 | Desconexão e Kick de sessão PPPoE no BNG/MikroTik |
| **C6 Bank Webhook** | 443 | - | Recepção de notificações Pix v2 via HTTPS mTLS |

## Pré-requisitos
- Um servidor ou VPS rodando **Debian 12**.
- Pelo menos 4GB de RAM (8GB+ recomendado para cenários completos com Zabbix e Asterisk).
- Acesso *root* ou privilégios de *sudo*.
- Domínio apontado para o IP da VPS (para Let's Encrypt SSL).
- Chaves e certificados mTLS emitidos no C6 Empresas (para o módulo Enlace-Pay).

## Variáveis de Ambiente Necessárias (`.env`)
```env
NODE_ENV=production
PORT=3000

# Banco de Dados
DATABASE_URL=postgresql://postgres:CHANGE_ME_IN_PRODUCTION@127.0.0.1:5432/nap_crm

# Integração Bancária C6 Bank (Pix mTLS & Enlace-Pay)
C6_BANK_ENABLED=true
C6_CLIENT_ID=CHANGE_ME_IN_PRODUCTION
C6_CLIENT_SECRET=CHANGE_ME_IN_PRODUCTION
C6_PIX_KEY=12.345.678/0001-90
C6_MTLS_CERT_PATH=/opt/nap/certs/c6_mtls_prod.crt
C6_ENVIRONMENT=production # "production" ou "sandbox"

# ERP BSS Primário (SGP, IXC Soft ou HubSoft)
ERP_PROVIDER=sgp
SGP_API_URL=https://sgp.provedor.com.br/api/v1
SGP_API_TOKEN=CHANGE_ME_IN_PRODUCTION
SGP_APP_ID=NAP_PROVEDOR_APP

# WhatsApp Cloud API (WABA)
WABA_VERIFY_TOKEN=CHANGE_ME_IN_PRODUCTION
WABA_ACCESS_TOKEN=CHANGE_ME_IN_PRODUCTION
WABA_PHONE_NUMBER_ID=CHANGE_ME_IN_PRODUCTION

# Inteligência Artificial (Gemini 2.5/Flash)
GEMINI_API_KEY=sua_chave_gemini_api
GEMINI_BASE_URL=https://9router.enlace.slz.br # Opcional: Gateway corporativo 9router com failover
GEMINI_GATEWAY_PROVIDER=direct # "direct" (Google oficial gratuito) ou "9router" (Enterprise)

# NOC, Telegram & Event Engine
# Contrato Oficial ZABBIX_URL: Aceita a URL base (http://<host>:<porta>/zabbix) ou a URL completa terminada em /api_jsonrpc.php.
# O motor normalizeZabbixApiUrl garante terminação idempotente em /api_jsonrpc.php sem duplicações.
TELEGRAM_BOT_TOKEN=seu_bot_token_do_telegram
TELEGRAM_NOC_GROUP_ID=id_do_grupo_noc
ZABBIX_URL=http://127.0.0.1:8080/zabbix
ZABBIX_TOKEN=seu_token_api_zabbix

# IPAM & Nautobot
NAUTOBOT_URL=http://nautobot.isp.local/api
NAUTOBOT_TOKEN=seu_token_nautobot

# Firebase Client (Auth & System Config)
VITE_FIREBASE_API_KEY=sua_chave_firebase
```

## Passo a Passo Manual

1. **Atualizar Repositórios e Instalar Dependências Base:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git build-essential nginx ufw postgresql postgresql-contrib
   ```

2. **Configurar o PostgreSQL:**
   ```bash
   sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';"
   sudo -u postgres psql -c "CREATE DATABASE nap_crm OWNER postgres;"
   ```

3. **Instalar o Node.js (v22 LTS via NVM ou NodeSource):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Clonar a Aplicação, Configurar Certificados mTLS e Instalar:**
   ```bash
   git clone <seu-repo> /opt/nap
   cd /opt/nap
   
   # Criar diretório seguro para certificados mTLS do C6 Bank
   mkdir -p /opt/nap/certs
   chmod 700 /opt/nap/certs
   # Copie seu certificado c6_mtls_prod.crt para /opt/nap/certs/ com permissão 600
   
   npm install

   # Renderizar configurações seguras do Asterisk (validação estrita de senhas >= 16 chars)
   bash asterisk-config/render-configs.sh /etc/asterisk

   # Executar migrações versionadas do banco de dados (Drizzle Migrations)
   npm run db:migrate

   npm run build
   ```
   *(O comando build via esbuild empacotará o frontend e gerará o `dist/server.cjs`)*

5. **Gerenciador de Processos (PM2):**
   ```bash
   sudo npm install -g pm2
   pm2 start dist/server.cjs --name nap-backend
   pm2 save
   pm2 startup
   ```

6. **Configuração Nginx (Proxy Reverso para 3000 com Suporte a WebSockets/WSS):**
   Crie `/etc/nginx/sites-available/nap`:
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com.br;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 86400s;
           proxy_send_timeout 86400s;
       }
   }
   ```
   Ative com:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/nap /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```

7. **Instalação de Certificado SSL Gratuito (Let's Encrypt / Certbot):**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com.br
   ```

Alternativamente, execute o script de instalação automatizada: `./deploy.sh`


## Backup e Disaster Recovery (RPO/RTO)

Seguindo as diretrizes de integridade de BSS/ERP, o NAP acompanha scripts oficiais para contingência (Fase 6 de Auditoria DB).

Os scripts estão localizados na pasta `/scripts`:

1. **`backup_db.sh`**: Script que executa `pg_dump` compactado. Recomendado adicionar ao CRON do servidor root para rodar de madrugada (ex: `0 3 * * * /opt/nap/scripts/backup_db.sh`). Possui rotatividade automática de 7 dias para poupar disco.
2. **`restore_db.sh`**: Script restrito para cenários de desastre. Limpa as tabelas afetadas e sobe a imagem exata da data do dump com `pg_restore -c -1`.

*Nota: Um backup só existe de fato se o restore foi testado. Utilize uma VM de homologação para validar os dumps trimestralmente.*
