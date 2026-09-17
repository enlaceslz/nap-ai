import React, { useState, useMemo, useEffect } from 'react';
import { 
 ClipboardCheck, CheckCircle2, AlertTriangle, Clock, 
 ShieldCheck, Server, FileText, Search, Filter, 
 Download, RefreshCw, ChevronDown, ChevronUp, Copy, 
 Check, ExternalLink, Terminal, ShieldAlert, Zap,
 Activity, Users, Radio, Wrench, Lock, ArrowRight,
 RotateCcw, Printer
} from 'lucide-react';

export type CategoriaHomologacao = 'tecnica' | 'seguranca' | 'documentacao';
export type StatusHomologacao = 'concluido' | 'em_progresso' | 'pendente_provedor' | 'bloqueado';
export type CriticidadeItem = 'Bloqueante' | 'Alta' | 'Média';

export interface ItemHomologacao {
 id: string;
 categoria: CategoriaHomologacao;
 titulo: string;
 subtitulo: string;
 progresso: number; // 0 a 100
 status: StatusHomologacao;
 criticidade: CriticidadeItem;
 responsavel: string;
 detalhes: string;
 passoAPasso: string[];
 comandoOuRota: string;
 criterioAceite: string;
 testEndpoint?: string;
 ultimoTesteTimestamp?: string;
 resultadoTeste?: string;
}

