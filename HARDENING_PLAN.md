# Plano Operacional de Hardening de Produção — NAP

**Ambiente Alvo:** Debian 12 (Bookworm) 64-bit / Single-Tenant  
**Sistema:** NAP (Núcleo de Atendimento ao Provedor)  
**Objetivo:** Guia passo a passo de hardening de infraestrutura, sistema operacional, rede e serviços de telecomunicação para deploys em produção.

---

## 1. Hardening do Sistema Operacional (Debian 12)

### 1.1. Atualização e Remoção de Pacotes Inseguros
Execute como `root`:
```bash
apt update && apt upgrade -y
apt autoremove --purge -y
apt install -y ufw fail2ban unattended-upgrades libpam-tmpdir auditd
```

### 1.2. Parâmetros de Kernel (`/etc/sysctl.d/99-nap-security.conf`)
Adicione as seguintes proteções de rede contra ataques de negação de serviço e spoofing:
```ini
# Desabilitar roteamento de pacotes ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Proteção contra SYN Flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 2

# Proteção contra IP Spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Desabilitar pacotes Source-Routed
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Aumentar descritores de arquivos para telefonia de alta densidade
fs.file-max = 2097152
```
Aplique imediatamente:
```bash
sysctl -p /etc/sysctl.d/99-nap-security.conf
```

---

## 2. Configuração de Firewall (UFW) e Políticas de Portas

O princípio de menor privilégio governa a abertura de portas na VPS do provedor:

```bash
# Definir regras padrão restritivas
ufw default deny incoming
ufw default allow outgoing

# 1. SSH Seguro (Recomenda-se alterar porta padrão para ex: 2222)
ufw allow 22/tcp comment 'SSH Administrativo'

# 2. Web e API Reversa (Nginx TLS)
ufw allow 80/tcp comment 'HTTP ACME Let's Encrypt'
ufw allow 443/tcp comment 'HTTPS NAP Admin e Portal PWA'

# 3. Telefonia Asterisk 20+ (Voz e Sinalização)
ufw allow 5060/udp comment 'SIP Trunking UDP'
ufw allow 5061/tcp comment 'SIP TLS Criptografado'
ufw allow 8089/tcp comment 'Asterisk WebRTC WSS'
ufw allow 10000:20000/udp comment 'Faixa RTP Audio Chamadas'

# 4. TR-069 GenieACS (CPE CWMP)
ufw allow 7547/tcp comment 'GenieACS TR-069 CWMP para ONUs'

# 5. Radius PoD / CoA (Desconexão e Reautorização)
ufw allow from 10.0.0.0/8 to any port 3799 proto udp comment 'Radius CoA Rede Interna'
ufw allow from 172.16.0.0/12 to any port 3799 proto udp comment 'Radius CoA Rede Interna'
ufw allow from 192.168.0.0/16 to any port 3799 proto udp comment 'Radius CoA Rede Interna'

# Habilitar Firewall
ufw enable
```

> **IMPORTANTE:** As portas `5432` (PostgreSQL), `6379` (Redis), `27017` (MongoDB), `7557` (GenieACS NBI API) e `3000` (Node.js interno) **NUNCA** devem ser abertas no firewall público. Devem escutar estritamente em `127.0.0.1` ou rede interna Docker.

---

## 3. Configuração do Reverse Proxy Nginx com TLS 1.3

Arquivo `/etc/nginx/sites-available/nap.conf`:
```nginx
server {
    listen 80;
    server_name nap.provedor.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nap.provedor.com.br;

    ssl_certificate /etc/letsencrypt/live/nap.provedor.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nap.provedor.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # Cabeçalhos HTTP de Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Tamanho máximo de payload (Upload de comprovantes e fotos de O.S)
    client_max_body_size 15M;

    # Proxy para aplicação NAP
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
    }

    # Proxy para WebSockets Asterisk Webphone
    location /ws {
        proxy_pass https://127.0.0.1:8089/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 4. Hardening do Banco de Dados PostgreSQL 16

1. **Restringir `pg_hba.conf`:**
   Permitir apenas conexões locais via socket UNIX e `127.0.0.1` com criptografia `scram-sha-256`:
   ```text
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   all             all                                     peer
   host    nap_crm         postgres        127.0.0.1/32            scram-sha-256
   host    all             all             all                     reject
   ```

2. **Criptografia de Senha Forte:**
   ```sql
   ALTER SYSTEM SET password_encryption = 'scram-sha-256';
   SELECT pg_reload_conf();
   ```

3. **Backup Automatizado e Criptografado:**
   Rotina diária configurada em cron executando `pg_dump` com compressão e retenção rotativa de 7 dias em `/var/backups/nap/`.

---

## 5. Rotação de Chaves e Credenciais

- **JWT_SECRET e WEBHOOK_SECRET:** Devem ser gerados com alta entropia no momento do setup inicial via `openssl rand -hex 32`.
- **Certificados mTLS do Banco C6:** Armazenados em `/opt/nap/certs/` com permissão estrita `chmod 600 /opt/nap/certs/*` pertencente exclusivamente ao usuário do serviço `nap`.
- **Auditoria de Logs:** Os logs criptográficos em `logs_auditoria` devem ser exportados periodicamente para armazenamento seguro de longa duração (Write-Once Read-Many).
