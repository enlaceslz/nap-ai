import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle2, Circle, AlertCircle, Search, 
  Terminal, ShieldCheck, Database, Server, Smartphone, 
  Cpu, Zap, Layers, FileText, ChevronRight, Download,
  UserCheck, CreditCard, Building2, X, Copy, Check, Radio,
  Lock, RefreshCw, ExternalLink, Network, Activity, LifeBuoy
} from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import C6BankProcedimentosGuia from '../components/customer360/C6BankProcedimentosGuia';

export default function Ajuda() {
  const { config } = useConfig();
  const [activeTab, setActiveTab] = useState<'matriz' | 'manuais' | 'deploy'>('matriz');
  const [showC6Guide, setShowC6Guide] = useState(false);
  const [showDeployMdModal, setShowDeployMdModal] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const matrixStaging = [
    { module: 'Customer 360 & C6 Bank (Pix mTLS)', status: 'done', desc: 'Vinculação visual segura C6 Bank (336), Handshake mTLS, Webhook Pix v2 e Reconciliação', date: 'Homologado' },
    { module: 'SGP Baixa Automática & Enlace-Pay', status: 'done', desc: 'Baixa instantânea via Webhook Pix, emissão de recibo no SGP e fila de contingência resiliente', date: 'Homologado' },
    { module: 'Centro de Controle NOC & Zabbix 7.0 LTS', status: 'done', desc: 'Telemetria em tempo real, reconhecimento de alarmes (Ack), tráfego agregado e OLTs', date: 'Homologado' },
    { module: 'Help Desk Central (Zammad Engine)', status: 'done', desc: 'Orquestração unificada de chamados com SLA, matriz de transição e vinculação de assinantes', date: 'Homologado' },
    { module: 'IPAM & Nautobot Source of Truth', status: 'done', desc: 'Alocação de prefixos IPv4/IPv6, binding com ERP e provisionamento automatizado de sub-redes', date: 'Homologado' },
    { module: 'WABA & Inbox Unificado', status: 'done', desc: 'Integração Oficial WhatsApp Cloud API, Triagem IA Gemini e Handoff com Kanban SGP', date: 'Homologado' },
    { module: 'Cérebro IA (MaIA) & 9router Gateway', status: 'done', desc: 'Google Gemini 2.5 Flash com failover automático corporativo e chamadas dinâmicas de ferramentas', date: 'Homologado' },
    { module: 'CRM Kanban & Ficha 360', status: 'done', desc: 'Sincronização 360 de clientes, promessas de pagamento, PIX dinâmico e desbloqueio em confiança', date: 'Homologado' },
    { module: 'Multi-ERP Hub (SGP, IXC, Hubsoft)', status: 'done', desc: 'Adaptadores modulares para leitura de faturas, contratos, extratos e baixa contábil', date: 'Homologado' },
    { module: 'GenieACS & TR-069 CWMP', status: 'done', desc: 'Telemetria de CPEs, diagnóstico óptico de ONU, alteração de Wi-Fi e reboot remoto', date: 'Homologado' },
    { module: 'Régua de Cobrança & Campanhas ISP', status: 'done', desc: 'Automação de notificações de vencimento D-3, D0, D+3, D+7 via WABA e push notification', date: 'Homologado' },
    { module: 'Portal do Cliente PWA & Webphone WebRTC', status: 'done', desc: 'Autoatendimento mobile-first, 2ª via Pix, teste de conexão e chamadas de voz via Asterisk WSS', date: 'Homologado' },
    { module: 'Técnico de Campo PWA & Geolocalização', status: 'done', desc: 'Gestão de Ordens de Serviço na rua, fotos de instalação, teste de sinal e GPS no Radar do NOC', date: 'Homologado' },
    { module: 'Auditoria LGPD & Hierarquia de Usuários', status: 'done', desc: 'Controle de acesso em 4 níveis (Admin, Operador, N1, N2), logs imutáveis e Soft Deletes', date: 'Homologado' }
  ];

  const officialPorts = [
    { port: '80 / 443', proto: 'TCP', service: 'Nginx Reverse Proxy', desc: 'Tráfego Web HTTPS com SSL Let\'s Encrypt e Webhooks mTLS' },
    { port: '3000', proto: 'TCP', service: 'Node.js (Express API)', desc: 'Backend unificado do NAP e fallback de SPA Vite' },
    { port: '5432', proto: 'TCP', service: 'PostgreSQL 16+', desc: 'Banco de dados relacional oficial com Drizzle ORM' },
    { port: '5060 / 5061', proto: 'TCP / UDP', service: 'Asterisk SIP PABX', desc: 'Sinalização SIP para ramais físicos e softphones de atendimento' },
    { port: '8089', proto: 'TCP', service: 'Asterisk WebRTC (WSS)', desc: 'Canal WebSocket seguro para o Webphone do Portal do Cliente' },
    { port: '10000-20000', proto: 'UDP', service: 'Asterisk RTP', desc: 'Fluxo de pacotes de áudio e voz em tempo real' },
    { port: '7547 / 7567', proto: 'TCP', service: 'GenieACS CWMP', desc: 'Comunicação remota TR-069 com ONTs e roteadores dos clientes' },
    { port: '3005', proto: 'TCP', service: 'GenieACS Web UI', desc: 'Painel administrativo de parâmetros TR-069' },
    { port: '10050', proto: 'TCP', service: 'Zabbix Agent', desc: 'Coleta de métricas locais da máquina servidora' },
    { port: '10051', proto: 'TCP', service: 'Zabbix Server', desc: 'Telemetria do NOC, recepção de traps e alarmes de OLTs' },
    { port: '3799', proto: 'UDP', service: 'Radius CoA / PoD', desc: 'Desconexão e kick imediato de sessão PPPoE nos BNGs MikroTik/Huawei' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'wip': return <AlertCircle size={18} className="text-amber-500 shrink-0" />;
      default: return <Circle size={18} className="text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
              <BookOpen className="text-blue-500" size={30} />
              Central de Ajuda &amp; Homologação
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Documentação técnica, guias operacionais, matriz de prontidão (UAT) e manuais de deploy para provedores de Internet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowC6Guide(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
            >
              <Building2 size={15} className="text-amber-400" />
              Guia C6 Bank PJ
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Terminal size={15} />
              Instruções de Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-px">
        <button 
          onClick={() => setActiveTab('matriz')}
          className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'matriz' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2"><CheckCircle2 size={17} /> Matriz de Homologação (UAT)</div>
        </button>
        <button 
          onClick={() => setActiveTab('manuais')}
          className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'manuais' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2"><FileText size={17} /> Guias Operacionais</div>
        </button>
        <button 
          onClick={() => setActiveTab('deploy')}
          className={`pb-3 px-1 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'deploy' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2"><Terminal size={17} /> Deploy &amp; Arquitetura (Debian 12)</div>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* Matriz de Homologação */}
        {activeTab === 'matriz' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border bg-muted/30 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-card-foreground">Prontidão do Sistema (Staging / Production)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Status de validação técnica e homologação dos módulos arquitetônicos do NAP.</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20">
                <CheckCircle2 size={14} /> 100% Homologado (Pronto para Operação)
              </div>
            </div>
            <div className="divide-y divide-border">
              {matrixStaging.map((item, i) => (
                <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                    <div>
                      <h3 className="font-semibold text-card-foreground text-sm">{item.module}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold whitespace-nowrap border border-emerald-500/20">
                    {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guias Operacionais */}
        {activeTab === 'manuais' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card C6 Bank */}
            <div 
              onClick={() => setShowC6Guide(true)}
              className="bg-card border border-border p-6 rounded-xl hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-bold text-card-foreground">C6 Bank (Pix mTLS)</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300">
                  Passo a Passo
                </span>
              </div>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Manual com telas do Internet Banking C6 Empresas PJ para emissão de chaves de API, download de certificados mTLS (.crt/.pem) e cadastro de Webhook.
              </p>
              <div className="flex items-center text-amber-400 text-xs font-semibold">
                Abrir guia visual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card Customer 360 & Enlace-Pay */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <UserCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">Customer 360 &amp; Enlace-Pay</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Conciliação bancária de Pix (C6 Bank), espelho operacional resiliente, baixa instantânea no SGP, detecção de divergências e fila de contingência.
              </p>
              <div className="flex items-center text-emerald-400 text-xs font-semibold">
                Ler documentação <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card NOC Zabbix & OLTs */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">NOC Zabbix 7.0 &amp; Infra</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Integração com Zabbix Server (10051) e Agent (10050), auditoria de confirmações de alarme (Ack), gráfico de tráfego agregado IX.br/CDN e monitoramento de OLTs.
              </p>
              <div className="flex items-center text-cyan-400 text-xs font-semibold">
                Ler especificações <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card Cérebro IA */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Cpu size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">Cérebro IA &amp; 9router Gateway</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Estratégia de uso do Gemini 2.5 Flash gratuito com failover corporativo 9router, tolerância a Erro 429, chamadas de ferramentas e handoff humano.
              </p>
              <div className="flex items-center text-indigo-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card WABA */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">WABA &amp; Inbox Unificado</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Configuração da Meta WhatsApp Cloud API, sincronização de Webhook, envio de PIX automático e transferência inteligente de atendimento (Handoff).
              </p>
              <div className="flex items-center text-blue-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card Multi-ERP Hub */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Server size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">Multi-ERP Hub (SGP / IXC / Hubsoft)</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Conexão com os BSS líderes de mercado, parametrização da régua de cobrança automática (D-3 a D+7) e conciliação contábil via API REST.
              </p>
              <div className="flex items-center text-purple-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card IPAM */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <Network size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">IPAM &amp; Nautobot Network Truth</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Gestão de blocos IPv4 públicos (CGNAT /29, /30) e delegação IPv6 /56 e /64 com persistência relacional e sincronização com ERP.
              </p>
              <div className="flex items-center text-rose-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card PWA & Campo */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">PWA Portal &amp; Técnico de Campo</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Compilação TWA para Google Play Store, Webphone Asterisk WebRTC, Service Worker offline e transmissão de coordenadas GPS dos instaladores.
              </p>
              <div className="flex items-center text-sky-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Card Asterisk Telefonia */}
            <div className="bg-card border border-border p-6 rounded-xl hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Radio size={24} />
              </div>
              <h3 className="text-base font-bold text-card-foreground mb-1.5">Telefonia Asterisk 20+ &amp; PABX</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                Sinalização SIP (5060), portas RTP (10000-20000), filas de atendimento, gravação de chamadas e WebSockets seguros (8089) para áudio direto no navegador.
              </p>
              <div className="flex items-center text-amber-400 text-xs font-semibold">
                Ler manual <ChevronRight size={14} className="ml-1" />
              </div>
            </div>
          </div>
        )}

        {/* Deploy & Arquitetura Oficial */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            {/* Top Overview */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                    <Terminal size={20} className="text-blue-400" />
                    Guia Oficial de Implantação (Debian 12 Bookworm)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O NAP roda encapsulado em ambiente dedicado com Node.js v22 LTS, PostgreSQL 16, Nginx, Asterisk 20+ e Zabbix 7.0.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/deploy.sh"
                    download="deploy.sh"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <Download size={14} />
                    Download deploy.sh
                  </a>
                </div>
              </div>

              {/* Comandos Rápidos de Execução */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      Instalação Automatizada (1-Liner):
                    </span>
                    <button
                      onClick={() => handleCopy('chmod +x deploy.sh && sudo ./deploy.sh', 'cmd_auto')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      {copiedSnippet === 'cmd_auto' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedSnippet === 'cmd_auto' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <code className="block p-2.5 rounded bg-slate-900 font-mono text-emerald-400 text-xs select-all">
                    chmod +x deploy.sh &amp;&amp; sudo ./deploy.sh
                  </code>
                  <p className="text-[11px] text-muted-foreground">
                    Configura PostgreSQL, instala Node.js 22 LTS, compila a aplicação via esbuild, registra serviço PM2 e cria regras UFW.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Certificados mTLS do C6 Bank:
                    </span>
                    <button
                      onClick={() => handleCopy('sudo mkdir -p /opt/nap/certs && sudo chmod 700 /opt/nap/certs', 'cmd_certs')}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      {copiedSnippet === 'cmd_certs' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedSnippet === 'cmd_certs' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <code className="block p-2.5 rounded bg-slate-900 font-mono text-cyan-400 text-xs select-all">
                    sudo mkdir -p /opt/nap/certs &amp;&amp; sudo chmod 700 /opt/nap/certs
                  </code>
                  <p className="text-[11px] text-muted-foreground">
                    Crie o diretório com restrição de permissão 700 antes de carregar o arquivo <code>c6_mtls_prod.crt</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Tabela de Portas Oficiais */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                  <Network size={16} className="text-emerald-400" />
                  Matriz Oficial de Portas &amp; Serviços (Firewall / UFW)
                </h3>
                <span className="text-xs text-muted-foreground">Debian 12 ISP Infrastructure</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 font-semibold">Porta</th>
                      <th className="p-3 font-semibold">Protocolo</th>
                      <th className="p-3 font-semibold">Serviço</th>
                      <th className="p-3 font-semibold">Finalidade &amp; Subsistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {officialPorts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">{p.port}</td>
                        <td className="p-3 font-semibold text-slate-300">{p.proto}</td>
                        <td className="p-3 font-semibold text-card-foreground">{p.service}</td>
                        <td className="p-3 text-muted-foreground">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configuração Nginx & WebSocket Upgrade */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                  <Server size={16} className="text-blue-400" />
                  Nginx Reverse Proxy com Suporte a WebSockets (WSS Asterisk &amp; Webphone)
                </h3>
                <button
                  onClick={() => handleCopy(`server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`, 'nginx_conf')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  {copiedSnippet === 'nginx_conf' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedSnippet === 'nginx_conf' ? 'Copiado!' : 'Copiar Bloco Nginx'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Modal Guia C6 Bank */}
      {showC6Guide && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-4xl w-full my-8 relative">
            <button
              onClick={() => setShowC6Guide(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
              title="Fechar"
            >
              <X size={18} />
            </button>
            <C6BankProcedimentosGuia onClose={() => setShowC6Guide(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

