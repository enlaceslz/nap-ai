# Guia de Provisionamento: GenieACS (TR-069) no NAP

O **GenieACS** é o pilar de telemetria óptica e Wi-Fi do NAP. Ele atua como um Auto Configuration Server (ACS) utilizando o protocolo TR-069 (CWMP) para conversar de forma massiva com as ONTs/Roteadores na casa dos clientes do provedor (ISP).

A interface administrativa do NAP (`/admin/mapa-rede` e NOC) extrai o sinal óptico (RX/TX), status de alarmes e uptime diretamente do GenieACS através de sua API REST (NBI).

## Arquitetura de Implantação

No cenário ideal para provedores regionais, o GenieACS roda na mesma VM/VPS ou em uma VPC segura onde o backend Node.js do NAP possa acessá-lo localmente (sem expor a API de controle para a internet).

### Componentes Internos
- **MongoDB 7.0:** O banco de dados NoSQL padrão exigido para o armazenamento massivo de telemetria.
- **CWMP (Porta 7547):** A porta que fica exposta para as ONTs se comunicarem (via internet ou VLAN de gerência).
- **NBI (Porta 7557):** A API Northbound (REST). É nela que o backend do NAP faz os `fetch()` para resgatar os parâmetros.
- **FS (Porta 7567):** File Server (para upload de firmware em massa).
- **UI (Porta 3000*):** Interface visual padrão do GenieACS (opcional, já que o NAP embute os dados no próprio dashboard).

## Como Instalar (Script Autônomo)

Criamos o script `install_genieacs.sh` para automatizar totalmente a compilação do MongoDB 7 e a montagem dos serviços Systemd para o GenieACS no Debian 12.

```bash
# 1. Torne-se root
sudo su -

# 2. Navegue até a pasta do projeto
cd /caminho/para/nap

# 3. Execute o instalador do GenieACS
./install_genieacs.sh
```

### O que o script fará?
1. Configura as chaves PGP oficiais do MongoDB e instala a versão 7.0, ativando-a via Systemctl.
2. Instala via NPM (globalmente) o pacote `genieacs`.
3. Cria o usuário isolado `genieacs` no Linux para não rodar como root (segurança).
4. Escreve os 4 Daemons no `/etc/systemd/system/` (cwmp, nbi, fs, ui) apontando para o arquivo seguro de variáveis (`/opt/genieacs/genieacs.env`).
5. Inicia e ativa o startup automático de todos os serviços.

## Integração Backend (NAP -> GenieACS)

Para que o NAP consiga consultar o status das ONTs, certifique-se de configurar o arquivo `.env` do servidor (Node.js) com as credenciais do NBI.

```env
# Arquivo: .env do projeto NAP
GENIEACS_URL="http://127.0.0.1:7557"
GENIEACS_USER="api_user" # Configure caso aplique autenticação no NBI
GENIEACS_PASSWORD="api_password"
```

No dashboard do NAP (`SyncStatusMonitor.tsx`), o componente fará requisições cíclicas a cada 15 segundos para validar o estado do link entre o CRM (SGP) e a rede óptica (GenieACS).

## Políticas de Firewall Recomendadas

* **Liberação Externa:** A porta `7547` (CWMP) **deve** estar liberada no Firewall para que os equipamentos na casa do cliente consigam fazer a chamada (*Inform*) para o servidor. Se o ISP possuir uma VLAN (gerência), restrinja o acesso apenas à sub-rede da VLAN.
* **Bloqueio Externo:** A porta `7557` (NBI API) **não deve** ser exposta para a internet pública, visto que ela possui total controle (reboot, reset, leitura de PPPoE) sobre as ONTs. Ela deve ser consumida apenas por `127.0.0.1` (o próprio NAP Node.js).
