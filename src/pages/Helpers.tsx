import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Sparkles, Server, MessageSquare, PhoneCall, 
  LayoutDashboard, Database, ShieldCheck, Zap, Cog, 
  Wifi, Smartphone, Radio, Search, Check, Copy, 
  AlertTriangle, ExternalLink, Activity, Users, 
  MapPin, HardDrive, RefreshCw, FileText, ChevronRight, 
  HelpCircle, Wrench, Shield, CheckCircle2, ClipboardCheck,
  CheckSquare, ArrowRight, ShieldAlert, PieChart, Terminal, Globe, Lock,
  ListChecks, Clock, KeyRound, Filter, Megaphone, Truck, Package,
  Network, Layers, BarChart2, Cpu, Headphones, Sliders, ScanLine, Printer, Key,
  Share2, Box, Palette, Sun, Moon, CheckCircle, Hash, SlidersHorizontal
} from 'lucide-react';
import ChecklistHomologacao from '../components/ChecklistHomologacao';

interface HelpSection {
  id: string;
  category: 'core' | 'erp' | 'atendimento' | 'telefonia' | 'noc' | 'logistica' | 'contratos' | 'portal' | 'rede' | 'campo' | 'seguranca' | 'homologacao' | 'crm_kanban' | 'deploy';
  title: string;
  badge: string;
  icon: React.ReactNode;
  tags: string[];
  summary: string;
  content: React.ReactNode;
}

