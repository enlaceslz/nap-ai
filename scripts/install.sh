#!/bin/bash
# Script de Instalação e Deploy do NAP (WACRM) para Provedores (Ubuntu/Debian)

echo "=========================================="
echo "🚀 Iniciando setup do NAP (WACRM) v2.0"
echo "=========================================="

# Atualiza pacotes e instala Docker se não existir
if ! command -v docker &> /dev/null
then
    echo "📦 Instalando Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-compose
else
    echo "✅ Docker já está instalado."
fi

# Criação do arquivo .env a partir do example se não existir
if [ ! -f .env ]; then
    echo "⚙️  Criando arquivo .env padrão com senhas geradas..."
    PG_SEC=$(openssl rand -hex 16)
    JWT_SEC=$(openssl rand -hex 32)
    cat <<EOT > .env
NODE_ENV=production
JWT_SECRET=${JWT_SEC}
GEMINI_API_KEY=CHANGE_ME_IN_PRODUCTION
SGP_URL=https://api.provedor.com.br
SGP_APP=NAP_PROVEDOR_APP
SGP_TOKEN=CHANGE_ME_IN_PRODUCTION
POSTGRES_PASSWORD=${PG_SEC}
DATABASE_URL=postgres://postgres:${PG_SEC}@127.0.0.1:5432/nap_crm
REDIS_URL=redis://127.0.0.1:6379
EOT
    echo "⚠️  Lembre-se de editar o .env e preencher as credenciais de produção."
fi

echo "🔨 Construindo e iniciando containers Docker..."
sudo docker-compose up -d --build

echo "=========================================="
echo "✅ Setup concluído com sucesso!"
echo "🌐 A aplicação deve estar rodando na porta 3000."
echo "📜 Para ver os logs: sudo docker-compose logs -f wacrm-web"
echo "=========================================="
