# Matriz de Segurança e Controle de Acesso (RBAC) — NAP

**Projeto:** NAP (Núcleo de Atendimento ao Provedor)  
**Versão:** Setembro de 2026 (Consolidada)  
**Mecanismo:** RBAC Criptográfico via JWT + Engine de Políticas de IA (`AiPolicyEngine`)

---

## 1. Papéis de Usuário (Roles)

O sistema define 8 perfis funcionais estritamente delimitados pelo princípio do menor privilégio:

1. **ADMIN:** Administrador geral do provedor. Acesso irrestrito a configurações, parametrizações de rede, relatórios gerenciais e delegação de acessos.
2. **GESTOR:** Gestor de operações e atendimento. Acesso completo a CRM, Help Desk, campanhas e auditoria gerencial.
3. **NOC:** Engenheiro ou analista de redes. Acesso pleno a OLTs, ONUs, Zabbix, GenieACS TR-069, IPAM e mapa de rede GIS. Sem acesso a dados bancários/financeiros sensíveis.
4. **SUPORTE:** Operador de suporte técnico N2/N1. Diagnóstico de CPEs, reboots autorizados, abertura de chamados e atendimento omnichannel.
5. **FINANCEIRO:** Operador financeiro do provedor. Emissão de Pix, conciliação C6 Bank, baixa no ERP e gestão de faturas. Sem acesso a comandos de rede física.
6. **CAMPO:** Técnico externo/rua. Acesso restrito ao aplicativo de Ordens de Serviço, leitura de sinal óptico e atualização de status da O.S.
7. **ATENDIMENTO:** Atendente de SAC/vendas. Atendimento de conversas WABA/Webchat, consulta cadastral básica e geração de 2ª via de fatura.
8. **AUDITOR:** Fiscal de conformidade/DPO. Acesso exclusivo de leitura à trilha imutável de auditoria e relatórios de conformidade LGPD.

---

## 2. Matriz de Permissões por Papel

| Código de Permissão | Descrição | ADMIN | GESTOR | NOC | SUPORTE | FINAN | CAMPO | ATEND | AUDITOR |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `SISTEMA_ADMIN` | Configurações globais e setup de infraestrutura | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `AUDITORIA_LER` | Visualização da trilha criptográfica de logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `CLIENTES_LER` | Consulta ao cadastro Customer 360 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `CLIENTES_EDITAR` | Alteração de dados cadastrais do assinante | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `FATURAS_LER` | Visualização de faturas e histórico de pagamento | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `FATURAS_EMITIR_PIX` | Geração dinâmica de cobrança Pix Banco C6 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `FATURAS_BAIXAR_ERP` | Baixa e conciliação manual no ERP | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `ONU_READ` | Telemetria óptica e diagnóstico de ONU GPON | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `ONU_REBOOT` | Reinicialização remota de ONU | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `ONU_PROVISION` | Autorização e ativação de nova ONU na PON | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ONU_ENABLE` / `DISABLE` | Bloqueio/Desbloqueio de porta óptica | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ONU_DELETE` | Desprovisionamento permanente de ONU | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `OLT_READ` | Monitoramento e leitura de OLTs | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `OLT_CONFIG` | Alteração de perfis VLAN/DBA e interfaces | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ZABBIX_ACK_ALARM` | Reconhecimento de alertas e alarmes de NOC | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `IPAM_MANAGE` | Alocação de blocos IPv4 e delegação IPv6 PD | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `WABA_CHAT` | Envio de mensagens no WhatsApp WABA | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `WABA_HANDOFF` | Transferência de fila IA para operador humano | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `FIELD_SERVICE_OS` | Execução de Ordens de Serviço em campo | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 3. Matriz de Risco e Governança da IA (MaIA / Gemini)

Toda ação executada pelo assistente de Inteligência Artificial é interceptada pelo `AiPolicyEngine` antes de qualquer chamada ao subsistema de rede ou financeiro:

| Nome da Ferramenta | Classificação de Risco | Permissão Necessária | Confirmação do Assinante | Ação e Validação |
| :--- | :---: | :--- | :---: | :--- |
| `sgp_consultar_faturas` | **BAIXO** | `FATURAS_LER` | Não | Consulta somente-leitura baseada no documento/telefone validado |
| `sgp_gerar_pix` | **MÉDIO** | `FATURAS_EMITIR_PIX` | Sim | Emissão de chave Pix dinâmica única associada à fatura real |
| `sgp_desbloqueio_confianca` | **ALTO** | `CLIENTES_EDITAR` | Sim (Explícita) | Verificação se o cliente já usou o benefício no mês vigente |
| `onu_diagnostico` | **BAIXO** | `ONU_READ` | Não | Leitura de potência óptica RX/TX via TR-069 / OLT Service |
| `onu_reboot` | **ALTO** | `ONU_REBOOT` | Sim (Explícita) | Requer autorização prévia e não permite repetição em menos de 5 min |
| `olt_reiniciar_porta` | **CRÍTICO** | `OLT_CONFIG` | **Bloqueado para IA** | Exclusivo para engenheiros NOC autenticados |
| `waba_transferir_humano` | **BAIXO** | `WABA_HANDOFF` | Não | Handoff automático ao detectar insatisfação ou complexidade |

---

## 4. Proteção e Auditoria Criptográfica

1. **Hash Chained Audit Log:**
   Cada evento registrado gera um hash SHA-256 combinando:
   $$\text{entryHash} = \text{SHA256}(\text{previousHash} + \text{timestamp} + \text{usuario} + \text{acao} + \text{detalhes} + \text{status})$$
   Qualquer tentativa de exclusão ou modificação no banco de dados invalida toda a cadeia subsequente.

2. **Detecção de Fraude e Replay Attack:**
   Todos os webhooks bancários e de mensageria validam:
   - Header de assinatura HMAC-SHA256
   - Janela de tolerância temporal máxima de 5 minutos
   - Chave de idempotência única gravada atomicamente antes da execução
