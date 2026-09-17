import React, { useState } from 'react';
import { 
 BookOpen, CheckCircle2, Circle, AlertCircle, Search, 
 Terminal, ShieldCheck, Database, Server, Smartphone, 
 Cpu, Zap, Layers, FileText, ChevronRight, Download
} from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

export default function Ajuda() {
 const { config } = useConfig();
 const [activeTab, setActiveTab] = useState<'matriz' | 'manuais' | 'deploy'>('matriz');

 const matrixStaging = [
 { module: 'WABA & Inbox', status: 'done', desc: 'Integração Oficial WhatsApp Cloud API & Copiloto Gemini IA', date: 'Homologado' },
 { module: 'Cérebro IA (MaIA) & 9router', status: 'done', desc: 'Google Gemini 2.5 Flash com failover automático 9router e alertas de cota 429', date: 'Homologado' },
 { module: 'CRM Kanban', status: 'done', desc: 'Sincronização 360 e SGP Adapter acoplado', date: 'Homologado' },
 { module: 'Banco de Dados (Drizzle)', status: 'done', desc: 'PostgreSQL estruturado, Soft Deletes e Chaves Numéricas', date: 'Homologado' },
 { module: 'Financeiro & Régua', status: 'done', desc: 'Geração de PIX (Copia e Cola), Boletos e Idempotência', date: 'Homologado' },
 { module: 'App B2C (Portal PWA)', status: 'done', desc: 'Auto-serviço e verificação proativa de rede', date: 'Homologado' },
 { module: 'NOC & Zabbix', status: 'done', desc: 'Telemetria, Alarmes e Auditoria de Acks integrados', date: 'Homologado' },
 { module: 'GenieACS & OLTs', status: 'done', desc: 'Configuração Wi-Fi Remota (CWMP) liberada', date: 'Homologado' },
 { module: 'App Field Service (Técnicos)', status: 'done', desc: 'Baixa de OS e Geolocalização em Tempo Real (GIS)', date: 'Homologado' }
 ];

 const getStatusIcon = (status: string) => {
 switch (status) {
 case 'done': return <CheckCircle2 size={20} className="text-emerald-500" />;
 case 'wip': return <AlertCircle size={20} className="text-amber-500" />;
 default: return <Circle size={20} className="text-muted-foreground" />;
 }
 };

 return (
 <div className="p-6 max-w-7xl mx-auto space-y-6">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
 <BookOpen className="text-blue-500" size={32} />
 Central de Ajuda & Homologação
 </h1>
 <p className="text-muted-foreground mt-2 text-lg">
 Documentação oficial, guias operacionais e matriz de prontidão do sistema (UAT).
 </p>
 </div>

 <div className="flex gap-4 border-b border-border pb-px">
 <button 
 onClick={() => setActiveTab('matriz')}
 className={`pb-3 px-1 font-medium transition-colors border-b-2 ${activeTab === 'matriz' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
 >
 <div className="flex items-center gap-2"><CheckCircle2 size={18} /> Matriz de Homologação (UAT)</div>
 </button>
 <button 
 onClick={() => setActiveTab('manuais')}
 className={`pb-3 px-1 font-medium transition-colors border-b-2 ${activeTab === 'manuais' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
 >
 <div className="flex items-center gap-2"><FileText size={18} /> Guias Operacionais</div>
 </button>
 <button 
 onClick={() => setActiveTab('deploy')}
 className={`pb-3 px-1 font-medium transition-colors border-b-2 ${activeTab === 'deploy' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
 >
 <div className="flex items-center gap-2"><Terminal size={18} /> Deploy & Arquitetura</div>
 </button>
 </div>

 <div className="mt-6">
 {activeTab === 'matriz' && (
 <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
 <div>
 <h2 className="text-lg font-semibold text-card-foreground">Prontidão do Sistema (Staging / Production)</h2>
 <p className="text-sm text-muted-foreground mt-1">Status de aprovação técnica e implantação dos módulos arquitetônicos.</p>
 </div>
 <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20">
 <CheckCircle2 size={14} /> Sistema Homologado (100%)
 </div>
 </div>
 <div className="divide-y divide-slate-800/50">
 {matrixStaging.map((item, i) => (
 <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
 <div className="flex items-start gap-4">
 <div className="mt-0.5">{getStatusIcon(item.status)}</div>
 <div>
 <h3 className="font-medium text-card-foreground">{item.module}</h3>
 <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
 </div>
 </div>
 <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
 {item.date}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'manuais' && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="bg-card border border-border p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group">
 <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
 <Cpu size={24} />
 </div>
 <h3 className="text-lg font-semibold text-card-foreground mb-2">Cérebro IA & 9router Gateway</h3>
 <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
 Estratégia de uso do Gemini 2.5 Flash gratuito com failover corporativo 9router, tolerância a Erro 429 e rate-limit.
 </p>
 <div className="flex items-center text-indigo-400 text-sm font-medium">Ler manual <ChevronRight size={16} className="ml-1" /></div>
 </div>

 <div className="bg-card border border-border p-6 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer group">
 <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
 <Zap size={24} />
 </div>
 <h3 className="text-lg font-semibold text-card-foreground mb-2">Treinamento WABA & Gemini</h3>
 <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
 Como funciona o Handoff da Inteligência Artificial para o humano, gerenciamento de tickets e gatilhos PIX no WABA.
 </p>
 <div className="flex items-center text-blue-400 text-sm font-medium">Ler manual <ChevronRight size={16} className="ml-1" /></div>
 </div>

 <div className="bg-card border border-border p-6 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
 <div className="h-12 w-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
 <Database size={24} />
 </div>
 <h3 className="text-lg font-semibold text-card-foreground mb-2">Auditoria Drizzle & DB</h3>
 <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
 Guia de LGPD (Soft Deletes), rastreabilidade transacional (Idempotência) e relatórios de conformidade arquitetural.
 </p>
 <div className="flex items-center text-emerald-400 text-sm font-medium">Ler manual <ChevronRight size={16} className="ml-1" /></div>
 </div>

 <div className="bg-card border border-border p-6 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
 <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
 <Server size={24} />
 </div>
 <h3 className="text-lg font-semibold text-card-foreground mb-2">Multi-ERP Hub</h3>
 <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
 Como configurar as credenciais do SGP, IXC ou Hubsoft no ErpAdapter e parametrizar as réguas de cobrança D-3 a D+7.
 </p>
 <div className="flex items-center text-purple-400 text-sm font-medium">Ler manual <ChevronRight size={16} className="ml-1" /></div>
 </div>
 
 <div className="bg-card border border-border p-6 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group">
 <div className="h-12 w-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
 <Smartphone size={24} />
 </div>
 <h3 className="text-lg font-semibold text-card-foreground mb-2">PWA & Field Service</h3>
 <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
 Manuais para compilação do Portal do Cliente e do App do Técnico (Mobile-first) em APK nativo via Bubblewrap/TWA.
 </p>
 <div className="flex items-center text-indigo-400 text-sm font-medium">Ler manual <ChevronRight size={16} className="ml-1" /></div>
 </div>
 </div>
 )}

 {activeTab === 'deploy' && (
 <div className="bg-card border border-border rounded-xl overflow-hidden p-8 text-center max-w-3xl mx-auto mt-8">
 <div className="bg-muted/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
 <Terminal size={32} className="text-muted-foreground" />
 </div>
 <h2 className="text-2xl font-bold text-card-foreground mb-4">Deploy em Produção (Debian 12)</h2>
 <p className="text-muted-foreground leading-relaxed mb-8">
 A plataforma está pronta para implantação. Toda a infraestrutura roda através do motor Vite (Frontend SPA) e esbuild (Backend Node.js CommonJS) no <code>dist/server.cjs</code>. Para orquestração da VM no provedor, utilize o PM2 para gestão de processos e o Nginx como Proxy Reverso.
 </p>
 <div className="flex justify-center gap-4">
 <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
 <Download size={18} /> Baixar deploy.sh
 </button>
 <button className="bg-muted hover:bg-accent text-card-foreground px-6 py-2.5 border border-border rounded-lg font-medium transition-colors">
 Visualizar DEPLOY.md
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
