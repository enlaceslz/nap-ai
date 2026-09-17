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
echo "[4/7] Configurando Diretório da Aplicação..."
# Assume-se que o script está rodando de dentro do diretório do projeto clonado
DIR=$(pwd)
echo "Diretório de trabalho: $DIR"

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
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/nap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Firewall básico
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 5432/tcp

echo "========================================================="
echo "   Deploy do NAP finalizado com sucesso!                "
echo "   O sistema já está rodando via PM2 (nap-backend)      "
echo "   e acessível através do Nginx na porta 80.            "
echo "========================================================="