const ITENS_HOMOLOGACAO_PADRAO: ItemHomologacao[] = [
 // --- PILAR TÉCNICO (INFRA & CONECTORES) ---
 {
 id: 'tech-ssl-fqdn',
 categoria: 'tecnica',
 titulo: '1. Domínio FQDN & Certificado SSL/TLS (Let\'s Encrypt)',
 subtitulo: 'HTTPS e WSS para Webphone WebRTC e geolocalização dos PWAs',
 progresso: 50,
 status: 'pendente_provedor',
 criticidade: 'Bloqueante',
 responsavel: 'TI Provedor / Sysadmin',
 detalhes: 'Configuração de certificado SSL válido para o domínio do painel na VPS Debian 12. O protocolo WSS é pré-requisito mandatório para o WebRTC do Webphone e APIs de GPS/Câmera nos navegadores modernos.',
 passoAPasso: [
 'Criar entrada DNS do tipo A apontando o domínio (ex: painel.provedor.com.br) para o IP da VPS.',
 'Executar o Certbot Nginx no servidor para emissão gratuita do certificado.',
 'Verificar a renovação automática via systemd timer (certbot.timer).'
 ],
 comandoOuRota: 'certbot --nginx -d painel.provedor.com.br',
 criterioAceite: 'Acesso sem avisos de certificado no navegador e handshake WSS 8089 ativo.'
 },
 {
 id: 'tech-firewall-ports',
 categoria: 'tecnica',
 titulo: '2. Liberação de Portas e Firewall UFW',
 subtitulo: 'Abertura das portas de aplicação, voz Asterisk, AMI e CWMP',
 progresso: 50,
 status: 'pendente_provedor',
 criticidade: 'Bloqueante',
 responsavel: 'Engenharia de Redes',
 detalhes: 'As portas vitais do ecossistema precisam estar liberadas no roteador de borda e no firewall local: 3000 (HTTP/Node.js), 8089 (WSS Asterisk), 5038 (AMI CTI) e 7557 (NBI GenieACS).',
 passoAPasso: [
 'Executar as regras de liberação no UFW do Debian 12.',
 'Configurar regras de NAT/Port Forwarding no MikroTik/Huawei de borda caso a VPS esteja sob IP privado.',
 'Verificar o estado das portas com o comando ufw status.'
 ],
 comandoOuRota: 'ufw allow 3000/tcp && ufw allow 8089/tcp && ufw allow 5038/tcp && ufw allow 7557/tcp',
 criterioAceite: 'Todas as 4 portas respondendo conexões de sockets e TCP no host.'
 },
 {
 id: 'tech-systemd-daemon',
 categoria: 'tecnica',
 titulo: '3. Daemon Systemd / PM2 com Auto-Restart',
 subtitulo: 'Persistência no boot e recuperação automática de falhas do Express',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'DevOps / Sysadmin',
 detalhes: 'O servidor híbrido Express + Vite está compilado em bundle CJS otimizado (`dist/server.cjs`), pronto para ser gerenciado pelo systemd com reinício em até 5 segundos caso ocorra falha.',
 passoAPasso: [
 'Script `npm run build` gerando `dist/server.cjs` com source-maps.',
 'Arquivo de serviço `/etc/systemd/system/nap.service` apontando para `node dist/server.cjs`.',
 'Habilitação de inicialização automática no boot (`systemctl enable nap`).'
 ],
 comandoOuRota: 'systemctl status nap.service',
 criterioAceite: 'Serviço em estado "active (running)" com consumo equilibrado (<150MB RAM).',
 testEndpoint: '/api/health'
 },
 {
 id: 'tech-erp-creds',
 categoria: 'tecnica',
 titulo: '4. Cadastro de URL e Token Bearer do Multi-ERP',
 subtitulo: 'Conexão nativa com SGP, MikWeb, IXC Soft ou Hubsoft',
 progresso: 80,
 status: 'em_progresso',
 criticidade: 'Bloqueante',
 responsavel: 'Administrador NOC / Financeiro',
 detalhes: 'No painel Super Admin (`/admin/configuracoes`), selecionar o ERP utilizado pelo provedor e preencher a URL base e o Token de Acesso da API. O sistema conta com fallback automático para banco em memória caso a API esteja temporariamente offline.',
 passoAPasso: [
 'Acessar o módulo Super Admin -> Integração ERP.',
 'Selecionar o conector desejado (SGP, MikWeb, IXC ou Hubsoft).',
 'Inserir o Token gerado no ERP e clicar em "Testar Comunicação".'
 ],
 comandoOuRota: 'GET /api/configuracoes',
 criterioAceite: 'Indicador verde de ERP ativo exibido no topo da tela do Workspace ERP.',
 testEndpoint: '/api/configuracoes'
 },
 {
 id: 'tech-erp-consulta',
 categoria: 'tecnica',
 titulo: '5. Consulta Unificada de Assinantes e Contratos',
 subtitulo: 'Busca por CPF/CNPJ, Ficha 360, faturas e endereços',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Operação / Atendimento',
 detalhes: 'Módulo de busca inteligente com debounce que consulta e consolida clientes e contratos do ERP, populando instantaneamente a Ficha 360 e o slide-over de contexto do assinante.',
 passoAPasso: [
 'Digitar CPF ou Telefone na barra de busca rápida do CRM 360.',
 'Conferir exibição imediata do status da conexão (Online/Offline/Bloqueado).',
 'Verificar histórico de títulos quitados e em aberto.'
 ],
 comandoOuRota: 'GET /api/contatos',
 criterioAceite: 'Retorno de assinante com tempo de resposta inferior a 250ms.',
 testEndpoint: '/api/contatos'
 },
 {
 id: 'tech-erp-desbloqueio',
 categoria: 'tecnica',
 titulo: '6. Desbloqueio Temporário (Promessa 24h)',
 subtitulo: 'Liberação emergencial de conexão com registro na auditoria',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Cobrança / Atendimento',
 detalhes: 'Disparo de comando de desbloqueio de confiança (24 horas) direto pelo Kanban de Cobrança ou via URA WhatsApp, com validação de limite de promessas por ciclo contratual.',
 passoAPasso: [
 'Localizar cliente inadimplente no Kanban de Cobrança.',
 'Clicar no botão "Desbloqueio 24h (Confiança)".',
 'Confirmar alteração de status e envio de comprovante por WhatsApp.'
 ],
 comandoOuRota: 'POST /api/sgp/desbloqueio/:id',
 criterioAceite: 'Status do contrato alterado para "Desbloqueado Temporário" e log gravado.'
 },
 {
 id: 'tech-erp-pix',
 categoria: 'tecnica',
 titulo: '7. Emissão de PIX Dinâmico e Boletos Bancários',
 subtitulo: 'Geração imediata de QR Code, Copia e Cola e PDF bancário',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Financeiro',
 detalhes: 'Geração do código EMV oficial do Banco Central para liquidação instantânea em qualquer banco, além do link direto para o PDF do boleto bancário emitido pelo ERP.',
 passoAPasso: [
 'Acessar uma fatura aberta no CRM 360 ou na Régua de Cobrança.',
 'Clicar em "Emitir PIX" ou "Copiar Código".',
 'Validar o payload gerado com o leitor de QR Code bancário.'
 ],
 comandoOuRota: 'GET /api/sgp/faturas',
 criterioAceite: 'Payload PIX no formato padrão EMV com chave do provedor.',
 testEndpoint: '/api/sgp/faturas'
 },
 {
 id: 'tech-erp-webhook',
 categoria: 'tecnica',
 titulo: '8. Webhook de Baixa Automática de Faturas',
 subtitulo: 'Recebimento de notificações bancárias para conciliação em tempo real',
 progresso: 30,
 status: 'pendente_provedor',
 criticidade: 'Média',
 responsavel: 'TI Provedor / Financeiro',
 detalhes: 'Cadastrar o endpoint de webhook dentro do painel administrativo do ERP do provedor para que, assim que o banco liquidar o título, o DJD dê baixa automática no Kanban e no Portal.',
 passoAPasso: [
 'Entrar na área de Webhooks/Integrações do ERP (SGP/MikWeb/IXC/Hubsoft).',
 'Cadastrar a URL `https://painel.provedor.com.br/api/webhook/erp`.',
 'Disparar um evento de teste de fatura paga e verificar no log de auditoria.'
 ],
 comandoOuRota: 'POST /api/webhook/erp',
 criterioAceite: 'Fatura atualizada instantaneamente para "Paga" sem intervenção manual.'
 },
 {
 id: 'tech-waba-token',
 categoria: 'tecnica',
 titulo: '9. Token Permanente Meta & Phone Number ID',
 subtitulo: 'Credenciais oficiais da WhatsApp Business Cloud API',
 progresso: 70,
 status: 'em_progresso',
 criticidade: 'Bloqueante',
 responsavel: 'Administrador do Provedor',
 detalhes: 'Configurar o Token de Usuário de Sistema gerado no Meta Business Manager com permissões `whatsapp_business_messaging` e associar o Phone Number ID oficial do suporte.',
 passoAPasso: [
 'Gerar o System User Token permanente no Business Manager da Meta.',
 'Copiar o Token e o Phone Number ID e salvar em `/admin/configuracoes`.',
 'Enviar mensagem de teste através do Inbox Unificado.'
 ],
 comandoOuRota: 'POST https://graph.facebook.com/v19.0/{phone_number_id}/messages',
 criterioAceite: 'Retorno HTTP 200 da API da Meta com Message ID válido.'
 },
 {
 id: 'tech-waba-hsm',
 categoria: 'tecnica',
 titulo: '10. Aprovação de Templates HSM na Meta',
 subtitulo: 'Modelos de mensagens de cobrança e aviso de rompimento de fibra',
 progresso: 40,
 status: 'pendente_provedor',
 criticidade: 'Alta',
 responsavel: 'Marketing / NOC',
 detalhes: 'Submeter para aprovação na Meta os templates utilizados pelas campanhas ativas: avisos de manutenção programada, notificação de fatura a vencer e confirmação de agendamento de OS.',
 passoAPasso: [
 'Acessar o WhatsApp Manager na conta Meta do provedor.',
 'Criar os templates nas categorias "UTILIDADE" e "AUTENTICAÇÃO".',
 'Aguardar aprovação pelo algoritmo da Meta (geralmente de 2 a 15 minutos).'
 ],
 comandoOuRota: 'Meta Business Manager -> WhatsApp Manager -> Modelos de Mensagens',
 criterioAceite: 'Status "Aprovado (Verde)" exibido para todos os modelos cadastrados.'
 },
 {
 id: 'tech-waba-webhook',
 categoria: 'tecnica',
 titulo: '11. Apontamento de Webhook WABA na Meta',
 subtitulo: 'Recebimento bidirecional de mensagens e eventos de entrega (DLR)',
 progresso: 50,
 status: 'pendente_provedor',
 criticidade: 'Bloqueante',
 responsavel: 'TI Provedor',
 detalhes: 'Cadastrar no painel de desenvolvedores da Meta a URL de callback do DJD (`/api/webhook/whatsapp`) para processamento em tempo real de mensagens recebidas e status de leitura.',
 passoAPasso: [
 'No console da Meta, acessar o app de WhatsApp Cloud API.',
 'Inserir o Callback URL `https://painel.provedor.com.br/api/webhook/whatsapp`.',
 'Inserir o Verify Token definido nas configurações do DJD e clicar em Verificar.'
 ],
 comandoOuRota: 'GET /api/webhook/whatsapp?hub.mode=subscribe',
 criterioAceite: 'Meta confirma verificação com sucesso e marca campos como inscritos.'
 },
 {
 id: 'tech-asterisk_20-wss',
 categoria: 'tecnica',
 titulo: '12. Registro SIP do Webphone via WebRTC (WSS 8089)',
 subtitulo: 'Telefonia Asterisk 20+ / Asterisk embarcada no painel do operador',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Engenheiro de Voz / NOC',
 detalhes: 'O Webphone embarcado conecta-se via WebSockets seguros com o Asterisk 20+ negociando o codec Opus, permitindo atender chamadas telefônicas diretamente pelo navegador sem softphone externo.',
 passoAPasso: [
 'Criar ramal do tipo PJSIP com transporte WSS habilitado no Asterisk 20+.',
 'Preencher o número do ramal e senha na barra do operador.',
 'Conferir ícone de fone verde indicando "Ramal Conectado (WebRTC)".'
 ],
 comandoOuRota: 'wss://pbx.provedor.com.br:8089/ws',
 criterioAceite: 'Áudio bidirecional claro com latência < 40ms e sem perda de pacotes.'
 },
 {
 id: 'tech-asterisk-ami',
 categoria: 'tecnica',
 titulo: '13. CTI Reverso via AMI (Porta 5038)',
 subtitulo: 'Abertura automática de Ficha 360 ao receber chamada telefônica',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Engenheiro de Voz',
 detalhes: 'Conexão em background com o Asterisk Manager Interface (AMI) que monitora eventos de ring no ramal do atendente, identificando o número chamador e abrindo o cadastro do assinante antes mesmo de atender.',
 passoAPasso: [
 'Criar usuário AMI no `/etc/asterisk/manager.conf` com permissões `call,originate`.',
 'Configurar credenciais AMI em `/admin/configuracoes`.',
 'Efetuar chamada teste para a fila e conferir o popup na tela do operador.'
 ],
 comandoOuRota: 'Action: Login / Action: Events: Call (TCP 5038)',
 criterioAceite: 'Slide-over aberto automaticamente na tela com nome e plano do cliente.'
 },
 {
 id: 'tech-genieacs-cwmp',
 categoria: 'tecnica',
 titulo: '14. GenieACS TR-069: Telemetria Óptica e Comandos Remotos',
 subtitulo: 'Leitura de RX/TX (-19 a -25 dBm), reboot e troca de Wi-Fi de ONUs',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Técnico NOC N2',
 detalhes: 'Integração completa com a NBI REST API do GenieACS (porta 7557), permitindo ler parâmetros ópticos em tempo real e disparar comandos TR-069 (SetParameterValues e Reboot) com log auditado.',
 passoAPasso: [
 'Apontar a URL do GenieACS NBI em `/admin/configuracoes`.',
 'Acessar o GenieACS Dashboard (`/admin/genieacs`) e localizar uma ONU.',
 'Executar comando de leitura óptica e disparar teste de reboot remoto.'
 ],
 comandoOuRota: 'GET /api/genieacs/devices',
 criterioAceite: 'Potência óptica exibida com semáforo de sinal e comando CWMP acatado.',
 testEndpoint: '/api/genieacs/devices'
 },
 {
 id: 'tech-pwa-mobile',
 categoria: 'tecnica',
 titulo: '15. PWAs Mobile-First (Portal do Assinante & App Campo)',
 subtitulo: 'Instalação em smartphones, suporte offline, GPS e fotos de OS',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Média',
 responsavel: 'Coordenação de Operações',
 detalhes: 'Aplicações PWA com manifest, Service Worker e ícones nativos para iOS e Android. Inclui autoatendimento completo do assinante (`/portal`) e aplicativo do técnico na rua (`/admin/campo`) com captura de coordenadas de GPS.',
 passoAPasso: [
 'Acessar `/portal` e `/admin/campo` pelo celular no Chrome/Safari.',
 'Instalar na tela inicial via banner nativo do PWA.',
 'Iniciar uma OS de campo e conferir envio de coordenadas para o Radar.'
 ],
 comandoOuRota: 'GET /manifest.webmanifest & /api/tecnicos/os',
 criterioAceite: 'Instalado como app nativo com funcionamento responsivo perfeito.',
 testEndpoint: '/api/tecnicos/os'
 },
 {
 id: 'tech-contratos-scm',
 categoria: 'tecnica',
 titulo: '16. Formalização de Contratos SCM & Assinatura Digital',
 subtitulo: 'Aceite eletrônico com Hash SHA-256, comodato de ONT com MAC e reenvio WhatsApp',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Bloqueante',
 responsavel: 'Jurídico / Atendimento',
 detalhes: 'Geração e formalização da minuta SCM nos padrões ANATEL com termo de comodato de ONT Wi-Fi 6 atrelado ao MAC do cliente. Validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020 com registro de IP, data e hash SHA-256 inalterável.',
 passoAPasso: [
 'Acessar o Portal do Assinante (`/portal`) ou Ficha SGP (`/admin/sgp`).',
 'Clicar em "Visualizar Minuta SCM & Termo Comodato" ou no número do contrato no cabeçalho.',
 'Testar a assinatura digital com 1 clique e conferir geração do Hash SHA-256.',
 'No CRM, testar o botão "Reenviar Contrato via WhatsApp" com envio via WABA.'
 ],
 comandoOuRota: 'PortalContratoModal & SgpAdvancedSearch',
 criterioAceite: 'Documento assinado com registro de IP/Data e termo de comodato com endereço MAC da ONT.'
 },
 {
 id: 'tech-telefonia-ura-tts',
 categoria: 'tecnica',
 titulo: '17. Dialplan Studio & Síntese de Voz TTS Gemini',
 subtitulo: 'Editor visual de URA com menus DTMF e geração de áudios telecom em WAV',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Engenharia de Voz / NOC',
 detalhes: 'Editor de fluxos de URA visual (`/admin/telefonia`) integrado com o gerador de Text-to-Speech do Gemini para conversão imediata de avisos operacionais em arquivos de áudio .wav (8kHz mono) para o Asterisk.',
 passoAPasso: [
 'Acessar `/admin/telefonia` e clicar na aba "URA Visual".',
 'Configurar nós de atendimento (Horário, Menu DTMF e Transbordo).',
 'Digitar mensagem no gerador TTS Gemini e clicar em "Gerar Áudio URA".',
 'Ouvir prévia do áudio gerado no navegador.'
 ],
 comandoOuRota: 'POST /api/telefonia/tts & /admin/telefonia',
 criterioAceite: 'Geração de arquivo WAV sem ruídos e com reprodução fluida no Asterisk.'
 },
 {
 id: 'tech-noc-zabbix-olt',
 categoria: 'tecnica',
 titulo: '18. NOC: Telemetria Zabbix & Monitoramento de OLTs GPON',
 subtitulo: 'Central de triggers em tempo real, tráfego agregado e OLTs Huawei/ZTE',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'NOC N2 / Engenharia de Redes',
 detalhes: 'Painel analítico (`/admin/infra`) consumindo a API JSON-RPC do Zabbix para alertar incidentes críticos e exibir telemetria de trânsito IP, PTT/IX.br e saúde das OLTs GPON dos POPs.',
 passoAPasso: [
 'Acessar `/admin/infra` para verificar gráficos de tráfego de borda e CDNs.',
 'Conferir cartões de OLTs instaladas (Huawei, ZTE, Datacom e Fiberhome).',
 'Testar filtro de triggers por criticidade (Disaster, High, Average).'
 ],
 comandoOuRota: 'GET /api/zabbix/triggers & /admin/infra',
 criterioAceite: 'Latência e tráfego atualizados em tempo real sem sobrecarga de polling.'
 },
 {
 id: 'tech-estoque-frota',
 categoria: 'tecnica',
 titulo: '19. Logística FTTx: Almoxarifado e Frota com GPS',
 subtitulo: 'Saldo de ONTs/ferragens, ponto de pedido e rastreadores de viaturas',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Média',
 responsavel: 'Almoxarifado / Logística',
 detalhes: 'Módulo de suprimentos (`/admin/estoque`) com controle quantitativo de CPEs em comodato, bobinas drop e alertas de estoque mínimo, sincronizado com o status e GPS das viaturas de rua.',
 passoAPasso: [
 'Acessar `/admin/estoque` e revisar o saldo de Terminais Ópticos (ONTs).',
 'Conferir alertas de estoque mínimo em vermelho/amarelo.',
 'Verificar a aba de Frota de Viaturas e conferir status "Em rota" e hodômetro.'
 ],
 comandoOuRota: 'GET /api/estoque/materiais & /admin/estoque',
 criterioAceite: 'Inventário consistente com alertas de reposição disparados corretamente.'
 },

 // --- PILAR DE SEGURANÇA & CONFORMIDADE ---
 {
 id: 'sec-sha-audit',
 categoria: 'seguranca',
 titulo: '20. Trilha Forense com Assinatura SHA-256',
 subtitulo: 'Cadeia de custódia inalterável (Append-Only) para todas as ações',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Bloqueante',
 responsavel: 'Segurança da Informação / DPO',
 detalhes: 'Cada ação realizada por operadores e técnicos gera um registro de auditoria imutável com hash criptográfico SHA-256 calculado a partir do timestamp, identificador de usuário, ação e payload.',
 passoAPasso: [
 'Executar qualquer ação no sistema (ex: desbloqueio de cliente ou alteração de Wi-Fi).',
 'Acessar `/admin/auditoria` e verificar o log na tabela com o hash gerado.',
 'Validar o cálculo de integridade através do endpoint de estatísticas.'
 ],
 comandoOuRota: 'GET /api/auditoria/estatisticas',
 criterioAceite: '100% dos eventos com hash SHA-256 único e verificado.',
 testEndpoint: '/api/auditoria/estatisticas'
 },
 {
 id: 'sec-donut-chart',
 categoria: 'seguranca',
 titulo: '21. Gráfico de Rosca Analítico de Ações',
 subtitulo: 'Visão visual consolidada da proporção de acessos, ERP e comandos',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Média',
 responsavel: 'Segurança / DPO',
 detalhes: 'Componente visual Recharts no módulo de Auditoria (`/admin/auditoria`) que agrupa as ações em 4 eixos (Acessos, Configuração SGP, Comandos GenieACS e Disparos de Campanhas), permitindo filtragem rápida com 1 clique.',
 passoAPasso: [
 'Acessar a página de Auditoria (`/admin/auditoria`).',
 'Visualizar o gráfico de rosca no cabeçalho com a proporção de cada tipo.',
 'Clicar em uma categoria para filtrar dinamicamente a tabela forense.'
 ],
 comandoOuRota: 'src/pages/Auditoria.tsx (Recharts PieChart)',
 criterioAceite: 'Distribuição percentual e totalizador central exibidos sem erros visuais.'
 },
 {
 id: 'sec-lgpd-art37',
 categoria: 'seguranca',
 titulo: '22. Conformidade LGPD Art. 37 (Registro de Operações)',
 subtitulo: 'Registro das operações de tratamento de dados pessoais dos assinantes',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Bloqueante',
 responsavel: 'Encarregado DPO / Jurídico',
 detalhes: 'Em total consonância com o Artigo 37 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o sistema registra toda consulta de dados cadastrais, financeiros ou de tráfego, identificando o operador responsável.',
 passoAPasso: [
 'Garantir que acessos à Ficha 360 do assinante gerem log de visualização.',
 'Verificar a sanitização de dados sensíveis na exportação de relatórios.',
 'Gerar o relatório formal de conformidade para o DPO do provedor.'
 ],
 comandoOuRota: 'GET /api/auditoria/exportar?formato=csv',
 criterioAceite: 'Relatório estruturado com operador, IP, data e tipo de tratamento.'
 },
 {
 id: 'sec-marcocivil-art15',
 categoria: 'seguranca',
 titulo: '23. Guarda de Registros (Marco Civil Art. 15)',
 subtitulo: 'Retenção segura de registros de acesso sob sigilo e ambiente controlado',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'TI Provedor / Sysadmin',
 detalhes: 'Cumprimento da obrigação de guardar registros de conexão e acesso a aplicações de internet pelo prazo legal de 1 ano, mantidos sob sigilo e em ambiente controlado no banco de dados local da VPS.',
 passoAPasso: [
 'Validar a persistência contínua dos logs no Firestore/JSON local.',
 'Conferir que nenhum script de limpeza expurga logs antes de 365 dias.',
 'Testar busca de eventos retroativos na tela de auditoria.'
 ],
 comandoOuRota: 'Armazenamento seguro em collection /auditoria',
 criterioAceite: 'Cadeia histórica mantida com retenção mínima de 12 meses.'
 },
 {
 id: 'sec-rbac-hierarchy',
 categoria: 'seguranca',
 titulo: '24. Matriz de Controle de Acesso RBAC em 4 Níveis',
 subtitulo: 'Segregação estrita de privilégios entre Administrador, Operador e Técnicos',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Bloqueante',
 responsavel: 'Super Admin',
 detalhes: 'O acesso ao painel é delimitado por 4 papéis: Admin Geral (irrestrito), Operador (inbox, crm, faturas), Técnico N1/N2 (GenieACS, rede) e Técnico de Campo (exclusivo para OS mobile).',
 passoAPasso: [
 'Acessar `/admin/usuarios` e revisar as permissões de cada perfil.',
 'Efetuar login com usuário Operador e conferir bloqueio das configurações avançadas.',
 'Efetuar login com Técnico de Campo e conferir redirecionamento para `/admin/campo`.'
 ],
 comandoOuRota: 'ProtectedRoute.tsx e AuthContext.tsx',
 criterioAceite: 'Bloqueio de rotas indevidas com mensagem de permissão negada.'
 },
 {
 id: 'sec-nr17-teleatendimento',
 categoria: 'seguranca',
 titulo: '25. Conformidade NR-17 de Teleatendimento',
 subtitulo: 'Controle de pausas regulamentares, fadiga e gestão de filas',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Recursos Humanos / Operação',
 detalhes: 'Painel do operador com controle oficial de status (Disponível, Pausa Lanche, Pausa Banheiro, Treinamento e Em Atendimento), permitindo o cumprimento integral do Anexo II da Norma Regulamentadora nº 17.',
 passoAPasso: [
 'Operador aciona a pausa regulamentar na barra superior.',
 'O sistema pausa a entrega de novas mensagens e chamadas no ramal.',
 'O tempo de pausa é computado e gravado para o relatório de RH.'
 ],
 comandoOuRota: 'src/components/OperatorStatusControl.tsx',
 criterioAceite: 'Registro de tempos de pausa consolidado sem retenção indevida na fila.'
 },
 {
 id: 'sec-backup-disaster',
 categoria: 'seguranca',
 titulo: '26. Rotina de Backup & Recuperação de Desastres',
 subtitulo: 'Geração e restauração de snapshots completos do banco e configurações',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Sysadmin / DevOps',
 detalhes: 'Rotas nativas no Express para geração de snapshot completo em formato JSON criptografado e restauração imediata em caso de falha de hardware na VPS.',
 passoAPasso: [
 'Executar o download do snapshot via endpoint `/api/backup`.',
 'Armazenar o snapshot em local externo seguro (Bucket S3 ou NAS local).',
 'Testar restauração via `POST /api/restore` em ambiente de homologação.'
 ],
 comandoOuRota: 'GET /api/backup & POST /api/restore',
 criterioAceite: 'Download do JSON com dados do provedor em < 5 segundos.',
 testEndpoint: '/api/backup'
 },

 // --- PILAR DE DOCUMENTAÇÃO & OPERAÇÃO ---
 {
 id: 'doc-manual-arquitetura',
 categoria: 'documentacao',
 titulo: '27. Manual Técnico de Arquitetura e Mapa de Portas',
 subtitulo: 'Topologia Debian 12, fluxos Express/Vite e telecomunicações',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Engenharia de Software',
 detalhes: 'Documentação completa no módulo `/admin/ajuda` explicando a arquitetura monorepo Express + Vite, isolamento por VM/VPS, mapeamento de portas e fluxo do agente de voz Gemini.',
 passoAPasso: [
 'Acessar `/admin/ajuda` -> Tópico "Visão Geral & Arquitetura".',
 'Conferir o diagrama de portas e diretórios do projeto.',
 'Verificar a explicação do modelo de soberania de dados do ISP.'
 ],
 comandoOuRota: 'src/pages/Helpers.tsx',
 criterioAceite: 'Manual acessível no painel sem dependência de internet externa.'
 },
 {
 id: 'doc-guia-multierp',
 categoria: 'documentacao',
 titulo: '28. Guia de Integração Multi-ERP e Dicionário de APIs',
 subtitulo: 'Instruções para SGP, MikWeb, IXC Soft e Hubsoft',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'NOC / Integrações',
 detalhes: 'Passo a passo com telas e orientações para geração de tokens de API nos principais ERPs do mercado de telecomunicações brasileiro, incluindo mapeamento de webhooks e tratamento de erros.',
 passoAPasso: [
 'Acessar `/admin/ajuda` -> Tópico "Integração Multi-ERP".',
 'Revisar as instruções específicas do ERP utilizado pelo provedor.',
 'Conferir os comandos cURL sugeridos para validação rápida de chaves.'
 ],
 comandoOuRota: 'src/pages/Helpers.tsx',
 criterioAceite: 'Guia completo com exemplos de payloads e códigos de retorno.'
 },
 {
 id: 'doc-roteiro-operador',
 categoria: 'documentacao',
 titulo: '29. Roteiro de Treinamento dos Atendentes',
 subtitulo: 'Treinamento de uso do Inbox, Kanban de Vendas e CRM 360',
 progresso: 75,
 status: 'em_progresso',
 criticidade: 'Média',
 responsavel: 'Líder de Atendimento',
 detalhes: 'Material didático para capacitação da equipe de atendimento sobre transferência de atendimento humano/IA (Handoff), registro de promessas de pagamento e disparo de PIX.',
 passoAPasso: [
 'Apresentar o painel para a equipe de atendimento.',
 'Realizar simulação de atendimento de cliente sem conexão.',
 'Executar teste de chamada telefônica com atendimento via Webphone.'
 ],
 comandoOuRota: 'Documento de Treinamento Interno do Provedor',
 criterioAceite: 'Equipe de atendimento operando com autonomia de testes.'
 },
 {
 id: 'doc-guia-campo',
 categoria: 'documentacao',
 titulo: '30. Guia Operacional para Técnicos de Campo',
 subtitulo: 'Manual de uso do PWA de Campo, fotos e assinatura de OS',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Média',
 responsavel: 'Coordenador de Campo',
 detalhes: 'Instruções ilustradas para o técnico de rua acessar a rota `/admin/campo`, verificar chamados pendentes, obter rota no Waze/Google Maps e registrar fotos de instalação.',
 passoAPasso: [
 'Revisar o tópico "Técnico de Campo (PWA)" em `/admin/ajuda`.',
 'Treinar os técnicos de campo na instalação do PWA em seus celulares.',
 'Validar o preenchimento do checklist obrigatório de encerramento de OS.'
 ],
 comandoOuRota: 'src/pages/Helpers.tsx',
 criterioAceite: 'Técnicos realizando testes de encerramento de OS em smartphone.'
 },
 {
 id: 'doc-pop-incidentes',
 categoria: 'documentacao',
 titulo: '31. Procedimento Operacional Padrão (POP) para Incidentes NOC',
 subtitulo: 'Avisos em massa em rompimento de fibra e lentidão de trânsito IP',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Gerência NOC',
 detalhes: 'Protocolo formal que orienta o NOC a disparar mensagens de aviso preventivo pelo módulo de Campanhas (`/admin/campanhas`) assim que um alarme de rompimento de fibra óptica for detectado.',
 passoAPasso: [
 'Consultar o modelo de POP de Incidentes em `/admin/ajuda`.',
 'Verificar a seleção de bairros/OLTs afetadas para disparo direcionado.',
 'Simular o disparo de uma mensagem informativa para a base teste.'
 ],
 comandoOuRota: 'src/pages/Helpers.tsx',
 criterioAceite: 'POP homologado pela coordenação do NOC.'
 },
 {
 id: 'doc-termo-aceite',
 categoria: 'documentacao',
 titulo: '32. Termo Formal de Homologação & Aceite da Diretoria',
 subtitulo: 'Autorização institucional para entrada oficial em produção (Go-Live)',
 progresso: 30,
 status: 'pendente_provedor',
 criticidade: 'Bloqueante',
 responsavel: 'Diretoria Executiva / Gerente de TI',
 detalhes: 'Documento formal assinado pela diretoria e responsáveis técnicos atestando que todas as pendências de homologação foram sanadas e autorizando a virada de chave para produção.',
 passoAPasso: [
 'Exportar o Relatório Consolidado de Homologação deste componente.',
 'Apresentar as métricas de validação para a diretoria do provedor.',
 'Coletar as assinaturas e arquivar na pasta de conformidade do ISP.'
 ],
 comandoOuRota: 'Exportar Relatório / Imprimir PDF',
 criterioAceite: 'Termo assinado digitalmente e data de Go-Live definida.'
 },
 {
 id: 'tech-digify-theme',
 categoria: 'tecnica',
 titulo: '33. Design System Digify & Alternador de Tema Claro/Escuro',
 subtitulo: 'Acessibilidade visual, conformidade de contraste e alternância sem recarregar',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Média',
 responsavel: 'Equipe Front-End / UX',
 detalhes: 'Implementação de identidade visual alinhada ao design system da Digify com paleta #0a50ff, suporte dinâmico a tema claro (#ffffff / #f8fafc) e escuro (#0b111e / #101c33), com persistência no localStorage.',
 passoAPasso: [
 'Validar o botão ThemeToggle presente na Topbar e no rodapé da Sidebar.',
 'Verificar a correta alternância de contraste em tabelas, cards e menus.',
 'Conferir a persistência da chave nap_theme ao recarregar o navegador.'
 ],
 comandoOuRota: 'localStorage.getItem("nap_theme")',
 criterioAceite: 'Alternância instantânea de tema em todas as rotas do painel sem travamentos.'
 },
 {
 id: 'tech-kanban-pipelines',
 categoria: 'tecnica',
 titulo: '34. Pipelines de Kanban (Vendas, Suporte N1/N2 e Cobrança)',
 subtitulo: 'Gestão ágil de demandas operacionais com SLA regressivo e triagem IA',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'Operação / Atendimento',
 detalhes: 'Quadro Kanban com 3 funis estratégicos: Vendas/Novas Instalações, Suporte Técnico e Cobrança & Retenção, integrando drag-and-drop de estágios, SLA visual e cartões com valores e planos.',
 passoAPasso: [
 'Acessar /admin/kanban e alternar entre os 3 pipelines no seletor superior.',
 'Arrastar um cartão entre colunas e conferir a atualização de estágio.',
 'Filtrar por operador e checar o indicador de SLA dos chamados.'
 ],
 comandoOuRota: 'GET /admin/kanban',
 criterioAceite: 'Transições suaves de cartões e persistência de status dos chamados.'
 },
 {
 id: 'tech-credenciais-nativas',
 categoria: 'tecnica',
 titulo: '35. Autoconfiguração & Credenciais Nativas de Infraestrutura',
 subtitulo: 'Sincronização 1-clique de Asterisk, GenieACS, Zabbix, Mapa e ERP',
 progresso: 100,
 status: 'concluido',
 criticidade: 'Alta',
 responsavel: 'DevOps / Sysadmin',
 detalhes: 'Garantir que todas as credenciais de infraestrutura nativa (Asterisk 20, GenieACS TR-069, Zabbix 7.0, Mapa OSM/CARTO, SGP e FreeRADIUS) são carregadas automaticamente do host e sincronizadas no painel SuperAdmin.',
 passoAPasso: [
 'Acessar /admin/superadmin?tab=nativos',
 'Clicar em "Preencher Nativos" ou validar carregamento automático das variáveis de ambiente',
 'Executar testes de conectividade para cada microsserviço nativo'
 ],
 comandoOuRota: 'GET /api/configuracoes/nativas & POST /api/configuracoes/restaurar-nativos',
 criterioAceite: 'Status de todos os serviços nativos indicando "conectado" ou "configurado" com métricas de latência válidas.',
 testEndpoint: '/api/configuracoes/nativas'
 }
];

