# Automação de Deploy: NAP Omnichannel

Esta documentação descreve a utilização do script de deploy autônomo, projetado para provisionar o ambiente NAP em uma VPS ou Máquina Virtual rodando **Debian 12 (Bookworm)** de forma simplificada, técnica e segura.

O script `deploy.sh` foi escrito para assumir a carga operacional da instalação, executando nativamente o build da interface React (Vite) acoplada ao backend (Express), provisionamento do Nginx, firewall e até mesmo a compilação do Asterisk 20.

## Pré-requisitos

1. **Sistema Operacional:** Debian 12 limpo.
2. **Acesso:** Privilégios de superusuário (`root`).
3. **Rede:** Um domínio ou subdomínio (ex: `nap.seuprovedor.com.br`) apontando para o IP público da VPS (Registro A).

## Executando o Deploy

O processo de implantação foi reduzido à execução de um único script interativo. Conecte-se ao servidor e garanta que você esteja no diretório raiz do projeto NAP.

```bash
# 1. Garanta que você é o usuário root
sudo su -

# 2. Navegue até o diretório do projeto (onde está o deploy.sh)
cd /caminho/para/o/projeto/nap

# 3. Dê permissão de execução (se necessário)
chmod +x deploy.sh

# 4. Execute o instalador
./deploy.sh
```

## O que o script faz de forma autônoma?

Ao iniciar, o script solicitará apenas o seu **Domínio**. A partir desse momento, ele atuará de forma independente nas seguintes frentes:

1. **Atualização do SO:** Executa `apt update && upgrade`.
2. **Dependências do Ecossistema:** Instala Git, Curl, UFW (Firewall), Certbot e Nginx.
3. **Ambiente Node.js:** Instala o Node.js v20 LTS via repositório oficial da NodeSource e instala o gerenciador de processos PM2 globalmente.
4. **Asterisk 20 LTS:** Pergunta se você deseja provisionar o Asterisk. Se sim, ele baixa as dependências (`libjansson-dev`, `uuid-dev`, etc.), faz o download do *tarball* oficial do Asterisk 20, executa o `./configure` priorizando PJSIP embutido e realiza a compilação (`make`) de forma silenciosa.
5. **Build do NAP:** Executa `npm install` e `npm run build` (esbuild) gerando o servidor otimizado em `dist/server.cjs`.
6. **Daemonização:** Registra o servidor backend no PM2 com o nome `nap-backend` e programa sua inicialização junto com o boot do servidor (systemd).
7. **Proxy Reverso:** Configura um bloco de servidor no Nginx apontando o tráfego da porta 80/443 para a porta 3000 (onde o Node.js roda nativamente), com suporte a WebSockets (`Upgrade $http_upgrade`).
8. **Segurança (SSL e Firewall):** 
   - Aciona o Certbot automaticamente para emitir e instalar os certificados SSL (Let's Encrypt) para o domínio fornecido.
   - Ativa o UFW limitando portas de entrada estritamente para SSH, HTTP e HTTPS (protegendo portas sensíveis de banco e PJSIP por padrão).

## Gestão Pós-Deploy

Após o script finalizar, sua aplicação estará rodando na URL fornecida (via HTTPS). 
Comandos úteis para gestão da infraestrutura via PM2:

* **Visualizar logs em tempo real:** `pm2 logs nap-backend`
* **Reiniciar a aplicação:** `pm2 restart nap-backend`
* **Ver consumo de CPU e RAM:** `pm2 monit`

### Considerações de Rede (Telefonia)
O Firewall UFW vem, por padrão, com as portas SIP bloqueadas para evitar ataques. Quando você provisionar um tronco SIP ou for conectar hardphones remotos, lembre-se de liberar os IPs específicos da sua operadora no firewall. Exemplo:
```bash
# Libera tráfego na porta 5060 UDP apenas para o IP do fornecedor VoIP
ufw allow from IP_DA_OPERADORA to any port 5060 proto udp
```
