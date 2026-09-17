#!/bin/bash
# ==============================================================================
# NAP - Script de Backup de Banco de Dados (Disaster Recovery - FASE 6)
# RPO (Recovery Point Objective): 24 Horas
# Retenção Local: 7 dias
# ==============================================================================

BACKUP_DIR="/opt/nap/backups"
DB_NAME="nap_db"
DB_USER="postgres"
DATE=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="nap_$DATE.dump"

echo "[INFO] Iniciando rotina de backup do NAP..."

# 1. Cria diretório se não existir
mkdir -p $BACKUP_DIR

# 2. Executa o dump comprimido (-F c)
# Requer senha no ~/.pgpass ou variável PGPASSWORD configurada no cron
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/$FILE_NAME

if [ $? -eq 0 ]; then
    echo "[SUCESSO] Backup gravado em: $BACKUP_DIR/$FILE_NAME"
    
    # 3. Limpeza de retenção (Exclui dumps mais antigos que 7 dias)
    echo "[INFO] Rotacionando backups antigos (> 7 dias)..."
    find $BACKUP_DIR -type f -name "nap_*.dump" -mtime +7 -exec rm {} \;
    
    echo "[INFO] Rotina concluída."
else
    echo "[ERRO] Falha ao realizar o backup do banco de dados."
    exit 1
fi
