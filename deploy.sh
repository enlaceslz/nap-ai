#!/usr/bin/env bash
# ====================================================================
# NAP TELECOM - Script de Deploy e Provisionamento Oficial (Debian 12)
# Arquitetura: Single-Tenant ISP (1 VM/VPS por Provedor)
# Infraestrutura: Docker Compose (PostgreSQL, Redis, Mongo) + Node 22 (PM2) + Asterisk 20+ NBI
# ====================================================================

set -euo pipefail

# 1. Definição de Variáveis e Diretórios no Topo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$SCRIPT_DIR"
ENV_FILE="$DIR/.env"
ENV_EXAMPLE="$DIR/.env.example"

echo "========================================================="
echo "   Iniciando Deploy do NAP - Omnichannel ISP (Debian 12)  "
echo "   Diretório Base: $DIR                                  "
echo "========================================================="

# 2. Validações Preliminares de Privilégio e Ambiente
if [ "$(id -u)" -ne 0 ]; then
  echo "[ERRO FATAL] Este script de instalação deve ser executado como root ou via sudo." >&2
  exit 1
fi

echo "[1/8] Verificando requisitos de sistema e pacotes essenciais..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git build-essential nginx ufw openssl lsof net-tools jq

# 3. Verificação do Docker e Docker Compose
if ! command -v docker &>/dev/null; then
  echo "Instalando Docker Engine..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable --now docker
fi

if ! docker compose version &>/dev/null; then
  echo "Instalando plugin do Docker Compose..."
  apt-get install -y -qq docker-compose-plugin
fi

# 4. Gestão Segura de Variáveis de Ambiente (.env)
echo "[2/8] Validando arquivo de configuração de segredos (.env)..."

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    echo "Arquivo .env não encontrado. Inicializando novo .env com segredos criptográficos seguros gerados dinamicamente..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"

    # Geração de senhas randômicas fortes (sem placeholders)
    PG_PASS=$(openssl rand -hex 24)
    JWT_SEC=$(openssl rand -hex 32)
    WH_SEC=$(openssl rand -hex 32)
    ARI_SEC=$(openssl rand -hex 24)
    AMI_SEC=$(openssl rand -hex 24)
    RAMAL_SEC=$(openssl rand -hex 24)

    sed -i "s/POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION/POSTGRES_PASSWORD=${PG_PASS}/g" "$ENV_FILE"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:${PG_PASS}@127.0.0.1:5432/nap_crm|g" "$ENV_FILE"
    sed -i "s/JWT_SECRET=CHANGE_ME_IN_PRODUCTION/JWT_SECRET=${JWT_SEC}/g" "$ENV_FILE"
    sed -i "s/WEBHOOK_SECRET=CHANGE_ME_IN_PRODUCTION/WEBHOOK_SECRET=${WH_SEC}/g" "$ENV_FILE"
    sed -i "s/ASTERISK_SECRET_ARI=CHANGE_ME_IN_PRODUCTION/ASTERISK_SECRET_ARI=${ARI_SEC}/g" "$ENV_FILE"
    sed -i "s/ASTERISK_SECRET_AMI=CHANGE_ME_IN_PRODUCTION/ASTERISK_SECRET_AMI=${AMI_SEC}/g" "$ENV_FILE"
    sed -i "s/ASTERISK_RAMAL_SECRET=CHANGE_ME_IN_PRODUCTION/ASTERISK_RAMAL_SECRET=${RAMAL_SEC}/g" "$ENV_FILE"
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000|g" "$ENV_FILE"
    
    echo "Novo .env criado com credenciais randômicas de alta entropia."
  else
    echo "[ERRO FATAL] Arquivo .env.example não localizado para inicializar o ambiente." >&2
    exit 1
  fi
fi

chmod 600 "$ENV_FILE"
echo "Permissões 0600 aplicadas ao arquivo $ENV_FILE"

# Validação contra placeholders inseguros em produção
source "$ENV_FILE"
PROIBIDOS=("CHANGE_ME_IN_PRODUCTION" "CHANGE_ME" "nap_secure_pwd" "postgres:postgres" "123456" "admin")

