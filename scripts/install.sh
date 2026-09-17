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
    echo "⚙️  Criando arquivo .env padrão..."
    cat <<EOT > .env
NODE_ENV=production
GEMINI_API_KEY=sua_chave_gemini_aqui
SGP_URL=https://api.sgp.net.br
SGP_APP=seu_app_id_aqui
SGP_TOKEN=seu_token_api_aqui
DATABASE_URL=postgres://postgres:nap_secure_pwd@db:5432/nap_crm
REDIS_URL=redis://redis:6379
EOT
    echo "⚠️  Lembre-se de editar o .env e inserir sua GEMINI_API_KEY real."
fi

echo "🔨 Construindo e iniciando containers Docker..."
sudo docker-compose up -d --build

echo "=========================================="
echo "✅ Setup concluído com sucesso!"
echo "🌐 A aplicação deve estar rodando na porta 3000."
echo "📜 Para ver os logs: sudo docker-compose logs -f wacrm-web"
echo "=========================================="
