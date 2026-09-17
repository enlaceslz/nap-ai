#!/bin/bash
# ==============================================================================
# NAP - Script de Restauração (Disaster Recovery)
# RTO (Recovery Time Objective): Estimado em < 10 minutos
# ==============================================================================

if [ -z "$1" ]; then
    echo "Uso: ./restore_db.sh <caminho_para_arquivo.dump>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="nap_db"
DB_USER="postgres"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERRO] Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "[ATENÇÃO CRÍTICA] Você está prestes a SOBRESCREVER o banco de produção."
echo "Todas as transações desde este backup serão perdidas."
read -p "Tem certeza absoluta que deseja continuar? (s/N) " confirm

if [[ $confirm == [sS] || $confirm == [yY] ]]; then
    echo "[INFO] Iniciando restauração do arquivo: $BACKUP_FILE..."
    
    # Restaura o banco limpando tabelas antes (-c) de forma transacional (-1)
    pg_restore -U $DB_USER -d $DB_NAME -c -1 $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo "[SUCESSO] Restauração concluída com sucesso! Banco operante."
    else
        echo "[ERRO] Falha ao tentar restaurar o banco de dados."
        exit 1
    fi
else
    echo "[INFO] Operação abortada com segurança. Nenhuma alteração foi feita."
fi
