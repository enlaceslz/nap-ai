#!/usr/bin/env bash
# ====================================================================
# NAP TELECOM - Renderizador Seguro de Configurações Asterisk 20+
# Gera arquivos de credenciais isolados com permissões estritas (0600)
# NUNCA grava senhas em texto puro no versionamento Git.
# ====================================================================

set -euo pipefail

DEST_DIR="${1:-/etc/asterisk}"
LOCAL_CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Se destino não for acessível (ex: desenvolvimento sem Asterisk nativo), renderiza no diretório local
if [ ! -d "$DEST_DIR" ] || [ ! -w "$DEST_DIR" ]; then
  DEST_DIR="$LOCAL_CONFIG_DIR"
fi

echo "[Asterisk Config] Renderizando arquivos de credenciais para: $DEST_DIR"

PROIBIDAS=(
  "CHANGE_ME_IN_PRODUCTION"
  "CHANGE_ME"
  "nap_ari_secret_2026"
  "nap_ami_secret_2026"
  "sip_pass_2001_webrtc"
  "123456"
  "password"
  "admin"
)

is_proibida() {
  local val="$1"
  for p in "${PROIBIDAS[@]}"; do
    if [ "$val" = "$p" ]; then
      return 0
    fi
  done
  return 1
}

# 1. ARI Secret
ARI_SECRET="${ASTERISK_SECRET_ARI:-}"
if [ -z "$ARI_SECRET" ] || is_proibida "$ARI_SECRET"; then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    echo "[ERRO FATAL] ASTERISK_SECRET_ARI não definido ou utiliza valor inseguro/proibido em produção!" >&2
    exit 1
  else
    ARI_SECRET="$(openssl rand -hex 16)"
    echo "[AVISO DEV] Gerado segredo efêmero aleatório para ARI"
  fi
fi

# 2. AMI Secret
AMI_SECRET="${ASTERISK_AMI_PASSWORD:-${ASTERISK_SECRET_AMI:-}}"
if [ -z "$AMI_SECRET" ] || is_proibida "$AMI_SECRET" || ( [ "${NODE_ENV:-development}" = "production" ] && [ "${#AMI_SECRET}" -lt 16 ] ); then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    echo "[ERRO FATAL] ASTERISK_AMI_PASSWORD (ou ASTERISK_SECRET_AMI) não definido, possui menos de 16 caracteres ou utiliza valor inseguro/proibido em produção!" >&2
    exit 1
  else
    AMI_SECRET="$(openssl rand -hex 16)"
    echo "[AVISO DEV] Gerado segredo efêmero aleatório para AMI"
  fi
fi

# 3. WebRTC / PJSIP Ramal Secret
RAMAL_SECRET="${ASTERISK_RAMAL_SECRET:-}"
if [ -z "$RAMAL_SECRET" ] || is_proibida "$RAMAL_SECRET"; then
  if [ "${NODE_ENV:-development}" = "production" ]; then
    echo "[ERRO FATAL] ASTERISK_RAMAL_SECRET não definido ou utiliza valor inseguro/proibido em produção!" >&2
    exit 1
  else
    RAMAL_SECRET="$(openssl rand -hex 16)"
    echo "[AVISO DEV] Gerado segredo efêmero aleatório para Ramal WebRTC"
  fi
fi

# Geração dos arquivos de credenciais com permissão restrita 0600
cat <<EOF > "$DEST_DIR/ari_secret.conf"
; Gerado automaticamente via render-configs.sh - NÃO EDITAR MANUALMENTE
password = ${ARI_SECRET}
EOF
chmod 600 "$DEST_DIR/ari_secret.conf"

cat <<EOF > "$DEST_DIR/manager_secret.conf"
; Gerado automaticamente via render-configs.sh - NÃO EDITAR MANUALMENTE
secret = ${AMI_SECRET}
EOF
chmod 600 "$DEST_DIR/manager_secret.conf"

cat <<EOF > "$DEST_DIR/pjsip_secret.conf"
; Gerado automaticamente via render-configs.sh - NÃO EDITAR MANUALMENTE
password = ${RAMAL_SECRET}
EOF
chmod 600 "$DEST_DIR/pjsip_secret.conf"

# Se executando como root no Debian com usuário asterisk presente
if id -u asterisk >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  chown asterisk:asterisk "$DEST_DIR/ari_secret.conf" "$DEST_DIR/manager_secret.conf" "$DEST_DIR/pjsip_secret.conf"
fi

echo "[Asterisk Config] Credenciais renderizadas e protegidas com sucesso (0600)."
