# Manual de Configuração de Ambiente e Deploy (Homologação e Produção)

## NAP - Núcleo de Atendimento ao Provedor

Este manual descreve a topologia recomendada e o passo a passo de configuração para implantar o NAP (aplicação Single-Tenant, rodando isolada por provedor/ISP) em ambientes de **Homologação** e **Produção**, garantindo a segurança de dados (LGPD), suporte WebRTC e isolamento da rede de telefonia VoIP.

---

### 1. Requisitos de Infraestrutura (Self-Hosted)

Recomendamos a segregação dos serviços para maior escalabilidade e estabilidade do fluxo de áudio, dividindo a infraestrutura em pelo menos duas VMs (ou instâncias Bare Metal).

*   **VM 1: Aplicação NAP (Node.js + Nginx)**
    *   **SO:** Debian 12 (Bookworm)
    *   **Hardware:** 4 vCPUs, 8GB RAM, 50GB SSD
    *   **Node.js:** Versão 20.x ou 22.x
*   **VM 2: Telefonia (Asterisk 20) & Banco de Dados**
    *   **SO:** Debian 12 (Bookworm)
    *   **Hardware:** 4 vCPUs, 8GB RAM, 100GB SSD
    *   **DB:** PostgreSQL 15+
    *   **VoIP:** Asterisk 20 (compilado via código-fonte com suporte a `res_srtp` e `pjproject` habilitados).

> *Dica de Tuning PostgreSQL:* Caso a operação exceda 100 atendentes concorrentes no Inbox, recomenda-se o uso do `PgBouncer` como pool de conexões à frente do Postgres, e otimização do `postgresql.conf` ajustando `shared_buffers` para 25% da RAM total da máquina.

---

### 2. Setup do Banco de Dados (PostgreSQL)

Na máquina dedicada ao banco de dados:

```bash
# 1. Instalar o PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# 2. Acessar o console do Postgres
sudo -u postgres psql
```

Crie o banco e o usuário restrito:

```sql
CREATE DATABASE nap_crm;
CREATE USER nap_user WITH ENCRYPTED PASSWORD 'senha_forte_do_provedor';
GRANT ALL PRIVILEGES ON DATABASE nap_crm TO nap_user;
ALTER DATABASE nap_crm OWNER TO nap_user;
\q
```

*Lembre-se de alterar o arquivo `pg_hba.conf` caso a aplicação rode em uma VM separada, liberando o IP da VM1 para conectar no Postgres.*

---

### 3. Integração Asterisk 20 (Telefonia & IA de Voz)

O NAP exige o **Asterisk 20** para suportar de forma nativa o tráfego WebRTC no Webphone do operador e possibilitar a inteligência artificial (Gemini) na ura de atendimento.

#### 3.1. Configuração do WebRTC (WSS) no `http.conf`
O Webphone embutido no NAP exige que o Asterisk forneça sockets seguros (WSS).
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/letsencrypt/live/pabx.meuprovedor.com.br/fullchain.pem
tlsprivatekey=/etc/letsencrypt/live/pabx.meuprovedor.com.br/privkey.pem
```

#### 3.2. Configuração do PJSIP (Endpoints)
Os ramais do sistema NAP usam transporte WSS. No `pjsip.conf`:
```ini
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0

[1000] ; Exemplo Ramal PWA
type=endpoint
transport=transport-wss
aors=1000
auth=auth1000
webrtc=yes
dtls_auto_generate_cert=yes
```

#### 3.3. Configuração AMI & ARI
O `server.ts` monitora chamadas (CTI Reverso) e atua como URA Inteligente:
*   **AMI (`manager.conf`):** Crie um usuário de leitura e escrita (`read = system,call,log,verbose,command,agent,user` / `write = system,call,log,verbose,command,agent,user`).
*   **ARI (`ari.conf`):** Ative a API RESTful e crie um usuário para o NAP injetar scripts de áudio da LLM na ligação (`allowed_origins = *`).

---

### 4. Configuração das Variáveis de Ambiente (Homologação)

No diretório raiz do projeto na VM1, crie seu `.env`:

```env
# Banco de Dados
DATABASE_URL="postgresql://nap_user:senha_forte_do_provedor@<IP_VM2>:5432/nap_crm"

# SGP (ERP Principal)
SGP_URL="https://api.sgp.net.br"
SGP_APP="SUA_CHAVE_APP_SGP"
SGP_TOKEN="SEU_TOKEN_SGP"

# GenieACS NBI (Telemetria TR-069)
GENIEACS_URL="http://10.0.0.1:7557"
GENIEACS_USER="api_user"
GENIEACS_PASSWORD="api_password"

# IA Gemini
GEMINI_API_KEY="AIzaSy_Sua_Chave_Gemini_Aqui"

# Zabbix Server 7.0 LTS (NOC & Triggers JSON-RPC)
ZABBIX_URL="http://10.0.0.1:8080/zabbix/api_jsonrpc.php"
ZABBIX_TOKEN="seu_zabbix_api_token_aqui"

# Asterisk (AMI/ARI)
ASTERISK_HOST="<IP_VM2>"
ASTERISK_AMI_USER="nap_ami"
ASTERISK_AMI_SECRET="senha_ami"

# Ambiente
NODE_ENV="production"
PORT=3000
```

---

### 5. Passos para a Build Final de Homologação

Antes de virar a chave para produção efetiva, recomenda-se construir a versão de homologação para certificar que o *frontend* e *backend* conversam corretamente usando os recursos de hardware definitivos.

#### Passo 1: Instalação Limpa
```bash
cd /var/www/nap
rm -rf node_modules package-lock.json dist/
npm install
```

#### Passo 2: Sincronização do Banco de Dados
Empurre os schemas do ORM para o banco PostgreSQL recém-criado:
```bash
npm run db:push
```

#### Passo 3: Processo de Build (Vite + esbuild)
Esta etapa minifica o React PWA (cliente) e agrupa o Express Server (`server.ts`) em um único binário CommonJS.
```bash
npm run build
```
*Verifique se a pasta `dist/` foi gerada e se o arquivo `dist/server.cjs` existe.*

#### Passo 4: Teste de Execução (Homologação)
Inicialize o servidor manualmente para ler os logs em tempo real e confirmar a conexão com Asterisk, GenieACS e Banco de Dados:
```bash
NODE_ENV=production node dist/server.cjs
```
Acesse a plataforma via IP ou DNS provisório. Valide se a API Validation (Handshake) aponta verde para todos os subsistemas.

#### Passo 5: Configuração de Daemon (PM2) e Nginx Reverso
Após a homologação ser aprovada, coloque o sistema sob custódia do PM2 para inicialização automática com o servidor:
```bash
sudo npm install -g pm2
pm2 start dist/server.cjs --name "nap-backend" --env production
pm2 save
pm2 startup
```

Por fim, configure o proxy reverso no **Nginx** (com suporte a *WebSocket Upgrade* para não quebrar o Webphone) e aplique o certificado SSL utilizando o `certbot`.