export default function Helpers() {
  const [activeSectionId, setActiveSectionId] = useState<string>('pendencias-homologacao');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const categories = [
    { id: 'todos', label: 'Todos os Módulos' },
    { id: 'homologacao', label: 'Pendências & Homologação' },
    { id: 'deploy', label: 'Deploy & Produção' },
    { id: 'core', label: 'Visão & Core' },
    { id: 'crm_kanban', label: 'CRM 360 & Kanban' },
    { id: 'erp', label: 'Multi-ERP & APIs' },
    { id: 'atendimento', label: 'Inbox & IA' },
    { id: 'telefonia', label: 'Telefonia & URA' },
    { id: 'noc', label: 'NOC & Infraestrutura' },
    { id: 'logistica', label: 'Estoque & Frota' },
    { id: 'contratos', label: 'Contratos & SCM' },
    { id: 'portal', label: 'Portal do Assinante' },
    { id: 'rede', label: 'TR-069 & Mapa GIS' },
    { id: 'campo', label: 'Técnico de Campo' },
    { id: 'seguranca', label: 'Auditoria & LGPD' }
  ];

  const sections: HelpSection[] = useMemo(() => [
    {
      id: 'pendencias-homologacao',
      category: 'homologacao',
      title: 'Checklist & Pendências de Homologação (Staging / UAT)',
      badge: 'Roteiro de Homologação',
      icon: <ClipboardCheck size={18} className="text-emerald-400" />,
      tags: ['homologacao', 'staging', 'uat', 'pendencias', 'checklist', 'producao', 'testes', 'deploy', 'provedor', 'vps'],
      summary: 'Matriz técnica consolidada de pendências técnicas, de segurança e de documentação com progresso visual para o lançamento oficial.',
      content: <ChecklistHomologacao />
    },
    {
      id: 'visao-geral',
      category: 'core',
      title: 'Visão Geral & Arquitetura do NAP',
      badge: 'Arquitetura Core',
      icon: <LayoutDashboard size={18} />,
      tags: ['arquitetura', 'full-stack', 'express', 'react', 'soberania', 'vps', 'gemini', 'mock'],
      summary: 'Estrutura técnica e propósito do Núcleo de Atendimento ao Provedor (NAP) para ISPs.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Núcleo de Atendimento ao Provedor (NAP)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O <strong>NAP</strong> é uma plataforma SaaS Omnichannel de missão crítica desenvolvida sob medida para <strong>Provedores de Internet (ISPs)</strong>. Projetado para rodar em uma VM/VPS Debian 12 dedicada por provedor, o NAP garante isolamento completo dos dados cadastrais, financeiros e de telefonia do assinante.
            </p>
          </div>

          {/* Grid de Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Server size={16} /> Soberania & Isolamento
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada ISP opera em container/VM isolada. Chaves de API, credenciais de ERP e troncos SIP Asterisk não são compartilhados com outros clientes.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Sparkles size={16} /> Cérebro Gemini 2.5
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orquestração nativa via SDK do Google GenAI executada em rotas protegidas no servidor Node.js (`server.ts`), operando como Copiloto e Triagem autônoma.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck size={16} /> Fallback Mock Resiliente
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Caso a rede externa ou ERP caia temporariamente, a camada in-memory mantém o painel funcional sem travar a interface do operador ou assinante.
              </p>
            </div>
          </div>

          {/* Especificações de Portas e Infraestrutura */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity size={14} className="text-blue-400" /> Mapa de Portas e Serviços
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 3000</span>
                <span className="text-white font-bold">NAP Web / API</span>
                <span className="text-slate-500 text-[10px] block mt-1">Nginx Reverse Proxy</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 7547 / 7557</span>
                <span className="text-emerald-400 font-bold">GenieACS TR-069</span>
                <span className="text-slate-500 text-[10px] block mt-1">NBI / CWMP ONUs</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 5060 / 8089</span>
                <span className="text-indigo-400 font-bold">Asterisk SIP / WSS</span>
                <span className="text-slate-500 text-[10px] block mt-1">WebRTC Webphone</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 10050 / 10051</span>
                <span className="text-cyan-400 font-bold">Zabbix 7.0 LTS</span>
                <span className="text-slate-500 text-[10px] block mt-1">Triggers & Telemetria</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 10000:20000</span>
                <span className="text-purple-400 font-bold">RTP Audio VoIP</span>
                <span className="text-slate-500 text-[10px] block mt-1">Voz das Ligações</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Porta 3799</span>
                <span className="text-amber-400 font-bold">Radius PoD / CoA</span>
                <span className="text-slate-500 text-[10px] block mt-1">Kick MikroTik / BNG</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tema-digify-interface',
      category: 'core',
      title: 'Design System Digify & Alternador de Tema Claro / Escuro',
      badge: 'Interface & UX',
      icon: <Sun size={18} className="text-amber-400" />,
      tags: ['tema', 'claro', 'escuro', 'digify', 'interface', 'ux', 'acessibilidade', 'localstorage', 'paleta', 'contraste'],
      summary: 'Guia de uso do alternador de temas claro e escuro, design tokens inspirados na Digify e conformidade visual WCAG.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Design System Inspirado na Digify & Alternância de Tema</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O NAP adota um ecossistema visual moderno baseado nas diretrizes de design da <strong>Digify</strong> (<a href="https://digify.com.br" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">digify.com.br</a>), oferecendo aos operadores e administradores flexibilidade ergonômica completa com alternância instantânea entre <strong>Tema Claro</strong> e <strong>Tema Escuro</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sun size={14} /> Alternância Rápida & Ergonomia Visual
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O operador pode alternar entre os modos a qualquer instante através do botão <strong>ThemeToggle</strong> posicionado estrategicamente na <strong>Topbar</strong> (ao lado do Webphone) e no <strong>rodapé da Sidebar</strong>.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Escuro NOC Obsidian (Mais Adequado):</strong> Fundo profundo <code>#0b0f19</code> e cartões <code>#101726</code> projetados para baixa fadiga ocular em turnos de monitoramento 24/7 e contraste imediato com alarmes ópticos e telefônicos.</li>
                <li><strong>Claro Corporativo (Daylight):</strong> Fundo límpido <code>#f4f6fa</code> e cartões <code>#ffffff</code> com alto contraste de texto em ardósia escura (<code>#0f172a</code>), ideal para ambientes de escritório iluminados.</li>
                <li><strong>Automático (Sistema):</strong> Detecta a preferência nativa de tema do dispositivo em tempo real via <code>matchMedia(prefers-color-scheme)</code>.</li>
                <li><strong>Persistência Automática:</strong> A preferência é salva no <code>localStorage</code> (chave <code>nap_theme</code>) e preservada entre sessões e recarregamentos sem FOUC.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Palette size={14} /> Paleta de Cores e Tokens Digify
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cores semânticas padronizadas em todo o sistema para criar hierarquia óptica imediata:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#0a50ff] shrink-0" /> Azul Primário Digify
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">#0a50ff / Blue 600</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#55b0ff] shrink-0" /> Realce Sky / Ciano
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">#55b0ff</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b2c4c] shrink-0" /> Bordas Estruturais
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">#1b2c4c (Escuro) / #e2e8f0 (Claro)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'crm-360-assinantes',
      category: 'crm_kanban',
      title: 'CRM 360 & Gestão de Assinantes (Padrão Digify)',
      badge: 'Base de Clientes',
      icon: <Users size={18} className="text-blue-400" />,
      tags: ['crm', 'assinantes', 'kpi', 'digify', 'sgp', 'desbloqueio', '24h', 'pix', 'slideover', 'whatsapp', 'tecnico', 'historico'],
      summary: 'Barra executiva de KPIs, tabela de clientes com filtros dinâmicos, slide-over 360 com histórico Asterisk e ações rápidas SGP.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">CRM 360 & Base de Assinantes (`/admin/crm`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O módulo de CRM centraliza a inteligência cadastral, técnica e financeira de toda a base de assinantes do provedor. Ele combina a identidade visual Digify com KPIs em tempo real e ações imediatas de teleatendimento.
            </p>
          </div>

          {/* Os 4 Cards de KPI Executivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Assinantes</span>
              <div className="text-xl font-bold text-white font-mono">1.482</div>
              <span className="text-[10px] text-blue-400">Base consolidada no ERP</span>
            </div>
            <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clientes Ativos</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">1.348 (91%)</div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Tráfego Liberado
              </span>
            </div>
            <div className="p-4 bg-slate-950 border border-rose-500/20 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bloqueados / Débito</span>
              <div className="text-xl font-bold text-rose-400 font-mono">134 (9%)</div>
              <span className="text-[10px] text-rose-400">Régua de cobrança ativa</span>
            </div>
            <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Desbloqueio Ativo</span>
              <div className="text-xl font-bold text-amber-400 font-mono">24 Horas</div>
              <span className="text-[10px] text-amber-300">Regra de confiança padrão</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Filter size={14} /> Filtros Rápidos & Ações na Tabela
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Na barra de ferramentas, o atendente pode alternar com 1 clique entre <strong>Todos</strong>, <strong>Ativos</strong> e <strong>Bloqueados</strong>, além de buscar por Nome, CPF, Telefone ou Bairro.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Avatar com Gradiente Digify:</strong> Iniciais destacadas facilitando escaneabilidade visual.</li>
                <li><strong>Envio de Rota para Técnico via WhatsApp:</strong> Botão com ícone do WhatsApp que formata a mensagem com o endereço completo do cliente, coordenadas e link direto de navegação (Google Maps / Waze) para a equipe de rua.</li>
                <li><strong>Consulta Profunda SGP:</strong> Atalho direto para abertura da Ficha SGP completa (`/admin/sgp`).</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Activity size={14} /> Painel Lateral 360 (Slide-over)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao clicar em qualquer linha de cliente, uma gaveta lateral fluida se abre com o raio-X completo:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Resumo Gemini Copiloto:</strong> Diagnóstico executivo gerado por IA sobre o perfil e risco do assinante.</li>
                <li><strong>Histórico Telefônico do Asterisk 20+:</strong> Chamadas recentes com duração, ramal de atendimento e player para ouvir gravações.</li>
                <li><strong>Ações Financeiras:</strong> Botão para emissão de PIX Copia-e-Cola e acionamento de <strong>Desbloqueio de Confiança de 24 Horas</strong> com registro auditado.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'kanban-multi-funis',
      category: 'crm_kanban',
      title: 'Kanban Operacional: Multi-Funis & SLAs Regressivos',
      badge: 'Pipelines Ágeis',
      icon: <Layers size={18} className="text-indigo-400" />,
      tags: ['kanban', 'pipelines', 'funis', 'vendas', 'suporte', 'cobranca', 'sla', 'dragndrop', 'operadores', 'prioridade'],
      summary: 'Quadro Kanban com 3 funis estratégicos (Vendas, Suporte N1/N2 e Cobrança), SLA visual regressivo e movimentação de estágios.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Kanban Operacional & Gestão de Demandas (`/admin/kanban`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O quadro Kanban organiza os fluxos de trabalho do provedor em colunas dinâmicas, integrando alertas de SLA, valores financeiros de planos e controle por operador responsável.
            </p>
          </div>

          {/* 3 Pipelines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                <span>1. Vendas & Novas Instalações</span>
                <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">Comercial</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estágios: <em>Lead Recebido &gt; Viabilidade Técnica &gt; Proposta SCM &gt; Agendamento &gt; Instalado & Ativo</em>. Focado na conversão ágil de novos assinantes.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>2. Suporte Técnico N1 / N2</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Operação NOC</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estágios: <em>Triagem IA &gt; Fila N1 &gt; OS de Campo &gt; Teste Óptico &gt; Resolvido</em>. Supervisiona tickets técnicos com alerta de degradação de sinal.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-rose-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                <span>3. Cobrança & Retenção</span>
                <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded">Financeiro</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estágios: <em>Fatura Vencida &gt; Lembrete WhatsApp &gt; Promessa 24h &gt; Bloqueio Parcial &gt; Renegociado</em>. Reduz a inadimplência com automações amigáveis.
              </p>
            </div>
          </div>

          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Clock size={16} /> Indicador de SLA Regressivo & Movimentação
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cada cartão exibe a contagem de tempo restante para a conclusão do estágio. Cartões com prazo próximo do vencimento recebem alerta amarelo, e quando o SLA é estourado, o cartão exibe destaque vermelho piscante, garantindo cumprimento das metas de atendimento da ANATEL.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'multi-erp',
      category: 'erp',
      title: 'Multi-ERP: IXC Soft, Hubsoft, MikWeb & SGP',
      badge: 'Integrações Homologadas',
      icon: <Database size={18} />,
      tags: ['erp', 'ixc', 'hubsoft', 'mikweb', 'sgp', 'mksolutions', 'ispfy', 'radiusnet', 'ping', 'latencia', 'api', 'token'],
      summary: 'Catálogo de conectores, validador de handshake em tempo real e monitor de latência (ping).',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Conectores de Gestão Telecom (Multi-ERP)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O NAP possui uma camada de abstração com suporte aos principais sistemas de gestão do mercado telecom brasileiro. Você pode alternar o ERP ativo com um único clique em <strong>Configurações &gt; Conectores ERP</strong>.
            </p>
          </div>

          {/* Cards dos 3 Principais ERPs Homologados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 font-black text-xs font-mono">IXC</span>
                <span className="text-[10px] text-emerald-400 font-mono">REST v1</span>
              </div>
              <h3 className="text-sm font-bold text-white">IXC Soft (IXC Provedor)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consome o Webservice REST v1 em formato JSON. Necessita permissões em <code>cliente</code>, <code>radusuarios</code> e <code>fn_areceber</code>.
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                Endpoint: /webservice/v1
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-cyan-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-lg bg-cyan-600/20 text-cyan-400 font-black text-xs font-mono">HUB</span>
                <span className="text-[10px] text-emerald-400 font-mono">REST v1/v2</span>
              </div>
              <h3 className="text-sm font-bold text-white">Hubsoft Telecom</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integração via Bearer Token / Client Secret. Permite sincronização em tempo real de contratos, emissão de PIX dinâmico e auto-desbloqueio.
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                Endpoint: /api/v1
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-rose-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-lg bg-rose-600/20 text-rose-400 font-black text-xs font-mono">MIK</span>
                <span className="text-[10px] text-emerald-400 font-mono">API v1.2</span>
              </div>
              <h3 className="text-sm font-bold text-white">MikWeb</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conexão em nuvem especializada em concentradores MikroTik, sincronizando bloqueios de acesso e liberação de confiança imediata.
              </p>
              <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                Endpoint: /v1
              </div>
            </div>
          </div>

          {/* Validador de API & Indicador de Ping */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Como Utilizar o Validador de API e Indicador de Latência (Ping)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O NAP inclui um <strong>Validador em Tempo Real</strong> na aba de ERP para testar a comunicação antes de colocar a integração em produção:
            </p>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Acesse <strong>Configurações &gt; Integrações ERP</strong> e clique na aba <em>"Validador de API"</em>.</li>
              <li>Selecione o provedor desejado (IXC, Hubsoft ou MikWeb).</li>
              <li>Preencha a <strong>URL Base</strong> e o <strong>Token de API</strong> (ou utilize o botão <em>"Dados Homologados"</em> para testar o simulador).</li>
              <li>Clique em <strong>"Testar Conexão"</strong> para executar a bateria de 5 verificações: Handshake TLS, Autenticação, Leitura de Contratos, PIX e Desbloqueio 24h.</li>
              <li>Observe o <strong>Badge de Ping</strong> que avalia a latência em milissegundos e qualidade de sinal (Excelente &lt;60ms, Estável &lt;150ms).</li>
              <li>Clique em <strong>"Salvar e Ativar"</strong> para definir o ERP como fonte de verdade ativa no NAP.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'inbox-triagem-ia',
      category: 'atendimento',
      title: 'Inbox Omnichannel & Triagem IA (Gemini 2.5)',
      badge: 'Atendimento & Copiloto',
      icon: <MessageSquare size={18} />,
      tags: ['inbox', 'whatsapp', 'waba', 'webchat', 'gemini', 'ia', 'triagem', 'sentimento', 'pix', 'desbloqueio', 'copiloto'],
      summary: 'Centralização de WhatsApp WABA e Webchat, respostas com IA, PIX e desbloqueio 24h no chat.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Inbox Omnichannel & Triagem com Cérebro IA</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O Inbox unifica mensagens vindas do <strong>WhatsApp Cloud API (WABA)</strong> oficial da Meta e do <strong>Webchat do Portal do Assinante</strong> em uma única interface em tempo real, sem necessidade de alternar entre abas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Modo Triagem IA & Copiloto
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mensagens que entram na fila de <code>Triagem IA</code> são analisadas pelo <strong>Gemini 2.5 Flash</strong>. O modelo consulta automaticamente os dados cadastrais do cliente no ERP ativo e a telemetria da ONU no GenieACS:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Detecta a intenção (2ª via, suporte técnico, alteração de plano, lentidão).</li>
                <li>Mede o <strong>Sentimento do Cliente</strong> (Positivo, Neutro ou Frustrado).</li>
                <li>Sugere respostas prontas e resumos da conversa para o operador.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Zap size={14} /> Ações Rápidas no Atendimento
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O operador conta com botões de disparo com 1 clique diretamente na caixa de composição do chat:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white">Gerar Chave PIX:</strong>
                    <span className="text-slate-400 block text-[11px]">Gera payload Copia-e-Cola e QR Code dinâmico da fatura aberta.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <strong className="text-white">Desbloqueio em Confiança (24h):</strong>
                    <span className="text-slate-400 block text-[11px]">Envia webhook para o ERP e comando ao MikroTik liberando o acesso.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Handoff Humano-IA (WABA ↔ ERP Kanban) */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-blue-300 flex items-center gap-2">
              <Users size={16} /> Regra de Handoff (Transferência Humana Inteligente)
            </h3>
            <p className="text-xs text-blue-100/70 leading-relaxed mb-2">
              Se o cliente solicitar falar com um atendente, ou o operador assumir a conversa na Caixa de Entrada, o <strong>Handoff instantâneo</strong> ocorre:
            </p>
            <ul className="text-xs text-blue-100/70 space-y-1.5 ml-1">
              <li>• <strong>Pausa da IA:</strong> A MaIA interrompe as respostas automáticas.</li>
              <li>• <strong>WABA API:</strong> O cliente recebe notificação de transferência imediata no WhatsApp.</li>
              <li>• <strong>Kanban SGP:</strong> O endpoint <code>/api/waba/handoff</code> gera/atualiza um Card (Deal) no módulo ERP (Em Atendimento).</li>
              <li>• <strong>Contexto 360:</strong> A gaveta lateral direita da Caixa de Entrada se abre revelando o status da ONU (TR-069) e faturas pendentes.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'telefonia-pabx',
      category: 'telefonia',
      title: 'Telefonia Asterisk 20+, URA Visual & CTI',
      badge: 'PABX Cloud & Voz',
      icon: <PhoneCall size={18} />,
      tags: ['telefonia', 'asterisk', 'asterisk_20', 'ura', 'dialplan', 'cti', 'webrtc', 'webphone', 'voz', 'tts', 'stt', 'gemini'],
      summary: 'Monitor CTI em tempo real, editor de URA visual (Dialplan Studio), banco de áudios TTS e Webphone WebRTC.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Telefonia Asterisk Nativa (`/admin/telefonia`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O NAP possui seu <strong>próprio motor Asterisk 20+ puro e nativo</strong> rodando no backend. Toda a parametrização de protocolos (AMI, ARI, PJSIP, WSS) já nasce pré-configurada. Você não precisa instalar um PABX externo — o NAP já é o PABX.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              <strong>O que você precisa configurar?</strong> Apenas as rotas externas (Troncos SIP) no painel de Configurações (`/admin/super`), e os ramais administrativos ou de operadores, que são criados através do Assistente de Ramais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Network size={16} /> 1. Troncos SIP
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                As conexões com operadoras VoIP para originar/receber ligações externas são configuradas diretamente no painel Super Admin (`/admin/super`).
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Hash size={16} /> 2. Ramais Nativos
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ramais administrativos que não dependem de URA podem ser criados via Assistente de Ramais (`/admin/telefonia`), prontos para registrar no Zoiper ou Webphone.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Sliders size={16} /> 3. URA Visual
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Editor modular de fluxo de atendimento: menus numéricos, roteamento por horário, filas musicais e transbordo humano. Tudo compilado em tempo real no dialplan.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles size={16} /> 4. Áudios TTS (Gemini)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Text-to-Speech natural via IA. Digite o aviso e gere locuções ultra-realistas em arquivo <code>.wav</code> (8kHz mono) automaticamente injetado no Asterisk.
              </p>
            </div>
          </div>

          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <PhoneCall size={16} /> CTI Reverso & Análise de Voz ao Vivo
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Quando o assinante disca para a central, o Asterisk 20+ envia o evento AMI com o número de origem (CallerID). O NAP consulta a base cadastral do ERP e abre instantaneamente a <strong>Ficha CRM 360</strong> do cliente na tela do operador antes mesmo do ramal ser atendido. Durante a chamada, o áudio é transcrito em tempo real com avaliação contínua do sentimento do cliente.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'noc-monitoramento',
      category: 'noc',
      title: 'NOC & Monitoramento de Infraestrutura (Zabbix 7.0 LTS)',
      badge: 'NOC & Redes',
      icon: <Cpu size={18} className="text-cyan-400" />,
      tags: ['noc', 'zabbix', 'grafana', 'olt', 'huawei', 'zte', 'datacom', 'fiberhome', 'mikrotik', 'juniper', 'cdn', 'ixbr', 'ptt', 'backbone', 'triggers', 'ack', 'telemetria'],
      summary: 'Central de triggers Zabbix 7.0 LTS com ACK e auditoria, telemetria de OLTs GPON multivendor e gráficos de tráfego de borda.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Centro de Operações de Rede - NOC (`/admin/infra`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Painel analítico para a equipe de Engenharia de Redes e NOC N2/N3, integrando métricas do <strong>Zabbix 7.0 LTS</strong> via protocolo JSON-RPC, <strong>Grafana</strong> e telemetria SNMP das OLTs e roteadores de borda dos Pontos de Presença (POPs).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Network size={16} /> Agregação de Tráfego de Borda
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitoramento contínuo dos links de Trânsito IP Tier 1, PTT / IX.br (São Paulo e Rio de Janeiro), e caches locais de CDN (Google GGC, Netflix OCA, Akamai, Meta e Cloudflare) com gráficos decompostos de 24h, 7 dias e 30 dias.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Layers size={16} /> Telemetria de OLTs GPON Multivendor
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Status em tempo real de OLTs Huawei SmartAX MA5800-X7, ZTE ZXA10 C320, Datacom DM4610, Fiberhome AN5516-04, além de BNGs MikroTik CCR2116 e Juniper MX204. Monitora portas PON ativas, contagem de ONTs, potência óptica, CPU, RAM, temperatura e ventoinhas.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-rose-500/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle size={16} /> Triggers Zabbix & Fluxo de ACK
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quadro de incidentes classificados por criticidade oficial do Zabbix (Desastre Nível 5, Alto Nível 4, Médio Nível 3, Atenção Nível 2 e Informativo Nível 1). Permite reconhecimento formal de alarmes (ACK) com notas técnicas e registro em trilha de auditoria.
              </p>
            </div>
          </div>

          {/* Seção Técnica de Triggers e ACK */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" /> Fluxo de Reconhecimento de Alertas (ACK) & Auditoria
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao detectar um incidente crítico (ex: perda de alimentação AC ou rompimento de enlace óptico), qualquer operador ou técnico N2 pode clicar em <strong>"Reconhecer (ACK)"</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase">1. Seleção</span>
                <p className="text-slate-300 font-medium">Operador clica no botão Reconhecer no card do incidente.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase">2. Nota Técnica</span>
                <p className="text-slate-300 font-medium">Insere o nome do técnico responsável e o parecer preliminar.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase">3. Zabbix RPC</span>
                <p className="text-slate-300 font-medium">Backend despacha método <code>event.acknowledge</code> para o Zabbix.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase">4. Auditoria LGPD</span>
                <p className="text-slate-300 font-medium">Evento gravado no livro de conformidade e segurança da plataforma.</p>
              </div>
            </div>
          </div>

          {/* Endpoints da API Zabbix */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" /> Endpoints da API Zabbix no Backend Node.js
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-300">/api/zabbix/triggers</span>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">Retorna lista consolidada de triggers ativos e reconhecidos com severidade e host.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-300">/api/zabbix/traffic</span>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">Telemetria de tráfego agregado de borda, PTT/IX.br, CDNs e trânsito IP.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-blue-400 font-bold mr-2">POST</span>
                  <span className="text-slate-300">/api/zabbix/ack</span>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">Registra reconhecimento de trigger no Zabbix e trilha de auditoria do NAP.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-purple-400 font-bold mr-2">POST</span>
                  <span className="text-slate-300">/api/zabbix/test-trigger</span>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">Simulador de triggers para testes e homologação controlada da equipe NOC.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-300">/api/zabbix/health</span>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">Health check de conectividade e handshake com a API JSON-RPC do Zabbix.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'estoque-frota',
      category: 'logistica',
      title: 'Estoque, Almoxarifado & Gestão de Frota',
      badge: 'Logística & Suprimentos',
      icon: <Package size={18} />,
      tags: ['estoque', 'frota', 'almoxarifado', 'cpe', 'ont', 'veiculos', 'gps', 'combustivel', 'bobina', 'fttx', 'materiais'],
      summary: 'Controle de saldo de ONUs e ferragens FTTx, alertas de estoque mínimo e telemetria de viaturas de campo.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Logística: Estoque & Gestão de Frota (`/admin/estoque`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Módulo indispensável para o suprimento e controle operacional do provedor, unindo a gestão do almoxarifado central com o rastreamento das viaturas da equipe técnica em rua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Package size={16} /> 1. Almoxarifado & Equipamentos (CPEs)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rastreamento individual e quantitativo dos materiais indispensáveis para instalações e manutenções FTTH:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Terminais Ópticos (ONTs):</strong> Saldo de modelos Huawei, ZTE e Nokia homologados.</li>
                <li><strong>Roteadores Mesh & Wi-Fi 6:</strong> Controle de comodato para planos de alta velocidade.</li>
                <li><strong>Materiais Passivos FTTx:</strong> Bobinas de cabo drop flat, conectores Fast SC/APC e caixas de emenda CTO 16 portas.</li>
                <li><strong>Ponto de Pedido Automático:</strong> Alertas visuais quando o saldo atinge o nível crítico estipulado.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Truck size={16} /> 2. Gestão de Viaturas & Rastreamento
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervisão completa dos veículos da operação de campo (carros de escada, fiorinos de fibra e viaturas de suporte):
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong>Status Operacional:</strong> Em Rota (na rua), Pátio / Base ou Em Manutenção.</li>
                <li><strong>Rastreador GPS Tracker:</strong> Indicador de sinal ativo em tempo real cruzado com o Radar do NOC.</li>
                <li><strong>Nível de Combustível & Hodômetro:</strong> Medidor percentual e histórico de quilometragem para controle de revisões.</li>
                <li><strong>Vinculação com Técnico:</strong> Identificação imediata de qual técnico ou equipe está com o veículo no momento.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contratos-digitais',
      category: 'contratos',
      title: 'Contratos Digitais SCM & Assinatura Eletrônica',
      badge: 'Jurídico & Compliance',
      icon: <FileText size={18} />,
      tags: ['contrato', 'assinatura', 'digital', 'scm', 'comodato', 'fidelidade', 'anatel', 'marcocivil', 'sha256', 'juridico'],
      summary: 'Emissão de minutas contratuais SCM, comodato de ONT, assinatura eletrônica com validade jurídica e envio WhatsApp.',
      content: (
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              Validade Jurídica: MP 2.200-2/2001 & Lei 14.063/2020
            </span>
            <h2 className="text-xl font-bold text-white mt-2 mb-2">Contratos SCM, Comodato e Assinatura Digital do Assinante</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O NAP integra um visualizador e formalizador de contratos digitais de Serviço de Comunicação Multimídia (SCM). O assinante pode realizar o aceite formal diretamente pelo Portal PWA, e o operador pode consultar o termo e reenviá-lo via WhatsApp no CRM/SGP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <FileText size={14} /> Cláusulas Essenciais SCM
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minuta estruturada em conformidade com as exigências da <strong>ANATEL</strong>:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li><strong>Objeto:</strong> Taxas de download/upload simétricas e garantia de disponibilidade mensal de 99,5%.</li>
                <li><strong>Comodato de Equipamento:</strong> Cessão gratuita da ONT Wi-Fi 6 com registro do endereço MAC.</li>
                <li><strong>Fidelidade de 12 Meses:</strong> Justificada pela isenção da taxa de instalação e comodato do hardware.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Segurança & Integridade Criptográfica
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No momento do clique em <em>"Assinar Contrato Digitalmente"</em>, o sistema registra:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li><strong>Hash SHA-256:</strong> Impressão digital matemática inalterável do documento aceito.</li>
                <li><strong>Carimbo de Tempo UTC:</strong> Data e hora exatas da manifestação de vontade.</li>
                <li><strong>Registro de Endereço IP:</strong> Identificação de conexão do assinante para efeitos de prova em juízo.</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Share2 size={16} /> Disparo via WhatsApp Oficial no CRM
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dentro da tela de <strong>Consulta Avançada SGP (`/admin/sgp`)</strong> na aba <em>"Contrato & Assinatura Digital"</em>, o atendente possui um botão de 1 clique para reenviar a minuta do contrato e o link de assinatura diretamente no WhatsApp do cliente via WhatsApp Cloud API (WABA).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'mapa-rede-gis',
      category: 'rede',
      title: 'Mapa de Rede GIS Leaflet & Caixas CTO',
      badge: 'Georreferenciamento',
      icon: <MapPin size={18} />,
      tags: ['mapa', 'gis', 'leaflet', 'cto', 'ont', 'cluster', 'fibra', 'geolocalizacao', 'atenuacao'],
      summary: 'Visualização geoespacial de milhares de ONTs conectadas ao TR-069, caixas CTO e mapa de incidentes.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Mapa de Rede Georreferenciado GIS (`/admin/mapa-rede`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Utilizando Leaflet e clusters dinâmicos de alta performance, o mapa plota a infraestrutura óptica de ponta a ponta: desde os POPs e rotas de cabo tronco até as Caixas de Terminação Óptica (CTOs) e as ONTs residenciais dos assinantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Radio size={16} /> Clusters de ONTs Inteligentes
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Agrupamento automático de milhares de CPEs por bairro e rua. Zoom dinâmico que abre os detalhes da ONT individual ao aproximar.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Box size={16} /> Caixas CTO & Capacidade
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identificação das caixas de atendimento nos postes, portas livres vs ocupadas e raio de viabilidade técnica para novas vendas.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Activity size={16} /> Mapa de Calor de Atenuação
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sinalização com cores das ONTs com sinal degradado (vermelho para atenuação pior que -27 dBm), identificando rompimentos parciais de fibra antes do cliente reclamar.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'genieacs-tr069',
      category: 'rede',
      title: 'GenieACS & Telemetria Óptica de CPEs (TR-069)',
      badge: 'Engenharia de Rede',
      icon: <Wifi size={18} />,
      tags: ['genieacs', 'tr069', 'cpe', 'onu', 'potencia', 'rx', 'tx', 'sinal', 'reboot', 'cwmp'],
      summary: 'Monitoramento remoto de ONUs e roteadores residenciais via protocolo TR-069.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Telemetria CPE via TR-069 (GenieACS)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O módulo <strong>GenieACS</strong> do NAP conecta-se à API NBI (Northbound Interface) do servidor GenieACS na porta <code>7557</code> para diagnosticar remotamente os parâmetros físicos do equipamento do cliente.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Parâmetros Monitorados em Tempo Real:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Potência Óptica RX</span>
                <span className="text-emerald-400 font-mono font-bold">-21.4 dBm</span>
                <span className="text-slate-500 text-[10px] block mt-1">Normal (-18 a -24 dBm)</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Potência Óptica TX</span>
                <span className="text-blue-400 font-mono font-bold">+2.1 dBm</span>
                <span className="text-slate-500 text-[10px] block mt-1">Dentro dos parâmetros</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Temperatura do Laser</span>
                <span className="text-amber-400 font-mono font-bold">44.2 °C</span>
                <span className="text-slate-500 text-[10px] block mt-1">Faixa operacional segura</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network size={16} className="text-indigo-400" />
              Como funciona o fluxo de integração (GenieACS + SGP)?
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              O ecossistema do <strong>NAP</strong> funciona como um Maestro. O <strong>SGP</strong> (ERP) cuida do financeiro e do cadastro, e o <strong>GenieACS</strong> cuida da parte física (Roteadores). O equipamento <strong>nunca é cadastrado manualmente</strong> no GenieACS, o processo funciona de forma nativa e automática via protocolo <strong>TR-069 (CWMP)</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* Passo 1 */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50" />
                <div className="text-indigo-400 mb-3 flex items-center justify-between">
                  <Server size={24} />
                  <span className="text-xs font-mono font-bold bg-indigo-500/10 px-2 py-1 rounded text-indigo-400">Passo 1</span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2">Provisionamento</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  A OLT ou o servidor PPPoE empurra a URL do GenieACS (ex: <code>http://acs.provedor.com.br:7547</code>) para a ONU assim que ela conecta na fibra.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />
                <div className="text-emerald-400 mb-3 flex items-center justify-between">
                  <Zap size={24} />
                  <span className="text-xs font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded text-emerald-400">Passo 2</span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2">Discover (Call Home)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  O roteador liga, ganha IP e dispara um <strong>Inform</strong> para o servidor. Ele se cadastra no GenieACS reportando seu MAC Address e Serial.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50" />
                <div className="text-amber-400 mb-3 flex items-center justify-between">
                  <Database size={24} />
                  <span className="text-xs font-mono font-bold bg-amber-500/10 px-2 py-1 rounded text-amber-400">Passo 3</span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2">Vínculo ERP (SGP)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  O técnico informa no App do SGP qual foi o <strong>Serial/MAC</strong> do equipamento deixado na casa, amarrando o cadastro financeiro ao aparelho.
                </p>
              </div>

              {/* Passo 4 */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-fuchsia-500/30 transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-pink-500 opacity-50" />
                <div className="text-fuchsia-400 mb-3 flex items-center justify-between">
                  <Sparkles size={24} />
                  <span className="text-xs font-mono font-bold bg-fuchsia-500/10 px-2 py-1 rounded text-fuchsia-400">Passo 4</span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2">A Mágica do NAP</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  A IA consulta o SGP (descobre o Serial) e varre o GenieACS. A IA funde os dois e diz: <em>"O cliente (SGP) está sem rede pois a fibra rompeu (-35dBm no ACS)"</em>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'portal-pwa',
      category: 'portal',
      title: 'Portal do Assinante PWA (Autoatendimento)',
      badge: 'Autoatendimento Mobile',
      icon: <Smartphone size={18} />,
      tags: ['portal', 'pwa', 'cliente', 'faturas', 'pix', 'wifi', 'senha', 'tr069', 'webphone', 'webchat', 'contrato'],
      summary: 'Aplicativo mobile-first para o assinante gerenciar faturas, alterar Wi-Fi, assinar contratos e acionar suporte.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Portal do Cliente PWA (`/portal`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O Portal do Assinante funciona como um <strong>Progressive Web App (PWA)</strong> instalável diretamente na tela inicial do celular do cliente (Android e iOS) sem necessidade de publicação prévia em lojas de aplicativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Zap size={14} /> 2ª Via de Fatura & PIX Dinâmico
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O cliente visualiza o histórico financeiro, data de vencimento e valor. Pode copiar o código PIX Copia-e-Cola com 1 clique para colar no aplicativo do seu banco, com compensação em tempo real via webhook.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Wifi size={14} /> Gestão da Rede Wi-Fi (TR-069)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permite ao cliente alterar o nome da rede (SSID) e a senha do Wi-Fi residencial sem precisar de visita técnica. Inclui medidor de segurança da senha e geração de QR Code para conexão instantânea de convidados.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <FileText size={14} /> Contrato & Assinatura Digital
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O cliente visualiza a qualquer momento a íntegra do seu contrato SCM e termo de comodato, com selo de assinatura digital e botão para download do PDF.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <RefreshCw size={14} /> Reinício Remoto de Roteador
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O próprio assinante pode solicitar o reinício do equipamento caso sinta lentidão. O portal dispara um comando <code>Reboot</code> via GenieACS, reduzindo aberturas de chamados em até 40%.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tecnico-campo',
      category: 'campo',
      title: 'Técnico de Campo (PWA) & Rastreamento GPS',
      badge: 'Operação de Campo',
      icon: <MapPin size={18} />,
      tags: ['campo', 'tecnico', 'os', 'gps', 'radar', 'foto', 'assinatura', 'canvas', 'ordem', 'servico'],
      summary: 'Módulo mobile-first para técnicos na rua, GPS contínuo, diagnóstico óptico e assinatura na tela.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Módulo Técnico de Campo Mobile-First (`/admin/campo`)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Dedicado aos técnicos de rua para execução de Ordens de Serviço (Instalações, Manutenções, Reparo de Fibra e Recolhimento de Equipamentos).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <MapPin size={16} /> Telemetria GPS em Tempo Real
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao iniciar o expediente, o PWA transmite coordenadas de latitude e longitude em tempo real ao endpoint <code>/api/usuarios/localizacao</code>, plotando o técnico no <strong>Radar de Campo</strong> do NOC.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Activity size={16} /> Diagnóstico Óptico TR-069 in loco
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O técnico consulta diretamente a potência óptica RX da ONU recém-instalada, recebendo sinalização clara se o sinal está na faixa recomendada (ideal entre -18 dBm e -24 dBm).
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Smartphone size={16} /> Foto da Instalação & CTO
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Captura fotográfica nativa via câmera do celular para registrar o conector na CTO do poste e a ONU ligada na residência antes de dar baixa na OS.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 size={16} /> Assinatura Digital no Canvas
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O cliente assina a conclusão do serviço na tela do celular do técnico com o dedo ou caneta stylus, gravando o termo digital no histórico do ERP.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'seguranca-rbac-backup',
      category: 'seguranca',
      title: 'Hierarquia de Usuários (RBAC) & Backup',
      badge: 'Controle & Auditoria',
      icon: <Shield size={18} />,
      tags: ['usuarios', 'rbac', 'permissoes', 'backup', 'restore', 'disaster', 'recovery', 'seguranca'],
      summary: 'Perfis de acesso estritos em 4 níveis e rotinas de backup e restauração de dados.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Hierarquia RBAC & Recuperação de Desastres</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O controle de acesso ao NAP é governado por uma matriz rígida de 4 perfis de usuários com restrições por rota e visibilidade de dados.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Níveis de Acesso:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-indigo-400 font-bold font-mono">1. Admin Geral (Super Admin)</span>
                <p className="text-slate-400">Acesso irrestrito a configurações, parametrização de ERP, Disaster Recovery, gestão de planos e usuários.</p>
              </div>
              <div className="p-3.5 bg-slate-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-blue-400 font-bold font-mono">2. Operador de Atendimento</span>
                <p className="text-slate-400">Acesso ao Inbox Omnichannel, Kanban de Suporte/Vendas/Cobrança, Webphone e consulta à Ficha 360 do assinante.</p>
              </div>
              <div className="p-3.5 bg-slate-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-emerald-400 font-bold font-mono">3. Técnico NOC (N1/N2)</span>
                <p className="text-slate-400">Acesso a telemetria GenieACS, dashboard de rede, ferramentas de ping/tracert e suporte técnico avançado.</p>
              </div>
              <div className="p-3.5 bg-slate-950 border border-white/5 rounded-xl space-y-1">
                <span className="text-amber-400 font-bold font-mono">4. Técnico de Campo</span>
                <p className="text-slate-400">Acesso exclusivo ao módulo mobile-first de Ordens de Serviço (`/admin/campo`) com rastreamento GPS.</p>
              </div>
            </div>
          </div>

          {/* Backup e Restauração */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <HardDrive size={16} /> Rotinas de Backup (Disaster Recovery)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema disponibiliza rotas automáticas e manuais para geração de snapshots:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
              <div className="p-2.5 bg-slate-950 border border-white/10 rounded-xl flex-1 text-slate-300 flex items-center justify-between">
                <span>GET /api/backup</span>
                <span className="text-[10px] text-slate-500">Download snapshot JSON</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-white/10 rounded-xl flex-1 text-slate-300 flex items-center justify-between">
                <span>POST /api/restore</span>
                <span className="text-[10px] text-slate-500">Upload e importação de base</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'auditoria-lgpd',
      category: 'seguranca',
      title: 'Auditoria Forense, Gráfico de Rosca & LGPD',
      badge: 'Conformidade & LGPD Art. 37',
      icon: <ShieldCheck size={18} className="text-emerald-400" />,
      tags: ['auditoria', 'lgpd', 'art37', 'anatel', 'marcocivil', 'sha256', 'grafico', 'rosca', 'forense', 'seguranca', 'exportar'],
      summary: 'Rastreabilidade inalterável com SHA-256, gráfico de rosca analítico por tipo e exportação forense para LGPD e Anatel.',
      content: (
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Padrão Regulatório: LGPD Art. 37 & Marco Civil da Internet Art. 15
            </span>
            <h2 className="text-xl font-bold text-white mt-2 mb-2">Trilha Forense e Auditoria de Ações dos Operadores</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O NAP implementa uma cadeia de custódia inalterável (<strong>Append-Only Audit Log</strong>) que registra detalhadamente todas as operações realizadas pelos operadores no painel, garantindo não-repúdio, rastreabilidade forense e cumprimento integral da legislação brasileira de telecomunicações e proteção de dados.
            </p>
          </div>

          {/* Os 4 Eixos Monitorados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Users size={16} /> 1. Acessos & Sessões Autenticadas
              </div>
              <p className="text-slate-400 leading-relaxed">
                Registra todos os logins e encerramentos de sessão dos operadores, gravando o endereço IP de origem, data/hora precisa UTC e agente de navegação.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Server size={16} /> 2. Alterações no SGP & Multi-ERP
              </div>
              <p className="text-slate-400 leading-relaxed">
                Rastreia modificações em credenciais de API, tokens, URLs de webhook e parâmetros de timeout dos ERPs (MikWeb, IXC, Hubsoft e SGP) com comparativo antes/depois.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Radio size={16} /> 3. Comandos GenieACS (TR-069)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Registra comandos CWMP disparados contra CPEs de clientes (reboots remotos de ONUs, alterações de SSID e senhas Wi-Fi), prevenindo abusos operacionais.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Megaphone size={16} /> 4. Disparos em Massa & Campanhas
              </div>
              <p className="text-slate-400 leading-relaxed">
                Audita campanhas de aviso preventivo de rompimento de fibra, lembretes automáticos de vencimento e réguas de cobrança enviadas via WhatsApp WABA.
              </p>
            </div>
          </div>

          {/* Gráfico de Rosca Analítico */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <PieChart size={16} /> Gráfico de Rosca: Visão Rápida de Conformidade
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No topo da tela de Auditoria (`/admin/auditoria`), o sistema exibe um <strong>gráfico de rosca dinâmico (Donut Chart)</strong> renderizado com Recharts. Ele totaliza as ações por categoria e fornece:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
              <li><strong>Proporção Percentual</strong> de cada categoria sobre o volume total de eventos.</li>
              <li><strong>Contador Central Integrado</strong> com o total consolidado de ações registradas na cadeia forense.</li>
              <li><strong>Filtro Rápido Interativo</strong>: ao clicar em qualquer cartão de categoria, a tabela de auditoria abaixo filtra instantaneamente as ações selecionadas.</li>
            </ul>
          </div>

          {/* Integridade Criptográfica SHA-256 e Exportação Oficial */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Lock size={16} /> Assinatura SHA-256 e Exportação Legal (CSV / JSON)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cada log gerado no NAP possui um identificador único com hash criptográfico SHA-256 que atesta a inviolabilidade do registro perante perícias de segurança ou auditorias do Encarregado de Dados (DPO):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Exportação CSV</span>
                <span className="text-white font-bold">GET /api/auditoria/exportar?formato=csv</span>
                <p className="text-[10px] text-slate-400 mt-1">Compatível com Excel, PowerBI e relatórios de auditoria interna.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">Exportação JSON Forense</span>
                <span className="text-white font-bold">GET /api/auditoria/exportar?formato=json</span>
                <p className="text-[10px] text-slate-400 mt-1">Exportação bruta com metadados e certificado de conformidade.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq-procedimentos',
      category: 'core',
      title: 'Perguntas Frequentes & Resolução de Problemas',
      badge: 'Solução Rápida',
      icon: <HelpCircle size={18} />,
      tags: ['faq', 'erros', 'duvidas', 'procedimentos', 'resolucao', 'ajuda', 'suporte', 'frota', 'zabbix', 'contrato'],
      summary: 'Respostas diretas para dúvidas técnicas frequentes na operação diária.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Perguntas Frequentes (FAQ)</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Consulte orientações rápidas para os cenários e dúvidas mais comuns no dia a dia do provedor:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-blue-400" />
                Como alterar o ERP ativo do provedor?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Vá até <strong>Configurações &gt; Integrações ERP</strong>, acerte as credenciais no formulário do conector desejado (IXC, Hubsoft, MikWeb, etc.) e clique no botão <strong>"Salvar e Ativar"</strong>. O sistema passará a consultar esse endpoint imediatamente para todas as rotinas de CRM e faturas.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-purple-400" />
                Como funciona a assinatura do Contrato Digital no Portal do Assinante?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O cliente acessa o Portal PWA (`/portal`), clica no número do contrato no topo ou na aba <em>"Minha Conta"</em>. Ele lê a minuta SCM com os termos de comodato e fidelidade de 12 meses, marca o aceite e clica em <em>"Assinar Contrato Digitalmente"</em>. O sistema grava o IP, a data/hora e o hash SHA-256 com validade jurídica comprovada.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-emerald-400" />
                Como cadastrar novos veículos na Frota ou dar saída em equipamentos?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acesse o menu <strong>Estoque & Frota (`/admin/estoque`)</strong>. Na aba <em>Almoxarifado</em> você gerencia os saldos de ONTs, roteadores e cabos. Na aba <em>Frota & Viaturas</em> você visualiza todos os veículos, o status (Em rota, Pátio, Oficina), nível de combustível e rastreador GPS.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-amber-400" />
                Como a URA do PABX interage com o Gemini para gerar áudios?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Na página de <strong>Telefonia (`/admin/telefonia`)</strong>, acesse o <em>Dialplan Studio</em> ou a aba de áudios. Ao digitar uma mensagem informativa, o backend despacha o texto para a síntese de voz neural do Gemini via rota `/api/telefonia/tts`, convertendo instantaneamente em áudio WAV 8kHz mono para reprodução direta no Asterisk.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-cyan-400" />
                O que fazer se o Ping do ERP estiver alto ou acusando Offline?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                1. Verifique se o endereço informado começa com <code>https://</code>.<br />
                2. Cheque se o firewall do seu servidor de ERP permite conexões de entrada originadas pelo IP da VPS do NAP.<br />
                3. Utilize o <strong>Validador de API</strong> para inspecionar o relatório de Handshake TLS.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle size={14} className="text-indigo-400" />
                Como funciona o Desbloqueio em Confiança (24h)?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>O tempo de desbloqueio padrão de confiança é de 24 Horas.</strong> Ao acionar o botão de desbloqueio no chat ou no CRM, o backend despacha uma instrução para a API do ERP selecionado. O ERP remove o assinante da lista de corte temporariamente pelo prazo de 24 horas e envia um pacote Radius PoD / CoA para o MikroTik ou BNG, liberando o tráfego da sessão PPPoE imediatamente com registro na auditoria LGPD.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'deploy-infraestrutura',
      category: 'deploy',
      title: 'Deploy Automatizado, VPS & Produção',
      badge: 'Infra & Produção',
      icon: <Server size={18} className="text-emerald-400" />,
      tags: ['deploy', 'vps', 'debian', 'docker', 'nginx', 'ssl', 'certbot', 'pm2', 'firewall', 'ufw', 'asterisk', 'zabbix', 'producao', 'health', 'sgp'],
      summary: 'Guia completo de instalação Bare Metal (deploy.sh), Docker Compose, Nginx reverso com SSL e matriz de portas de produção.',
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Deploy, Infraestrutura & Topologia de Produção</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              O <strong>NAP</strong> adota uma topologia <strong>Single-Tenant por ISP</strong>, garantindo total isolamento da base de dados, troncos de telefonia SIP Asterisk e telemetria de rede TR-069 e Zabbix.
            </p>
          </div>

          {/* Cards dos 2 Métodos de Implantação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <Terminal size={15} /> Método 1: Bare Metal (Recomendado)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  Melhor Desempenho VoIP
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execução direta no host Debian 12 / Ubuntu 22.04 LTS via script automatizado <code>./deploy.sh</code>. Ideal para que o Asterisk 20 tenha acesso direto aos drivers de áudio/RTP sem atritos de NAT, gerenciado via PM2.
              </p>
              <div className="relative group">
                <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-white/5">
                  {`git clone <REPO_URL> nap-isp\ncd nap-isp\nchmod +x deploy.sh\n./deploy.sh`}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyCode(`git clone <REPO_URL> nap-isp\ncd nap-isp\nchmod +x deploy.sh\n./deploy.sh`, 'cmd-deploy-sh')}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                >
                  {copiedCode === 'cmd-deploy-sh' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                  <Box size={15} /> Método 2: Docker Compose
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                  Totalmente Conteinerizado
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sobe a stack completa isolada em containers: Aplicação NAP (porta 3000), PostgreSQL 16 (porta 5432), MongoDB para GenieACS (27017), Redis (6379) e serviços GenieACS TR-069.
              </p>
              <div className="relative group">
                <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto border border-white/5">
                  {`cp .env.example .env\nnano .env\ndocker-compose up -d --build`}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopyCode(`cp .env.example .env\nnano .env\ndocker-compose up -d --build`, 'cmd-docker-compose')}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                >
                  {copiedCode === 'cmd-docker-compose' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Configuração de Nginx Reverso e SSL */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Lock size={14} className="text-amber-400" /> Nginx Proxy Reverso & Certificado SSL (Certbot)
              </h3>
              <button
                type="button"
                onClick={() => handleCopyCode(`server {
    server_name nap.meuprovedor.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}`, 'nginx-conf')}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold rounded-lg border border-white/5 flex items-center gap-1"
              >
                {copiedCode === 'nginx-conf' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedCode === 'nginx-conf' ? 'Copiado!' : 'Copiar Bloco Nginx'}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O cabeçalho <code>Upgrade $http_upgrade</code> é mandatório para permitir WebSockets seguros (WSS) usados pelo Webphone WebRTC do Asterisk e Webchat ao vivo:
            </p>
            <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-white/5">
{`# /etc/nginx/sites-available/nap.conf
server {
    server_name nap.meuprovedor.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }
}`}
            </pre>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400">Ativação e SSL:</span>
              <code className="bg-slate-950 px-2 py-1 rounded text-cyan-300 font-mono">sudo ln -s /etc/nginx/sites-available/nap.conf /etc/nginx/sites-enabled/</code>
              <code className="bg-slate-950 px-2 py-1 rounded text-cyan-300 font-mono">sudo certbot --nginx -d nap.meuprovedor.com.br</code>
            </div>
          </div>

          {/* Matriz Oficial de Portas do Firewall */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Matriz de Portas Oficiais & Regras UFW
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">Porta / Protocolo</th>
                    <th className="py-2 px-3">Serviço</th>
                    <th className="py-2 px-3">Finalidade</th>
                    <th className="py-2 px-3">Escopo de Rede</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-cyan-400 font-bold">3000/tcp</td>
                    <td className="py-2 px-3 font-sans">NAP App</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Aplicação Full-Stack (Node.js + Vite PWA)</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">Localhost / Nginx</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-emerald-400 font-bold">80/tcp e 443/tcp</td>
                    <td className="py-2 px-3 font-sans">Nginx</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Acesso seguro HTTPS, PWA e Webchat</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">Internet Pública</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-indigo-400 font-bold">8089/tcp</td>
                    <td className="py-2 px-3 font-sans">Asterisk WSS</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Sinalização WebRTC para Webphone do operador</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Navegador / Operador</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-blue-400 font-bold">5060/udp</td>
                    <td className="py-2 px-3 font-sans">Asterisk SIP</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Troncos SIP das operadoras VoIP e ramais</td>
                    <td className="py-2 px-3 text-amber-400 font-sans">Restrito a IPs das operadoras</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-purple-400 font-bold">10000:20000/udp</td>
                    <td className="py-2 px-3 font-sans">RTP Media</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Fluxo contínuo de áudio e voz das ligações</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">Internet / Operadoras</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-amber-400 font-bold">7547/tcp</td>
                    <td className="py-2 px-3 font-sans">GenieACS CWMP</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Telemetria TR-069 e gerência das ONUs</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">Rede de Acesso (VLAN de Gerência)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-400 font-bold">3005/tcp</td>
                    <td className="py-2 px-3 font-sans">GenieACS UI</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Painel administrativo do TR-069</td>
                    <td className="py-2 px-3 text-rose-400 font-sans">Apenas VPN / Rede Interna</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-rose-400 font-bold">10050/tcp</td>
                    <td className="py-2 px-3 font-sans">Zabbix Agent</td>
                    <td className="py-2 px-3 font-sans text-slate-400">Coleta de telemetria local pelo Zabbix Server</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">IP do Zabbix Server</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Gestão e Preenchimento de Credenciais Nativas */}
          <div className="p-5 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-emerald-400" /> Credenciais Nativas do Sistema (Preenchimento Nativo Automático)
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                1-Clique em /admin/superadmin
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O ecossistema NAP opera sob o conceito de <strong>Preenchimento Nativo</strong>: todos os componentes e microsserviços integrados à VM (Asterisk 20, GenieACS TR-069, Zabbix 7.0 LTS, Mapa OpenSource CARTO/OSM, ERP SGP e FreeRADIUS) são inicializados de forma pré-configurada a partir das variáveis de ambiente do host, eliminando a necessidade de setup manual a cada inicialização.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <PhoneCall size={14} /> Asterisk 20+ Nativo
                </div>
                <p className="text-[11px] text-slate-400">
                  ARI na porta <code>8088</code>, AMI na <code>5038</code>, Webphone WebRTC WSS na <code>8089</code> e Ramal SIP padrão <code>2001</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Radio size={14} /> GenieACS TR-069 Nativo
                </div>
                <p className="text-[11px] text-slate-400">
                  NBI REST na porta <code>7557</code>, CWMP na <code>7547</code> e UI nativa na <code>3005</code> com autenticação pré-configurada.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Cpu size={14} /> Zabbix 7.0 LTS Nativo
                </div>
                <p className="text-[11px] text-slate-400">
                  JSON-RPC na porta <code>8080</code> (<code>/zabbix/api_jsonrpc.php</code>) e Agent local na porta <code>10050/tcp</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <MapPin size={14} /> Mapa OpenSource Nativo
                </div>
                <p className="text-[11px] text-slate-400">
                  OpenStreetMap e CARTO Dark basemaps 100% livres, sem chaves proprietárias, cotas ou limites de requisições.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Database size={14} /> ERP SGP Emulado Local
                </div>
                <p className="text-[11px] text-slate-400">
                  Serviço REST na porta <code>3000</code> integrado à API mock com suporte a emissão PIX, promessa e desbloqueio.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldCheck size={14} /> FreeRADIUS & BNG
                </div>
                <p className="text-[11px] text-slate-400">
                  Controle de desconexão PoD / CoA RFC 3576 na porta <code>3799/udp</code> para corte e liberação imediata de PPPoE/IPoE.
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>Para restaurar ou validar todas as credenciais nativas em tempo de execução, acesse o painel <strong>SuperAdmin &gt; Credenciais Nativas</strong> ou clique no botão superior <strong>Preencher Nativos</strong>.</span>
              <a 
                href="/admin/superadmin" 
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap ml-3"
              >
                Abrir Painel
              </a>
            </div>
          </div>

          {/* Dicionário de Variáveis de Ambiente */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <KeyRound size={14} className="text-indigo-400" /> Variáveis de Ambiente Essenciais (`.env`)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-indigo-400 font-mono font-bold">GEMINI_API_KEY</span>
                <p className="text-slate-400 text-[11px]">Chave do Google GenAI para orquestração da triagem autônoma e agente de voz.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-emerald-400 font-mono font-bold">SGP_URL / APP / TOKEN</span>
                <p className="text-slate-400 text-[11px]">Credenciais do ERP para emissão de PIX, leitura de faturas e desbloqueio em confiança.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-cyan-400 font-mono font-bold">ZABBIX_URL / TOKEN</span>
                <p className="text-slate-400 text-[11px]">Endpoint JSON-RPC e Token de autenticação da central NOC Zabbix 7.0 LTS.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-amber-400 font-mono font-bold">GENIEACS_URL / USER / PASSWORD</span>
                <p className="text-slate-400 text-[11px]">API Northbound (NBI) para telemetria de sinal óptico, Wi-Fi e reboot remoto de ONUs.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-indigo-400 font-mono font-bold">ASTERISK_HOST / ARI / AMI</span>
                <p className="text-slate-400 text-[11px]">Host local do Asterisk, portas 8088/5038/8089 e segredos para telefonia e Webphone.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                <span className="text-emerald-400 font-mono font-bold">MAPA_TILE_URL / DARK_TILE</span>
                <p className="text-slate-400 text-[11px]">Camadas de azulejos (tiles) OpenStreetMap e CARTO Dark para mapas GIS offline e online.</p>
              </div>
            </div>
          </div>

          {/* Health Checks e Diagnóstico */}
          <div className="p-5 bg-slate-950 border border-white/5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" /> Health Checks & Diagnóstico Pós-Deploy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">API Central:</span>
                  <span className="text-emerald-400">curl http://localhost:3000/api/health</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('curl http://localhost:3000/api/health', 'hc-core')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded"
                >
                  {copiedCode === 'hc-core' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">NOC Zabbix API:</span>
                  <span className="text-cyan-400">curl http://localhost:3000/api/zabbix/health</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('curl http://localhost:3000/api/zabbix/health', 'hc-zabbix')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded"
                >
                  {copiedCode === 'hc-zabbix' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Logs em Tempo Real:</span>
                  <span className="text-amber-400">pm2 logs nap-backend</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('pm2 logs nap-backend', 'hc-pm2-logs')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded"
                >
                  {copiedCode === 'hc-pm2-logs' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Monitor de Recursos:</span>
                  <span className="text-indigo-400">pm2 monit</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('pm2 monit', 'hc-pm2-monit')}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded"
                >
                  {copiedCode === 'hc-pm2-monit' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ], []);

  // Filtro de Seções por Categoria e Busca
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchCategory = selectedCategory === 'todos' || s.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inTitle = s.title.toLowerCase().includes(q);
      const inSummary = s.summary.toLowerCase().includes(q);
      const inTags = s.tags.some(t => t.toLowerCase().includes(q));
      return inTitle || inSummary || inTags;
    });
  }, [sections, selectedCategory, searchQuery]);

  // Seção ativa selecionada (ou a primeira filtrada)
  const activeSection = sections.find(s => s.id === activeSectionId) || filteredSections[0] || sections[0];

  return (
    <div id="pagina-base-de-ajuda" className="h-[calc(100vh-64px)] flex flex-col bg-slate-950 overflow-hidden text-slate-200 font-sans">
      
      {/* Topo do Módulo de Ajuda: Título, Busca & Filtros Rápidos */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2 font-outfit">
              <BookOpen size={20} className="text-[#0a50ff]" />
              Ajuda, Documentação & Procedimentos Operacionais
              <span className="text-[10px] bg-[#0a50ff]/20 text-[#55b0ff] border border-[#0a50ff]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                NAP v2.8 Digify
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manuais técnicos, arquitetura telecom, CRM 360, Kanban, conformidade regulatória SCM/LGPD, NOC, PABX e homologação.
            </p>
          </div>

          {/* Campo de Pesquisa em Tempo Real */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="input-busca-ajuda"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por CRM, Kanban, Digify, Zabbix, URA, Contrato SCM..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#0a50ff]/30 focus:border-[#0a50ff] transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Barra de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#0a50ff] text-white shadow-sm shadow-[#0a50ff]/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Principal Dividido em Sidebar e Área de Leitura */}
      <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6">
        
        {/* Sidebar Esquerda: Lista de Tópicos */}
        <div className="w-full sm:w-72 md:w-80 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
            <span>Tópicos ({filteredSections.length})</span>
            {searchQuery && (
              <span className="text-[10px] text-[#55b0ff] lowercase font-normal">
                filtrado por "{searchQuery}"
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {filteredSections.map((sec) => {
              const isSelected = activeSection.id === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  id={`btn-topico-${sec.id}`}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-[#0a50ff] shadow-md shadow-[#0a50ff]/10 ring-1 ring-[#0a50ff]/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-[#0a50ff]/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${
                    isSelected ? 'bg-[#0a50ff] text-white' : 'bg-white/5 text-slate-400'
                  }`}>
                    {sec.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {sec.badge}
                      </span>
                      {isSelected && (
                        <ChevronRight size={13} className="text-[#55b0ff] shrink-0" />
                      )}
                    </div>
                    <h3 className={`text-xs font-bold leading-snug mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}>
                      {sec.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-normal">
                      {sec.summary}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-6 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                <HelpCircle size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Nenhum tópico encontrado para a busca informada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Área Central: Visualizador de Artigo / Documentação */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-y-auto p-6 md:p-8 relative shadow-2xl">
          {/* Header do Artigo */}
          <div className="pb-6 mb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0a50ff]/10 border border-[#0a50ff]/25 flex items-center justify-center text-[#55b0ff] shrink-0">
                {activeSection.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#55b0ff] bg-[#0a50ff]/10 border border-[#0a50ff]/25 px-2.5 py-0.5 rounded-full font-mono">
                  {activeSection.badge}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white mt-1 font-outfit">
                  {activeSection.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(window.location.href, 'link')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-800"
                title="Copiar link deste manual"
              >
                {copiedCode === 'link' ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tags de Indexação */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              Tags:
            </span>
            {activeSection.tags.map((tag) => (
              <span 
                key={tag} 
                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Renderização do Conteúdo Específico */}
          <div className="max-w-4xl">
            {activeSection.content}
          </div>

        </div>

      </div>

    </div>
  );
}
