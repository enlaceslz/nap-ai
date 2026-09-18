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
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'nap_secure_pwd';" || true
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

# Firewall Completo para ISP (Telefonia, TR-069, Zabbix, Radius e Web)
ufw allow 80/tcp comment 'Nginx HTTP'
ufw allow 443/tcp comment 'Nginx HTTPS mTLS'
ufw allow 3000/tcp comment 'Node.js Express'
ufw allow 5432/tcp comment 'PostgreSQL CRM'
ufw allow 5060/tcp comment 'Asterisk SIP TCP'
ufw allow 5060/udp comment 'Asterisk SIP UDP'
ufw allow 8089/tcp comment 'Asterisk WebRTC WSS'
ufw allow 10000:20000/udp comment 'Asterisk RTP Audio'
ufw allow 7547/tcp comment 'GenieACS CWMP'
ufw allow 10050/tcp comment 'Zabbix Agent'
ufw allow 10051/tcp comment 'Zabbix Server Trapper'
ufw allow 3799/udp comment 'Radius CoA PoD'

echo "========================================================="
echo "   Deploy do NAP finalizado com sucesso!                "
echo "   O sistema já está rodando via PM2 (nap-backend)      "
echo "   e acessível através do Nginx na porta 80.            "
echo "========================================================="
