# Guia de Provisionamento: Asterisk 20 LTS (Debian 12) + NAP ARI

Este documento descreve a arquitetura, compilação e integração do Asterisk 20 com o backend do NAP (Node.js) utilizando a Asterisk REST Interface (ARI), além de diretrizes rígidas de segurança para implantação em VPS/VM isolada por provedor (ISP).

## 1. Preparação do Ambiente (Debian 12 Bookworm)

Atualize o sistema e instale as dependências essenciais de compilação, incluindo a biblioteca `jansson` (fundamental para o funcionamento da interface REST/JSON do ARI) e as ferramentas do PJSIP.

```bash
apt-get update && apt-get upgrade -y
apt-get install -y build-essential git curl wget libnewt-dev libssl-dev \
  libncurses5-dev subversion libsqlite3-dev build-essential libjansson-dev \
  libxml2-dev uuid-dev libedit-dev sqlite3
```

## 2. Download e Compilação do Asterisk 20 LTS

Recomenda-se a compilação a partir do código-fonte para garantir que módulos específicos do ARI e PJSIP sejam construídos corretamente.

```bash
cd /usr/src
wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
tar zxvf asterisk-20-current.tar.gz
cd asterisk-20.*/

# Instalar dependências adicionais resolvidas pelo próprio Asterisk
contrib/scripts/get_mp3_source.sh
contrib/scripts/install_prereq install

# Configuração focada no empacotamento PJSIP nativo
./configure --with-jansson --with-pjproject-bundled

# No menuselect, garanta que res_ari, res_ari_*, res_pjsip e format_mp3 estão marcados
make menuselect

# Compilação e instalação
make -j$(nproc)
make install
make samples
make config
ldconfig
```

Habilite e inicie o serviço do Asterisk:
```bash
systemctl enable asterisk
systemctl start asterisk
```

## 3. Configuração do HTTP e ARI

O backend do NAP Node.js se comunica com o Asterisk nativo exclusivamente através da porta HTTP (REST) e WebSockets.

### `http.conf` (Localizado em `/etc/asterisk/http.conf`)
Ative o servidor web interno do Asterisk:
```ini
[general]
enabled=yes
bindaddr=127.0.0.1 ; Em cenários de mesma VM, restrinja ao localhost para segurança
bindport=8088
```

### `ari.conf` (Localizado em `/etc/asterisk/ari.conf`)
Configure as credenciais e permissões para o App Engine do NAP:
```ini
[general]
enabled = yes
pretty = yes
allowed_origins = *

[nap_admin] ; O usuário parametrizado no painel do NAP
type = user
read_only = no
password = nap_ari_secret_2026
```

Após salvar, aplique as mudanças:
```bash
asterisk -rx "http reload"
asterisk -rx "ari reload"
```

## 4. Integração no Backend Node.js (NAP)

O NAP atua como controlador CTI através de WebSockets conectando no `/ari/events`. Em produção, o backend Node.js (via `server.ts`) inicializará a conexão WebSocket.

Um exemplo simplificado de conexão Stasis (App):

```typescript
// Exemplo de conexão nativa usando WebSocket (ws)
import WebSocket from 'ws';

const ARI_HOST = process.env.ARI_HOST || '127.0.0.1';
const ARI_PORT = process.env.ARI_PORT || 8088;
const ARI_USER = 'nap_admin';
const ARI_PASS = 'nap_ari_secret_2026';
const APP_NAME = 'nap_voice_agent';

const wsUrl = `ws://${ARI_HOST}:${ARI_PORT}/ari/events?api_key=${ARI_USER}:${ARI_PASS}&app=${APP_NAME}`;
const client = new WebSocket(wsUrl);

client.on('open', () => {
    console.log('[ARI] Conectado ao Asterisk com sucesso. App registrado.');
});

client.on('message', (data) => {
    const event = JSON.parse(data.toString());
    
    // Tratativa de Eventos Stasis, Ringing, HUP, etc.
    if (event.type === 'StasisStart') {
        console.log(`[ARI] Chamada recebida no canal: ${event.channel.id}`);
        // Direcionar para motor IA (Gemini)
    }
});
```

## 5. Práticas de Segurança e Isolamento (VM por Provedor)

Como o projeto foca em provedores ISP isolados (Multi-Tenancy lógico por VPS):

1. **Firewall Strict-Mode (UFW/iptables):**
   - **Bloquear `UDP 5060` (SIP) e `TCP 8088` (ARI) de redes públicas.**
   - O tráfego `5060` só deve ser liberado para os IPs estáticos dos Troncos SIP (Vono, Algar, etc.).
   - O tráfego `8088` deve escutar apenas em `127.0.0.1` (se Node.js e Asterisk rodam na mesma VM) ou via VPN/VPC interna privada.

2. **WebRTC Ingress (WSS):**
   - Para os operadores acessarem o PWA com telefonia no navegador, use Nginx como Proxy Reverso / Terminador SSL na porta `443`.
   - O Nginx redireciona as requisições `wss://voip.provedor.com.br/ws` para a porta local HTTP/WS do Asterisk `8089` (TLS) ou `8088` com segurança. NUNCA exponha as portas PJSIP limpas para a internet.

3. **Fail2Ban:**
   - Instale e configure o `fail2ban` com as "jails" ativas para o Asterisk (`asterisk-iptables`), mitigando ataques de força bruta, flood SIP e brute-force de registro de ramais.

4. **Isolamento Dialplan (Contextos):**
   - Ramais e Troncos SIP **devem** ser configurados (via `pjsip.conf`) para cair inicialmente em contextos genéricos "cego" (ex: `context=from-external-untrusted`). 
   - Apenas origens explicitamente autenticadas podem atingir o contexto de origem mapeado no Node.js (`from-internal` ou contexto do Stasis App).
