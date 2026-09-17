# NAP - Guia Oficial de Implantação (Deployment)

Este documento detalha as etapas de implantação da plataforma NAP (Núcleo de Atendimento ao Provedor) em um ambiente Debian 12 limpo (VPS/Bare-metal).

## Arquitetura do Sistema
O NAP foi projetado para rodar de forma encapsulada por Provedor de Internet (Multi-Tenant isolado ou Single-Tenant), garantindo máxima privacidade (LGPD).

### Portas Utilizadas
Para que o sistema opere corretamente, os seguintes serviços e portas devem estar liberados no Firewall da VPS:

| Serviço | Porta TCP | Porta UDP | Descrição |
| :--- | :---: | :---: | :--- |
| **HTTP/HTTPS** | 80, 443 | - | Tráfego web via Nginx Proxy Reverso |
| **Node.js (NAP API)**| 3000 | - | Backend da Aplicação (Express + Vite Proxy) |
| **PostgreSQL** | 5432 | - | Banco de Dados Relacional (Core do NAP) |
| **SIP (Asterisk)** | 5060, 5061| 5060 | Comunicação de Ramais PABX |
| **RTP (Voz)** | - | 10000-20000 | Fluxo de mídia de voz (WebRTC e Softphones) |
| **WSS (Asterisk)** | 8089 | - | WebSockets Seguros para o Webphone do Portal PWA |
| **GenieACS CWMP** | 7547, 7567| - | Comunicação TR-069 com CPEs e Roteadores |
| **Zabbix Server** | 10051 | - | Telemetria ativa e passiva do NOC |
| **Radius (PoD/CoA)**| 3799 | 3799 | Desconexão e Kick de sessão PPPoE |

## Pré-requisitos
- Um servidor ou VPS rodando **Debian 12**.
- Pelo menos 4GB de RAM (8GB+ recomendado para cenários completos com Zabbix e Asterisk).
- Acesso *root* ou privilégios de *sudo*.
- Domínio apontado para o IP da VPS (para Let's Encrypt SSL).

## Variáveis de Ambiente Necessárias (`.env`)
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:nap_secure_pwd@localhost:5432/nap_crm
WABA_VERIFY_TOKEN=nap_waba_verify_token_secure
WABA_ACCESS_TOKEN=seu_meta_token
GEMINI_API_KEY=sua_chave_gemini_api
GEMINI_BASE_URL=https://9router.enlace.slz.br # Opcional: Gateway corporativo 9router com failover
GEMINI_GATEWAY_PROVIDER=direct # "direct" (Google oficial gratuito) ou "9router" (Enterprise)
TELEGRAM_BOT_TOKEN=seu_bot_token_do_telegram
TELEGRAM_NOC_GROUP_ID=id_do_grupo_noc
NAUTOBOT_URL=http://nautobot.isp.local/api
NAUTOBOT_TOKEN=seu_token_nautobot
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
   sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'nap_secure_pwd';"
   sudo -u postgres psql -c "CREATE DATABASE nap_crm OWNER postgres;"
   ```

3. **Instalar o Node.js (v22 LTS via NVM ou NodeSource):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Clonar a Aplicação e Instalar:**
   ```bash
   git clone <seu-repo> /opt/nap
   cd /opt/nap
   npm install
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

6. **Configuração Nginx (Proxy Reverso para 3000):**
   Crie `/etc/nginx/sites-available/nap`:
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com.br;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_addrs;
       }
   }
   ```
   Ative com `sudo ln -s /etc/nginx/sites-available/nap /etc/nginx/sites-enabled/` e recarregue `sudo systemctl reload nginx`.

Alternativamente, execute o script de instalação automatizada: `./deploy.sh`


## Backup e Disaster Recovery (RPO/RTO)

Seguindo as diretrizes de integridade de BSS/ERP, o NAP acompanha scripts oficiais para contingência (Fase 6 de Auditoria DB).

Os scripts estão localizados na pasta `/scripts`:

1. **`backup_db.sh`**: Script que executa `pg_dump` compactado. Recomendado adicionar ao CRON do servidor root para rodar de madrugada (ex: `0 3 * * * /opt/nap/scripts/backup_db.sh`). Possui rotatividade automática de 7 dias para poupar disco.
2. **`restore_db.sh`**: Script restrito para cenários de desastre. Limpa as tabelas afetadas e sobe a imagem exata da data do dump com `pg_restore -c -1`.

*Nota: Um backup só existe de fato se o restore foi testado. Utilize uma VM de homologação para validar os dumps trimestralmente.*