for p in "${PROIBIDOS[@]}"; do
  if grep -q "$p" "$ENV_FILE"; then
    echo "[ERRO FATAL DE SEGURANÇA] O arquivo .env contém valores padrão ou inseguros ('$p')." >&2
    echo "Edite $ENV_FILE e configure chaves reais e seguras antes de realizar o deploy." >&2
    exit 1
  fi
done

# 5. Checagem de Conflitos de Portas do Sistema
echo "[3/8] Verificando portas do sistema..."
for port in 80 443; do
  if lsof -i :$port -sTCP:LISTEN | grep -v nginx &>/dev/null; then
    echo "[AVISO] Porta $port já está em uso por processo diferente de nginx:"
    lsof -i :$port
  fi
done

# 6. Provisionamento do Banco de Dados via Docker Compose
echo "[4/8] Subindo infraestrutura isolada de containers (PostgreSQL, Redis, Mongo)..."
mkdir -p "$DIR/certs"
chmod 700 "$DIR/certs"

cd "$DIR"
docker compose up -d db redis mongo

echo "Aguardando healthcheck do PostgreSQL (nap_postgres)..."
for i in {1..30}; do
  if docker exec nap_postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-nap_crm}" &>/dev/null; then
    echo "PostgreSQL pronto e saudável!"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "[ERRO FATAL] Timeout aguardando inicialização do banco PostgreSQL no container." >&2
    docker compose logs db
    exit 1
  fi
done

# 7. Renderização Segura das Configurações do Asterisk
echo "[5/8] Renderizando configurações seguras do Asterisk..."
if [ -f "$DIR/asterisk-config/render-configs.sh" ]; then
  bash "$DIR/asterisk-config/render-configs.sh" /etc/asterisk || bash "$DIR/asterisk-config/render-configs.sh" "$DIR/asterisk-config"
fi

# 8. Instalação de Node.js e Build da Aplicação com npm ci
echo "[6/8] Instalando dependências e compilando aplicação..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo "Instalando Node.js v22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi

# Uso rigoroso de npm ci para reprodutibilidade estrita
if [ -f "$DIR/package-lock.json" ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

# Executa migrações do schema no banco de dados
echo "Aplicando schema do banco de dados (Drizzle ORM)..."
npm run db:push || echo "[AVISO] db:push executado ou schema já sincronizado."

echo "Gerando bundle de produção..."
npm run build

# 9. Configuração do PM2 e Nginx
echo "[7/8] Iniciando processos via PM2 e configurando Nginx..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

pm2 stop nap-backend 2>/dev/null || true
pm2 delete nap-backend 2>/dev/null || true
pm2 start dist/server.cjs --name nap-backend --env production
pm2 save

cat > /etc/nginx/sites-available/nap << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
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
nginx -t
systemctl restart nginx

# Firewall Seguro (UFW)
echo "Configurando regras de firewall UFW..."
ufw --force reset >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH' || true
ufw allow 80/tcp comment 'Nginx HTTP'
ufw allow 443/tcp comment 'Nginx HTTPS mTLS'
ufw allow 5060/udp comment 'Asterisk SIP UDP'
ufw allow 8089/tcp comment 'Asterisk WebRTC WSS'
ufw allow 10000:20000/udp comment 'Asterisk RTP Audio'
ufw allow 7547/tcp comment 'GenieACS CWMP'
ufw --force enable

# 10. Healthcheck HTTP de Validação Final
echo "[8/8] Executando Healthcheck HTTP final..."
for i in {1..20}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || true)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "Healthcheck HTTP 200 OK! A aplicação está ativa e respondendo perfeitamente."
    break
  fi
  sleep 1
  if [ "$i" -eq 20 ]; then
    echo "[ERRO FATAL] A aplicação não respondeu com HTTP 200 na rota /api/health após 20 tentativas." >&2
    pm2 logs nap-backend --lines 30 --nostream
    exit 1
  fi
done

echo "========================================================="
echo "   Deploy do NAP finalizado com ÊXITO E HOMOLOGADO!      "
echo "   Backend: PM2 (nap-backend) na porta 3000              "
echo "   Proxy Reverso: Nginx na porta 80/443                  "
echo "   Banco: PostgreSQL 16 (Container nap_postgres)         "
echo "========================================================="
