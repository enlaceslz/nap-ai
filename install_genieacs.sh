#!/bin/bash
# ==============================================================================
# NAP (Núcleo de Atendimento ao Provedor) - Instalador Autônomo GenieACS
# OS Suportado: Debian 12 (Bookworm)
# Objetivo: Provisionar o servidor de telemetria TR-069 (GenieACS)
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    Instalador Autônomo GenieACS (TR-069) - NAP     ${NC}"
echo -e "${BLUE}====================================================${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERRO] Este script precisa ser executado como root.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}[1/4] Instalando dependências e MongoDB...${NC}"
apt-get update -y
apt-get install -y gnupg curl wget build-essential

# Instalar MongoDB (GenieACS depende do MongoDB)
# Adicionando chave e repositório do MongoDB 7.0 para Debian 12
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -y
apt-get install -y mongodb-org

systemctl enable mongod
systemctl start mongod

echo -e "\n${YELLOW}[2/4] Instalando Node.js e GenieACS...${NC}"
# Assumindo que o Node.js já pode estar instalado pelo deploy.sh, validamos:
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

npm install -g genieacs@1.2.12

echo -e "\n${YELLOW}[3/4] Configurando Serviços Systemd para GenieACS...${NC}"
# Criar usuário do sistema para segurança
useradd --system --no-create-home --user-group genieacs || true
mkdir -p /opt/genieacs/ext
chown genieacs:genieacs /opt/genieacs/ext

# Criar arquivo de ambiente (Environment)
cat > /opt/genieacs/genieacs.env <<EOF
GENIEACS_CWMP_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-cwmp-access.log
GENIEACS_NBI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-nbi-access.log
GENIEACS_FS_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-fs-access.log
GENIEACS_UI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-ui-access.log
GENIEACS_DEBUG_FILE=/var/log/genieacs/genieacs-debug.yaml
NODE_OPTIONS=--max-old-space-size=2048
GENIEACS_EXT_DIR=/opt/genieacs/ext
GENIEACS_UI_PORT=3005
GENIEACS_UI_JWT_SECRET=$(openssl rand -hex 32)
EOF

chown genieacs:genieacs /opt/genieacs/genieacs.env
chmod 600 /opt/genieacs/genieacs.env

# Diretório de Logs
mkdir -p /var/log/genieacs
chown genieacs:genieacs /var/log/genieacs

# Serviços Systemd (CWMP, NBI, FS, UI)
for service in cwmp nbi fs ui; do
cat > /etc/systemd/system/genieacs-${service}.service <<EOF
[Unit]
Description=GenieACS ${service}
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=/usr/bin/genieacs-${service}

[Install]
WantedBy=default.target
EOF
done

systemctl daemon-reload
for service in cwmp nbi fs ui; do
    systemctl enable genieacs-${service}
    systemctl start genieacs-${service}
done

echo -e "\n${YELLOW}[4/4] Finalizando e Configurando Firewall...${NC}"
ufw allow 7547/tcp # CWMP - Comunicação com as ONTs
ufw allow 7557/tcp # NBI - API REST (Para conexão interna do NAP)
ufw allow 3005/tcp # UI do GenieACS (Isolada da porta 3000 do NAP)

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}GenieACS INSTALADO COM SUCESSO!${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "As ONTs devem ser apontadas para: http://IP_DO_SERVIDOR:7547"
echo -e "A Interface UI do GenieACS está rodando em: http://IP_DO_SERVIDOR:3005"
echo -e "API NBI (Usada pelo backend NAP) em: http://127.0.0.1:7557"
echo -e "====================================================\n"