export default function ChecklistHomologacao() {
 const [itens, setItens] = useState<ItemHomologacao[]>(() => {
 try {
 const salvo = localStorage.getItem('nap_homologacao_checklist_v2');
 if (salvo) {
 const parsed: ItemHomologacao[] = JSON.parse(salvo);
 const idsExistentes = new Set(parsed.map(p => p.id));
 const novosItens = ITENS_HOMOLOGACAO_PADRAO.filter(item => !idsExistentes.has(item.id));
 return [...parsed, ...novosItens];
 }
 } catch (e) {
 console.warn('Erro ao carregar checklist do localStorage', e);
 }
 return ITENS_HOMOLOGACAO_PADRAO;
 });

 const [filtroCategoria, setFiltroCategoria] = useState<'todos' | CategoriaHomologacao>('todos');
 const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusHomologacao | 'bloqueantes'>('todos');
 const [busca, setBusca] = useState<string>('');
 const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
 const [testandoTudo, setTestandoTudo] = useState<boolean>(false);
 const [ultimoDiagnostico, setUltimoDiagnostico] = useState<string | null>(null);
 const [copiado, setCopiado] = useState<string | null>(null);

 // Salva alterações no localStorage
 useEffect(() => {
 try {
 localStorage.setItem('nap_homologacao_checklist_v2', JSON.stringify(itens));
 } catch (e) {
 console.warn('Erro ao salvar checklist no localStorage', e);
 }
 }, [itens]);

 // Alterna expansão de detalhes de um item
 const toggleExpandir = (id: string) => {
 setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
 };

 // Expande ou recolhe todos
 const toggleExpandirTodos = () => {
 const todosExpandidos = Object.keys(expandidos).length === itens.length && Object.values(expandidos).every(Boolean);
 if (todosExpandidos) {
 setExpandidos({});
 } else {
 const novo: Record<string, boolean> = {};
 itens.forEach(i => { novo[i.id] = true; });
 setExpandidos(novo);
 }
 };

 // Altera o progresso numérico de um item e atualiza o status de forma inteligente
 const atualizarProgresso = (id: string, novoProgresso: number) => {
 setItens(prev => prev.map(item => {
 if (item.id !== id) return item;
 let novoStatus = item.status;
 if (novoProgresso === 100) {
 novoStatus = 'concluido';
 } else if (novoProgresso > 0 && novoStatus === 'concluido') {
 novoStatus = 'em_progresso';
 }
 return {
 ...item,
 progresso: novoProgresso,
 status: novoStatus
 };
 }));
 };

 // Alterna o status diretamente
 const atualizarStatus = (id: string, novoStatus: StatusHomologacao) => {
 setItens(prev => prev.map(item => {
 if (item.id !== id) return item;
 let novoProgresso = item.progresso;
 if (novoStatus === 'concluido') novoProgresso = 100;
 if (novoStatus === 'bloqueado') novoProgresso = 0;
 if (novoStatus === 'em_progresso' && novoProgresso === 0) novoProgresso = 50;
 return {
 ...item,
 status: novoStatus,
 progresso: novoProgresso
 };
 }));
 };

 // Executa diagnóstico automático contra as rotas reais do backend
 const executarDiagnosticoLive = async () => {
 setTestandoTudo(true);
 const endpointsParaTestar = [
 { id: 'tech-systemd-daemon', url: '/api/health' },
 { id: 'tech-erp-creds', url: '/api/configuracoes' },
 { id: 'tech-erp-consulta', url: '/api/contatos' },
 { id: 'tech-erp-pix', url: '/api/sgp/faturas' },
 { id: 'tech-genieacs-cwmp', url: '/api/genieacs/devices' },
 { id: 'tech-pwa-mobile', url: '/api/tecnicos/os' },
 { id: 'sec-sha-audit', url: '/api/auditoria/estatisticas' },
 { id: 'sec-backup-disaster', url: '/api/backup' }
 ];

 const resultados: Record<string, { ok: boolean; status: string }> = {};

 for (const ep of endpointsParaTestar) {
 try {
 const inicio = performance.now();
 const res = await fetch(ep.url, { method: 'GET', headers: { 'Accept': 'application/json' } });
 const fim = performance.now();
 const ms = Math.round(fim - inicio);
 if (res.ok) {
 resultados[ep.id] = { ok: true, status: `HTTP ${res.status} (${ms}ms) - Operacional` };
 } else {
 resultados[ep.id] = { ok: false, status: `HTTP ${res.status} (${ms}ms) - Retorno com erro` };
 }
 } catch (err: any) {
 resultados[ep.id] = { ok: false, status: `Falha na conexão: ${err.message || 'Timeout'}` };
 }
 }

 setItens(prev => prev.map(item => {
 const res = resultados[item.id];
 if (!res) return item;
 return {
 ...item,
 progresso: res.ok ? 100 : item.progresso,
 status: res.ok ? 'concluido' : item.status,
 ultimoTesteTimestamp: new Date().toLocaleTimeString('pt-BR'),
 resultadoTeste: res.status
 };
 }));

 setUltimoDiagnostico(new Date().toLocaleTimeString('pt-BR'));
 setTestandoTudo(false);
 };

 // Restaura padrão inicial
 const restaurarPadrao = () => {
 if (window.confirm('Deseja realmente restaurar os itens do checklist para os valores originais?')) {
 setItens(ITENS_HOMOLOGACAO_PADRAO);
 localStorage.removeItem('nap_homologacao_checklist_v2');
 }
 };

 // Métricas Consolidadas Gerais e por Pilar
 const metricas = useMemo(() => {
 const totalItens = itens.length;
 const somaProgresso = itens.reduce((acc, i) => acc + i.progresso, 0);
 const progressoGeral = Math.round(somaProgresso / totalItens);
 const concluidos = itens.filter(i => i.progresso === 100 || i.status === 'concluido').length;
 const emProgresso = itens.filter(i => i.status === 'em_progresso').length;
 const pendentesProvedor = itens.filter(i => i.status === 'pendente_provedor').length;
 const bloqueantesPendentes = itens.filter(i => i.criticidade === 'Bloqueante' && i.progresso < 100).length;

 // Métricas por Pilar
 const calcPilar = (cat: CategoriaHomologacao) => {
 const grupo = itens.filter(i => i.categoria === cat);
 const total = grupo.length;
 const soma = grupo.reduce((acc, i) => acc + i.progresso, 0);
 const perc = total > 0 ? Math.round(soma / total) : 0;
 const prontos = grupo.filter(i => i.progresso === 100).length;
 return { total, perc, prontos };
 };

 return {
 totalItens,
 progressoGeral,
 concluidos,
 emProgresso,
 pendentesProvedor,
 bloqueantesPendentes,
 tecnica: calcPilar('tecnica'),
 seguranca: calcPilar('seguranca'),
 documentacao: calcPilar('documentacao')
 };
 }, [itens]);

 // Itens Filtrados
 const itensFiltrados = useMemo(() => {
 return itens.filter(item => {
 // Filtro de Categoria
 if (filtroCategoria !== 'todos' && item.categoria !== filtroCategoria) return false;

 // Filtro de Status
 if (filtroStatus === 'bloqueantes') {
 if (item.criticidade !== 'Bloqueante' || item.progresso === 100) return false;
 } else if (filtroStatus !== 'todos' && item.status !== filtroStatus) {
 return false;
 }

 // Filtro de Busca
 if (busca.trim()) {
 const q = busca.toLowerCase();
 const noTitulo = item.titulo.toLowerCase().includes(q);
 const noSub = item.subtitulo.toLowerCase().includes(q);
 const nosDetalhes = item.detalhes.toLowerCase().includes(q);
 const noResp = item.responsavel.toLowerCase().includes(q);
 const noCmd = item.comandoOuRota.toLowerCase().includes(q);
 return noTitulo || noSub || nosDetalhes || noResp || noCmd;
 }

 return true;
 });
 }, [itens, filtroCategoria, filtroStatus, busca]);

 // Exportar Relatório em Markdown
 const exportarMarkdown = () => {
 let md = `# RELATÓRIO OFICIAL DE HOMOLOGAÇÃO & GO-LIVE - DJD CRM OMNICHANNEL\n`;
 md += `Data da Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
 md += `Status Geral de Prontidão: ${metricas.progressoGeral}%\n`;
 md += `Itens Concluídos: ${metricas.concluidos} de ${metricas.totalItens}\n`;
 md += `Pendências Bloqueantes Restantes: ${metricas.bloqueantesPendentes}\n\n`;

 md += `## RESUMO EXECUTIVO POR PILAR\n`;
 md += `- **Pilar Técnico & Conectores:** ${metricas.tecnica.perc}% (${metricas.tecnica.prontos}/${metricas.tecnica.total} concluídos)\n`;
 md += `- **Pilar de Segurança & LGPD:** ${metricas.seguranca.perc}% (${metricas.seguranca.prontos}/${metricas.seguranca.total} concluídos)\n`;
 md += `- **Pilar de Documentação & Aceite:** ${metricas.documentacao.perc}% (${metricas.documentacao.prontos}/${metricas.documentacao.total} concluídos)\n\n`;

 const categorias: { key: CategoriaHomologacao; label: string }[] = [
 { key: 'tecnica', label: '1. PENDÊNCIAS TÉCNICAS, REDE & CONECTORES' },
 { key: 'seguranca', label: '2. SEGURANÇA DA INFORMAÇÃO & CONFORMIDADE LGPD' },
 { key: 'documentacao', label: '3. DOCUMENTAÇÃO, TREINAMENTO & HOMOLOGAÇÃO FORMAL' }
 ];

 categorias.forEach(cat => {
 md += `## ${cat.label}\n`;
 const itensCat = itens.filter(i => i.categoria === cat.key);
 itensCat.forEach(item => {
 const check = item.progresso === 100 ? '[x]' : '[ ]';
 md += `${check} **${item.titulo}** (${item.progresso}% - ${item.status.toUpperCase()})\n`;
 md += ` - Criticidade: ${item.criticidade} | Responsável: ${item.responsavel}\n`;
 md += ` - Detalhe: ${item.detalhes}\n`;
 md += ` - Verificação: \`${item.comandoOuRota}\`\n`;
 md += ` - Critério de Aceite: ${item.criterioAceite}\n\n`;
 });
 });

 md += `---\n*Documento gerado pelo Módulo de Homologação do DJD para fins de auditoria e liberação de Go-Live.*`;

 navigator.clipboard.writeText(md);
 setCopiado('md');
 setTimeout(() => setCopiado(null), 3000);
 };

 // Cor e Estilo da Barra de Progresso Individual
 const getCorBarra = (p: number) => {
 if (p === 100) return 'bg-emerald-500';
 if (p >= 60) return 'bg-blue-500';
 if (p >= 30) return 'bg-amber-500';
 return 'bg-rose-500';
 };

 // Cor do Badge de Status
 const getBadgeStatus = (status: StatusHomologacao, progresso: number) => {
 if (progresso === 100 || status === 'concluido') {
 return {
 label: '100% Concluído',
 bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 };
 }
 if (status === 'em_progresso') {
 return {
 label: 'Em Andamento',
 bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
 };
 }
 if (status === 'pendente_provedor') {
 return {
 label: 'Pendente no Provedor',
 bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
 };
 }
 return {
 label: 'Bloqueado',
 bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
 };
 };

 return (
 <div id="checklist-homologacao-container" className="space-y-6 text-card-foreground">
 
 {/* PAINEL DE CABEÇALHO & PROGRESSO GERAL CONSOLIDADO */}
 <div className="p-6 bg-background border border-border rounded-3xl space-y-6 shadow-xl">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
 Matriz de Homologação & Go-Live v2.6
 </span>
 {ultimoDiagnostico && (
 <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
 <Clock size={11} /> Testado às {ultimoDiagnostico}
 </span>
 )}
 </div>
 <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1.5 flex items-center gap-2.5">
 <ClipboardCheck className="text-emerald-400" size={24} />
 Checklist Oficial de Homologação do Provedor
 </h2>
 <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
 Consolidação técnica de requisitos de <strong>Infraestrutura</strong>, <strong>Segurança & LGPD</strong> e <strong>Documentação Operacional</strong> necessários para homologação em Staging e autorização do lançamento oficial em produção.
 </p>
 </div>

 {/* Botões de Ação Global */}
 <div className="flex flex-wrap items-center gap-2 shrink-0">
 <button
 type="button"
 id="btn-diagnostico-live"
 onClick={executarDiagnosticoLive}
 disabled={testandoTudo}
 className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
 >
 <RefreshCw size={14} className={testandoTudo ? 'animate-spin' : ''} />
 <span>{testandoTudo ? 'Testando Endpoints...' : 'Diagnóstico Live de APIs'}</span>
 </button>

 <button
 type="button"
 id="btn-exportar-markdown"
 onClick={exportarMarkdown}
 className="px-3 py-2 bg-white/5 hover:bg-accent text-muted-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-border"
 title="Copiar relatório completo formatado em Markdown"
 >
 {copiado === 'md' ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
 <span>{copiado === 'md' ? 'Copiado!' : 'Exportar Markdown'}</span>
 </button>

 <button
 type="button"
 id="btn-imprimir-termo"
 onClick={() => window.print()}
 className="px-3 py-2 bg-white/5 hover:bg-accent text-muted-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-border"
 title="Imprimir / Salvar em PDF"
 >
 <Printer size={14} />
 <span className="hidden sm:inline">Imprimir</span>
 </button>

 <button
 type="button"
 id="btn-restaurar-checklist"
 onClick={restaurarPadrao}
 className="p-2 bg-white/5 hover:bg-accent text-muted-foreground hover:text-card-foreground rounded-xl transition-all border border-border"
 title="Restaurar padrão inicial"
 >
 <RotateCcw size={14} />
 </button>
 </div>
 </div>

 {/* BARRA DE PROGRESSO GERAL & KPI'S */}
 <div className="space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
 <div className="flex items-center gap-2">
 <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">Prontidão Geral para Go-Live:</span>
 <span className="text-sm font-black font-mono text-emerald-400">{metricas.progressoGeral}%</span>
 </div>
 <div className="flex items-center gap-4 text-muted-foreground text-[11px] font-mono">
 <span className="text-emerald-400 font-bold">{metricas.concluidos} Concluídos</span>
 <span className="text-amber-400 font-bold">{metricas.pendentesProvedor} Pendências Provedor</span>
 {metricas.bloqueantesPendentes > 0 ? (
 <span className="text-rose-400 font-bold flex items-center gap-1">
 <AlertTriangle size={12} /> {metricas.bloqueantesPendentes} Bloqueantes
 </span>
 ) : (
 <span className="text-emerald-400 font-bold flex items-center gap-1">
 <CheckCircle2 size={12} /> 0 Bloqueios Críticos
 </span>
 )}
 </div>
 </div>

 {/* Barra Visual de Progresso Global */}
 <div className="w-full h-3.5 bg-background rounded-full overflow-hidden p-0.5 border border-border relative">
 <div 
 className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"
 style={{ width: `${metricas.progressoGeral}%` }}
 />
 </div>
 </div>

 {/* OS 3 PILARES FUNDAMENTAIS COM PROGRESSO VISUAL PRÓPRIO */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
 {/* Card Pilar Técnico */}
 <div 
 onClick={() => setFiltroCategoria(filtroCategoria === 'tecnica' ? 'todos' : 'tecnica')}
 className={`p-4 rounded-2xl border cursor-pointer transition-all ${
 filtroCategoria === 'tecnica'
 ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
 : 'bg-background border-border hover:border-white/15'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
 <Server size={16} /> Pilar Técnico & Rede
 </div>
 <span className="text-xs font-black font-mono text-foreground">{metricas.tecnica.perc}%</span>
 </div>
 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
 <div 
 className="h-full bg-blue-500 transition-all duration-300"
 style={{ width: `${metricas.tecnica.perc}%` }}
 />
 </div>
 <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
 <span>{metricas.tecnica.prontos} de {metricas.tecnica.total} validados</span>
 <span className="text-blue-400">15 itens</span>
 </div>
 </div>

 {/* Card Pilar Segurança & LGPD */}
 <div 
 onClick={() => setFiltroCategoria(filtroCategoria === 'seguranca' ? 'todos' : 'seguranca')}
 className={`p-4 rounded-2xl border cursor-pointer transition-all ${
 filtroCategoria === 'seguranca'
 ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
 : 'bg-background border-border hover:border-white/15'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
 <ShieldCheck size={16} /> Segurança & LGPD
 </div>
 <span className="text-xs font-black font-mono text-foreground">{metricas.seguranca.perc}%</span>
 </div>
 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
 <div 
 className="h-full bg-emerald-500 transition-all duration-300"
 style={{ width: `${metricas.seguranca.perc}%` }}
 />
 </div>
 <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
 <span>{metricas.seguranca.prontos} de {metricas.seguranca.total} validados</span>
 <span className="text-emerald-400">7 itens</span>
 </div>
 </div>

 {/* Card Pilar Documentação & Operação */}
 <div 
 onClick={() => setFiltroCategoria(filtroCategoria === 'documentacao' ? 'todos' : 'documentacao')}
 className={`p-4 rounded-2xl border cursor-pointer transition-all ${
 filtroCategoria === 'documentacao'
 ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30'
 : 'bg-background border-border hover:border-white/15'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
 <FileText size={16} /> Documentação & Aceite
 </div>
 <span className="text-xs font-black font-mono text-foreground">{metricas.documentacao.perc}%</span>
 </div>
 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
 <div 
 className="h-full bg-purple-500 transition-all duration-300"
 style={{ width: `${metricas.documentacao.perc}%` }}
 />
 </div>
 <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
 <span>{metricas.documentacao.prontos} de {metricas.documentacao.total} validados</span>
 <span className="text-purple-400">6 itens</span>
 </div>
 </div>
 </div>
 </div>

 {/* BARRA DE FILTROS, BUSCA & VISIBILIDADE */}
 <div className="p-4 bg-background border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
 {/* Filtros Rápidos de Status */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
 <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
 <Filter size={12} /> Status:
 </span>
 <button
 type="button"
 onClick={() => setFiltroStatus('todos')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 filtroStatus === 'todos' ? 'bg-blue-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Todos ({itens.length})
 </button>
 <button
 type="button"
 onClick={() => setFiltroStatus('pendente_provedor')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 filtroStatus === 'pendente_provedor' ? 'bg-amber-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Pendentes no Provedor ({metricas.pendentesProvedor})
 </button>
 <button
 type="button"
 onClick={() => setFiltroStatus('concluido')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 filtroStatus === 'concluido' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 100% Concluídos ({metricas.concluidos})
 </button>
 <button
 type="button"
 onClick={() => setFiltroStatus('bloqueantes')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 filtroStatus === 'bloqueantes' ? 'bg-rose-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Bloqueantes ({metricas.bloqueantesPendentes})
 </button>
 </div>

 {/* Busca e Toggle Expandir Todos */}
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 id="input-busca-homologacao"
 value={busca}
 onChange={(e) => setBusca(e.target.value)}
 placeholder="Buscar SSL, WABA, LGPD, PIX..."
 className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder-slate-500 outline-none focus:border-blue-500 transition-all"
 />
 </div>

 <button
 type="button"
 onClick={toggleExpandirTodos}
 className="px-2.5 py-1.5 bg-white/5 hover:bg-accent text-muted-foreground rounded-xl text-xs font-bold transition-all shrink-0 border border-border"
 title="Expandir ou recolher todos os itens"
 >
 {Object.keys(expandidos).length === itens.length ? 'Recolher Todos' : 'Expandir Todos'}
 </button>
 </div>
 </div>

 {/* LISTAGEM DOS ITENS CONSOLIDADOS COM STATUS DE PROGRESSO VISUAL */}
 <div className="space-y-3">
 {itensFiltrados.map((item) => {
 const isExpandido = !!expandidos[item.id];
 const badge = getBadgeStatus(item.status, item.progresso);

 return (
 <div
 key={item.id}
 id={`item-${item.id}`}
 className={`rounded-2xl border transition-all ${
 item.progresso === 100
 ? 'bg-background border-border hover:border-border'
 : item.status === 'pendente_provedor'
 ? 'bg-background border-amber-500/20 hover:border-amber-500/30'
 : 'bg-background border-rose-500/20 hover:border-rose-500/30'
 }`}
 >
 {/* Linha Principal do Item */}
 <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 
 {/* Lado Esquerdo: Checkbox, Títulos e Tags */}
 <div className="flex items-start gap-3.5 flex-1 min-w-0">
 {/* Botão de Toggle de Conclusão Rápida */}
 <button
 type="button"
 onClick={() => atualizarProgresso(item.id, item.progresso === 100 ? 0 : 100)}
 className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
 item.progresso === 100
 ? 'bg-emerald-500 border-emerald-500 text-black shadow-sm shadow-emerald-500/20'
 : 'bg-white/5 border-border hover:border-white/40 text-transparent'
 }`}
 title={item.progresso === 100 ? 'Marcar como pendente' : 'Marcar como 100% concluído'}
 >
 <Check size={14} className="stroke-[3]" />
 </button>

 <div className="space-y-1 min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
 {item.categoria === 'tecnica' ? 'Técnico' : item.categoria === 'seguranca' ? 'Segurança' : 'Documentação'}
 </span>
 
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
 {badge.label}
 </span>

 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 item.criticidade === 'Bloqueante'
 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
 : item.criticidade === 'Alta'
 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
 }`}>
 {item.criticidade}
 </span>

 {item.resultadoTeste && (
 <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
 {item.resultadoTeste}
 </span>
 )}
 </div>

 <h3 className="text-sm font-bold text-foreground leading-snug">
 {item.titulo}
 </h3>

 <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
 {item.subtitulo}
 </p>
 </div>
 </div>

 {/* Lado Direito: Barra de Progresso Visual Individual e Ações */}
 <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
 
 {/* Bloco de Progresso Visual Individual */}
 <div className="w-44 space-y-1.5">
 <div className="flex items-center justify-between text-[11px] font-mono">
 <span className="text-muted-foreground">Progresso:</span>
 <span className={`font-bold ${item.progresso === 100 ? 'text-emerald-400' : 'text-foreground'}`}>
 {item.progresso}%
 </span>
 </div>

 {/* Barra Visual com Código de Cores */}
 <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border p-0.5">
 <div 
 className={`h-full rounded-full transition-all duration-300 ${getCorBarra(item.progresso)}`}
 style={{ width: `${item.progresso}%` }}
 />
 </div>

 {/* Botões Rápidos de Escala de Progresso */}
 <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-0.5">
 <button type="button" onClick={() => atualizarProgresso(item.id, 0)} className="hover:text-foreground px-1">0%</button>
 <button type="button" onClick={() => atualizarProgresso(item.id, 50)} className="hover:text-foreground px-1">50%</button>
 <button type="button" onClick={() => atualizarProgresso(item.id, 75)} className="hover:text-foreground px-1">75%</button>
 <button type="button" onClick={() => atualizarProgresso(item.id, 100)} className="hover:text-foreground px-1 font-bold text-emerald-400">100%</button>
 </div>
 </div>

 {/* Responsável e Botão de Expandir */}
 <div className="flex items-center gap-3">
 <div className="text-right hidden sm:block">
 <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Responsável</span>
 <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{item.responsavel}</span>
 </div>

 <button
 type="button"
 onClick={() => toggleExpandir(item.id)}
 className="p-2 rounded-xl bg-white/5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
 title={isExpandido ? 'Recolher detalhes' : 'Ver guia passo a passo'}
 >
 {isExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
 </button>
 </div>
 </div>
 </div>

 {/* DETALHES EXPANDIDOS COM PASSO A PASSO, COMANDO E CRITÉRIO DE ACEITE */}
 {isExpandido && (
 <div className="p-4 sm:p-5 bg-background border-t border-border rounded-b-2xl space-y-4 text-xs">
 
 {/* Descrição Detalhada */}
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
 Contexto & Justificativa Técnica:
 </h4>
 <p className="text-muted-foreground leading-relaxed">
 {item.detalhes}
 </p>
 </div>

 {/* Passo a Passo de Resolução */}
 <div>
 <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2">
 Passo a Passo de Execução:
 </h4>
 <ol className="space-y-1.5 list-decimal pl-4 text-muted-foreground">
 {item.passoAPasso.map((passo, idx) => (
 <li key={idx} className="leading-relaxed">
 {passo}
 </li>
 ))}
 </ol>
 </div>

 {/* Comando / Rota e Critério de Aceite */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
 <div className="p-3 bg-background border border-border rounded-xl space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] uppercase font-bold text-muted-foreground">Comando / Rota de Teste:</span>
 <button
 type="button"
 onClick={() => {
 navigator.clipboard.writeText(item.comandoOuRota);
 setCopiado(item.id);
 setTimeout(() => setCopiado(null), 2500);
 }}
 className="text-[10px] text-blue-400 hover:text-blue-300 font-sans font-bold flex items-center gap-1"
 >
 {copiado === item.id ? <Check size={12} /> : <Copy size={12} />}
 <span>{copiado === item.id ? 'Copiado!' : 'Copiar'}</span>
 </button>
 </div>
 <code className="text-xs font-mono text-emerald-400 block break-all">
 {item.comandoOuRota}
 </code>
 </div>

 <div className="p-3 bg-background border border-border rounded-xl space-y-1">
 <span className="text-[10px] uppercase font-bold text-emerald-400 block">Critério de Aceite Formal:</span>
 <p className="text-muted-foreground leading-relaxed font-sans">
 {item.criterioAceite}
 </p>
 </div>
 </div>

 {/* Alterar Status Manualmente */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-muted-foreground">Definir Status Manual:</span>
 <button
 type="button"
 onClick={() => atualizarStatus(item.id, 'concluido')}
 className={`px-2 py-1 rounded text-[10px] font-bold ${
 item.status === 'concluido' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Concluído
 </button>
 <button
 type="button"
 onClick={() => atualizarStatus(item.id, 'em_progresso')}
 className={`px-2 py-1 rounded text-[10px] font-bold ${
 item.status === 'em_progresso' ? 'bg-blue-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Em Andamento
 </button>
 <button
 type="button"
 onClick={() => atualizarStatus(item.id, 'pendente_provedor')}
 className={`px-2 py-1 rounded text-[10px] font-bold ${
 item.status === 'pendente_provedor' ? 'bg-amber-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Pendente Provedor
 </button>
 <button
 type="button"
 onClick={() => atualizarStatus(item.id, 'bloqueado')}
 className={`px-2 py-1 rounded text-[10px] font-bold ${
 item.status === 'bloqueado' ? 'bg-rose-600 text-white' : 'bg-white/5 text-muted-foreground hover:text-white'
 }`}
 >
 Bloqueado
 </button>
 </div>

 <span className="text-[10px] text-muted-foreground font-mono">
 ID: {item.id}
 </span>
 </div>
 </div>
 )}
 </div>
 );
 })}

 {itensFiltrados.length === 0 && (
 <div className="p-8 text-center bg-background border border-border rounded-2xl text-muted-foreground">
 <ClipboardCheck size={32} className="mx-auto mb-2 text-muted-foreground" />
 <p className="text-sm font-semibold text-foreground">Nenhum item encontrado com os filtros atuais.</p>
 <p className="text-xs text-muted-foreground mt-1">Experimente limpar o campo de busca ou selecionar "Todos os Status".</p>
 </div>
 )}
 </div>

 </div>
 );
}
