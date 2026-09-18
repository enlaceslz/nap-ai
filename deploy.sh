#!/bin/bash
# Script de Deploy Oficial NAP (Núcleo de Atendimento ao Provedor) - Debian 12
# ATENÇÃO: Executar como root ou com sudo

set -e

echo "========================================================="
echo "   Iniciando Deploy do NAP - Omnichannel ISP (Debian 12)  "
echo "========================================================="

# 1. Update & Dependencies
echo "[1/7] Atualizando pacotes do sistema e instalando dependências base..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git build-essential nginx ufw postgresql postgresql-contrib

# 2. PostgreSQL Setup
echo "[2/7] Configurando PostgreSQL Local (nap_crm)..."
# Ler senha do .env ou gerar senha segura aleatória
if [ -f "$DIR/.env" ]; then
    PG_PASS=$(grep '^POSTGRES_PASSWORD=' "$DIR/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

if [ -z "$PG_PASS" ] || [ "$PG_PASS" = "nap_secure_pwd" ] || [ "$PG_PASS" = "CHANGE_ME_IN_PRODUCTION" ]; then
    PG_PASS=$(openssl rand -hex 24)
    echo "Gerada nova senha aleatória segura para PostgreSQL."
fi

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${PG_PASS}';" || true
sudo -u postgres psql -c "CREATE DATABASE nap_crm OWNER postgres;" || echo "Banco já existe, prosseguindo..."

# 3. Node.js Installation
echo "[3/7] Instalando Node.js v22 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# 4. Project Setup
echo "[4/7] Configurando Diretório da Aplicação e Certificados..."
DIR=$(pwd)
echo "Diretório de trabalho: $DIR"

# Criação de diretório para certificados mTLS do C6 Bank e chaves privadas
mkdir -p "$DIR/certs"
chmod 700 "$DIR/certs"

if [ ! -f "$DIR/.env" ] && [ -f "$DIR/.env.example" ]; then
    echo "Criando .env a partir de .env.example..."
    cp "$DIR/.env.example" "$DIR/.env"
    sed -i "s/POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION/POSTGRES_PASSWORD=${PG_PASS}/g" "$DIR/.env"
    sed -i "s|DATABASE_URL=postgresql://postgres:CHANGE_ME_IN_PRODUCTION@127.0.0.1:5432/nap_crm|DATABASE_URL=postgresql://postgres:${PG_PASS}@127.0.0.1:5432/nap_crm|g" "$DIR/.env"
fi

if [ -f "$DIR/.env" ]; then
    chmod 600 "$DIR/.env"
    echo "Permissões de segurança 600 aplicadas a $DIR/.env"
fi

echo "[5/7] Instalando Pacotes NPM e realizando Build de Produção..."
npm install
npm run build

# 5. PM2 Setup
echo "[6/7] Configurando PM2 Daemon..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2 stop nap-backend || true
pm2 start dist/server.cjs --name nap-backend
pm2 save
pm2 startup | tail -n 1 | bash - || true

# 6. Nginx Reverse Proxy
echo "[7/7] Configurando Nginx Reverse Proxy (Porta 3000)..."
cat > /etc/nginx/sites-available/nap << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

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
NGINX_EOF

ln -sf /etc/nginx/sites-available/nap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Firewall Seguro para ISP (Telefonia, TR-069, e Web Reverso)
# Serviços internos (PostgreSQL 5432, Node.js 3000, Zabbix API, GenieACS NBI 7557, ARI 8088) escutam exclusivamente em 127.0.0.1
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Administrativo' || true
ufw allow 80/tcp comment 'Nginx HTTP'
ufw allow 443/tcp comment 'Nginx HTTPS mTLS'
ufw allow 5060/udp comment 'Asterisk SIP UDP'
ufw allow 8089/tcp comment 'Asterisk WebRTC WSS'
ufw allow 10000:20000/udp comment 'Asterisk RTP Audio'
ufw allow 7547/tcp comment 'GenieACS CWMP (TR-069)'

# Remove regras antigas inseguras caso existam
ufw delete allow 5432/tcp 2>/dev/null || true
ufw delete allow 3000/tcp 2>/dev/null || true

echo "========================================================="
echo "   Deploy do NAP finalizado com sucesso!                "
echo "   O sistema já está rodando via PM2 (nap-backend)      "
echo "   e acessível através do Nginx na porta 80.            "
echo "========================================================="
