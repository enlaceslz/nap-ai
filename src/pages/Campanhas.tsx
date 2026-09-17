import React, { useState, useEffect } from 'react';
import { 
  Megaphone, PhoneOutgoing, MessageCircle, Play, Pause, Plus, Search, 
  BarChart2, Users, CheckCircle2, Bell, Send, ShieldCheck, Smartphone, 
  DollarSign, Zap, Clock, CreditCard, ArrowRight, ShieldAlert, Sparkles, 
  RefreshCw, AlertTriangle, X, Settings, Sliders, Eye, Copy, Check, 
  Filter, ExternalLink, MessageSquare, PhoneCall, Bot
} from 'lucide-react';
import { registrarAcaoAuditoria } from '../lib/audit';

export default function Campanhas() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'voz' | 'push' | 'regua' | 'ativos'>('regua');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const [pushStatus, setPushStatus] = useState<any>(null);
  const [loadingPush, setLoadingPush] = useState(false);
  const [novoPushTitulo, setNovoPushTitulo] = useState('');
  const [novoPushMensagem, setNovoPushMensagem] = useState('');
  const [novoPushCategoria, setNovoPushCategoria] = useState<'cobranca' | 'suporte' | 'manutencao' | 'marketing' | 'geral'>('cobranca');
  const [feedbackPush, setFeedbackPush] = useState<string | null>(null);

  // Régua de Cobrança com IA & Automação Completa
  const [reguaConfig, setReguaConfig] = useState<any>(null);
  const [loadingRegua, setLoadingRegua] = useState(false);
  const [executandoFase, setExecutandoFase] = useState<string | null>(null);
  const [feedbackRegua, setFeedbackRegua] = useState<string | null>(null);

  // Estados Avançados da Régua (Modais, Filtros e Simulador)
  const [modalConfigRegua, setModalConfigRegua] = useState(false);
  const [modalTemplatesRegua, setModalTemplatesRegua] = useState(false);
  const [templateFaseAtiva, setTemplateFaseAtiva] = useState<'d_menos_3' | 'd_zero' | 'd_mais_3' | 'd_mais_7'>('d_menos_3');
  const [templatesLocais, setTemplatesLocais] = useState<Record<string, string>>({});
  const [configLocal, setConfigLocal] = useState<any>({
    ativa: true,
    horarioInicio: "08:30",
    horarioFim: "19:30",
    descontoPontualidade: 10,
    diasAntesVencimento: 3,
    diasAposVencimentoTolerancia: 3,
    diasAposVencimentoBloqueio: 7,
    canais: { whatsapp: true, sms: true, push: true, email: false }
  });
  const [salvandoConfigRegua, setSalvandoConfigRegua] = useState(false);
  const [telefoneTeste, setTelefoneTeste] = useState('(11) 98765-4321');
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<any>(null);
  const [filtroFaseFila, setFiltroFaseFila] = useState<string>('todas');
  const [filtroStatusEnvio, setFiltroStatusEnvio] = useState<string>('todos');
  const [disparandoClienteId, setDisparandoClienteId] = useState<string | null>(null);
  const [pixCopiadoId, setPixCopiadoId] = useState<string | null>(null);

  // Campanhas Ativas (WhatsApp e Voz)
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [isModalNovaCampanhaOpen, setIsModalNovaCampanhaOpen] = useState(false);
  const [salvandoCampanha, setSalvandoCampanha] = useState(false);
  const [feedbackCampanha, setFeedbackCampanha] = useState<string | null>(null);

  const [formCampanha, setFormCampanha] = useState({
    nome: '',
    canal: 'whatsapp' as 'whatsapp' | 'voz' | 'push',
    tipo: 'HSM Template',
    leads: 500,
    mensagem: ''
  });

  const fetchPushStatus = () => {
    fetch('/api/push/status')
      .then(res => res.json())
      .then(data => setPushStatus(data))
      .catch(() => {});
  };

  const fetchReguaConfig = () => {
    fetch('/api/cobranca/regua')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setReguaConfig(data.config);
          if (data.config.templates) setTemplatesLocais(data.config.templates);
          setConfigLocal({
            ativa: data.config.ativa,
            horarioInicio: data.config.horarioInicio || "08:30",
            horarioFim: data.config.horarioFim || "19:30",
            descontoPontualidade: data.config.descontoPontualidade || 10,
            diasAntesVencimento: data.config.diasAntesVencimento || 3,
            diasAposVencimentoTolerancia: data.config.diasAposVencimentoTolerancia || 3,
            diasAposVencimentoBloqueio: data.config.diasAposVencimentoBloqueio || 7,
            canais: data.config.canais || { whatsapp: true, sms: true, push: true, email: false }
          });
        }
      })
      .catch(() => {});
  };

  const handleSalvarConfigRegua = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfigRegua(true);
    try {
      const res = await fetch('/api/cobranca/regua', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configLocal)
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackRegua("Parâmetros e horários da régua salvos com sucesso!");
        fetchReguaConfig();
        setModalConfigRegua(false);
        setTimeout(() => setFeedbackRegua(null), 4000);
      }
    } catch {
      setFeedbackRegua("Erro ao salvar parâmetros da régua.");
    } finally {
      setSalvandoConfigRegua(false);
    }
  };

  const handleSalvarTemplatesRegua = async () => {
    setSalvandoConfigRegua(true);
    try {
      const res = await fetch('/api/cobranca/regua', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: templatesLocais })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackRegua("Templates de cobrança atualizados com sucesso!");
        fetchReguaConfig();
        setModalTemplatesRegua(false);
        setTimeout(() => setFeedbackRegua(null), 4000);
      }
    } catch {
      setFeedbackRegua("Erro ao salvar templates.");
    } finally {
      setSalvandoConfigRegua(false);
    }
  };

  const handleSimularTesteEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviandoTeste(true);
    setResultadoTeste(null);
    try {
      const res = await fetch('/api/cobranca/regua/simular-teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: telefoneTeste,
          fase: templateFaseAtiva
        })
      });
      const data = await res.json();
      if (data.sucesso) {
        setResultadoTeste(data);
      }
    } catch {
      setResultadoTeste({ sucesso: false, mensagem: "Erro ao simular envio de teste." });
    } finally {
      setEnviandoTeste(false);
    }
  };

  const handleDispararIndividual = async (id: string) => {
    setDisparandoClienteId(id);
    try {
      const res = await fetch('/api/cobranca/regua/disparar-individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackRegua(data.mensagem);
        fetchReguaConfig();
        setTimeout(() => setFeedbackRegua(null), 4000);
      }
    } catch {
      setFeedbackRegua("Falha ao enviar cobrança individual.");
    } finally {
      setDisparandoClienteId(null);
    }
  };

  const handleCopiarPix = (id: string, chave: string) => {
    navigator.clipboard.writeText(chave);
    setPixCopiadoId(id);
    setTimeout(() => setPixCopiadoId(null), 2500);
  };

  const fetchCampanhas = () => {
    fetch('/api/campanhas')
      .then(res => res.json())
      .then(data => {
        if (data.campanhas) setCampanhas(data.campanhas);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPushStatus();
    fetchReguaConfig();
    fetchCampanhas();
  }, []);

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/campanhas/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchCampanhas();
      }
    } catch {}
  };

  const handleCriarCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCampanha.nome) return;
    setSalvandoCampanha(true);
    try {
      const res = await fetch('/api/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formCampanha.nome,
          canal: formCampanha.canal,
          tipo: formCampanha.tipo,
          leads: Number(formCampanha.leads) || 100,
          mensagemOuTemplate: formCampanha.mensagem
        })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackCampanha(data.mensagem);
        registrarAcaoAuditoria({
          modulo: 'Campanhas',
          acao: `Criação e Disparo de Campanha: ${formCampanha.nome}`,
          detalhes: `Campanha '${formCampanha.nome}' iniciada no canal ${formCampanha.canal.toUpperCase()} para ${formCampanha.leads} destinatários`,
          categoria: 'disparo',
          severidade: 'info',
          payloadDepois: { nome: formCampanha.nome, canal: formCampanha.canal, leads: formCampanha.leads }
        });
        fetchCampanhas();
        setIsModalNovaCampanhaOpen(false);
        setFormCampanha({
          nome: '',
          canal: activeTab === 'voz' ? 'voz' : 'whatsapp',
          tipo: activeTab === 'voz' ? 'URA Reversa' : 'HSM Template',
          leads: 500,
          mensagem: ''
        });
        setTimeout(() => setFeedbackCampanha(null), 4000);
      }
    } catch {
      setFeedbackCampanha('Erro ao criar campanha.');
    } finally {
      setSalvandoCampanha(false);
    }
  };

  const handleExecutarFaseRegua = async (fase: string) => {
    setExecutandoFase(fase);
    setFeedbackRegua(null);
    try {
      const res = await fetch('/api/cobranca/regua/executar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackRegua(data.mensagem);
        fetchReguaConfig();
      }
    } catch {
      setFeedbackRegua("Falha ao processar disparo da régua.");
    } finally {
      setExecutandoFase(null);
    }
  };

  const handleEnviarPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPushTitulo || !novoPushMensagem) return;
    setLoadingPush(true);
    setFeedbackPush(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: novoPushTitulo,
          mensagem: novoPushMensagem,
          categoria: novoPushCategoria,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedbackPush(`Transmissão realizada: ${data.mensagem}`);
        setNovoPushTitulo('');
        setNovoPushMensagem('');
        fetchPushStatus();
      }
    } catch {
      setFeedbackPush('Erro ao transmitir notificação push.');
    } finally {
      setLoadingPush(false);
    }
  };

  const defaultWhatsapp = [
    { id: 1, nome: "Cobrança Preventiva (Vencimento -3 dias)", leads: 1250, processados: 450, conversao: "12%", status: "Rodando", tipo: "HSM Template" },
    { id: 2, nome: "Promoção Upgrade Fibra 1GB", leads: 3200, processados: 3200, conversao: "8.5%", status: "Concluída", tipo: "HSM Template" },
    { id: 3, nome: "Aviso Manutenção Programada (Bairro Centro)", leads: 850, processados: 0, conversao: "0%", status: "Agendada", tipo: "Texto Livre" },
  ];

  const defaultVoz = [
    { id: 4, nome: "Retenção de Cancelamentos (Discador Preditivo)", leads: 150, processados: 85, conversao: "22%", status: "Rodando", dropRate: "3%", tipo: "URA Reversa" },
    { id: 5, nome: "Pesquisa NPS Automática (URA Reversa)", leads: 500, processados: 500, conversao: "64%", status: "Concluída", dropRate: "1%", tipo: "URA Asterisk" },
  ];

  const campanhasWhatsapp = campanhas.length > 0 
    ? campanhas.filter(c => c.canal === 'whatsapp') 
    : defaultWhatsapp;

  const campanhasVoz = campanhas.length > 0 
    ? campanhas.filter(c => c.canal === 'voz') 
    : defaultVoz;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit flex items-center gap-2">
            <Megaphone className="text-blue-400" size={24} />
            Operação Ativa (Campanhas)
          </h1>
          <p className="text-sm text-slate-400 mt-1">Disparo em massa, discador automático (Asterisk 20+) e réguas de relacionamento.</p>
          {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-bottom-5">
          {toastMsg}
        </div>
      )}
</div>
        <button 
          onClick={() => {
            setFormCampanha({
              nome: '',
              canal: activeTab === 'voz' ? 'voz' : 'whatsapp',
              tipo: activeTab === 'voz' ? 'URA Reversa' : 'HSM Template',
              leads: 500,
              mensagem: ''
            });
            setIsModalNovaCampanhaOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all -700/20 hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> Nova Campanha
        </button>
      </header>

      {/* Feedback de Campanha */}
      {feedbackCampanha && (
        <div className="mx-6 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            {feedbackCampanha}
          </div>
          <button onClick={() => setFeedbackCampanha(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sm:px-6 pt-6 flex gap-4 border-b border-white/5 shrink-0 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setActiveTab('regua')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'regua' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          <Zap size={18} className="text-amber-400" /> Régua de Cobrança IA (Auto-Billing)
        </button>
        <button 
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'whatsapp' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          <MessageCircle size={18} /> Disparo de WhatsApp
        </button>
        <button 
          onClick={() => setActiveTab('voz')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'voz' ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          <PhoneOutgoing size={18} /> Discador Automático (Voz)
        </button>
        <button 
          onClick={() => setActiveTab('push')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'push' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          <Bell size={18} /> Notificações Push (PWA)
        </button>
        <button 
          onClick={() => setActiveTab('ativos')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ativos' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
        >
          <Sparkles size={18} /> Ativos & Templates
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Banner de Diretriz Omnichannel: Portal como Canal Primário & WhatsApp sob critério */}
          <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-gradient-to-r from-blue-950/20 via-slate-900 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Canal Primário: Portal do Cliente (PWA)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">CUSTO ZERO</span>
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Notificações Push e faturas são priorizadas no aplicativo do assinante. O envio via WhatsApp WABA fica a critério do operador, com suporte 24h respondido pela MaIA.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Bot size={12} /> MaIA 24h Ativa
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  {activeTab === 'regua' ? 'Clientes Notificados Hoje' : activeTab === 'push' ? 'Dispositivos Inscritos (Push)' : activeTab === 'ativos' ? 'Templates Aprovados' : 'Leads Ativos'}
                </p>
                <p className="text-2xl font-bold text-white font-outfit">
                  {activeTab === 'regua' ? (reguaConfig?.estatisticas?.totalDisparadosHoje || 84) : activeTab === 'push' ? (pushStatus?.total_inscritos || 1) : activeTab === 'ativos' ? '24' : '5,300'}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  {activeTab === 'regua' ? 'Recuperado via PIX Hoje' : activeTab === 'push' ? 'Taxa de Entrega Push' : activeTab === 'ativos' ? 'Taxa de Aprovação HSM' : 'Taxa de Conversão'}
                </p>
                <p className="text-2xl font-bold text-emerald-400 font-outfit">
                  {activeTab === 'regua' ? `R$ ${(reguaConfig?.estatisticas?.valorRecuperadoHoje || 3896).toFixed(2)}` : activeTab === 'push' ? '98.5%' : activeTab === 'ativos' ? '98%' : '18.4%'}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  {activeTab === 'regua' ? 'Taxa de Conversão PIX' : activeTab === 'push' ? 'Disparos Push Efetuados' : activeTab === 'ativos' ? 'Áudios de URA' : 'Campanhas Rodando'}
                </p>
                <p className="text-2xl font-bold text-white font-outfit">
                  {activeTab === 'regua' ? (reguaConfig?.estatisticas?.taxaConversaoPix || '46.4%') : activeTab === 'push' ? (pushStatus?.historico_recente?.length || 1) : activeTab === 'ativos' ? '12' : '2'}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  {activeTab === 'regua' ? 'Faturas Baixadas Hoje' : activeTab === 'ativos' ? 'Sincronização Meta' : 'Sincronia Radius / MikroTik'}
                </p>
                <p className="text-2xl font-bold text-white font-outfit">
                  {activeTab === 'regua' ? (reguaConfig?.estatisticas?.faturasRecuperadasPix || 39) : activeTab === 'ativos' ? 'Online' : '100%'}
                </p>
              </div>
            </div>
          </div>

          {activeTab === 'regua' ? (
            /* Régua Inteligente de Cobrança com IA */
            <div className="space-y-6">
              {/* Header do Módulo */}
              <div className="bg-slate-900 rounded-3xl border border-white/5 p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-outfit flex flex-wrap items-center gap-2">
                        Régua Ativa com Negociação e PIX Copia-e-Cola
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">AUTOMATIZADA</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                          {configLocal.horarioInicio} às {configLocal.horarioFim}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Disparo automatizado de mensagens via WhatsApp com chave PIX dinâmica antes, no dia e após o vencimento, reduzindo bloqueios no concentrador MikroTik/Radius.
                      </p>
                    </div>
                  </div>
                  
                  {/* Botões de Ação Rápida no Topo */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setModalConfigRegua(true)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
                    >
                      <Sliders size={14} className="text-amber-400" />
                      Parâmetros & Horários
                    </button>

                    <button 
                      onClick={() => setModalTemplatesRegua(true)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
                    >
                      <Eye size={14} className="text-blue-400" />
                      Templates & Preview
                    </button>

                    <button 
                      onClick={fetchReguaConfig} 
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5"
                      title="Atualizar Métricas"
                    >
                      <RefreshCw size={16} />
                    </button>

                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      SGP & Radius Online
                    </span>
                  </div>
                </div>

                {feedbackRegua && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      {feedbackRegua}
                    </div>
                    <button onClick={() => setFeedbackRegua(null)} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* As 4 Fases da Régua Visual */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Fase 1: D-3 */}
                  <div onClick={() => showToast('Abrindo detalhes do card')} className="bg-slate-950 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">FASE 1 • D-3</span>
                        <span className="text-[11px] text-slate-500">Preventivo</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Lembrete Amigável</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Aviso cordial 3 dias antes do vencimento com Copia-e-Cola do PIX e desconto de R$ {configLocal.descontoPontualidade?.toFixed(2) || '10,00'}.
                      </p>
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 font-mono line-clamp-2">
                        {reguaConfig?.templates?.d_menos_3 || "Olá, {{nome_cliente}}! Sua fatura vence em 3 dias..."}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleExecutarFaseRegua('d_menos_3')}
                        disabled={executandoFase === 'd_menos_3'}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {executandoFase === 'd_menos_3' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        Disparar Lote D-3 (35 clientes)
                      </button>
                    </div>
                  </div>

                  {/* Fase 2: D0 */}
                  <div onClick={() => showToast('Abrindo detalhes do card')} className="bg-slate-950 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">FASE 2 • D0</span>
                        <span className="text-[11px] text-amber-400 font-bold">Vence Hoje</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Vencimento da Fatura</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Lembrete matinal no dia do vencimento com PIX e link da 2ª via sem taxas.
                      </p>
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 font-mono line-clamp-2">
                        {reguaConfig?.templates?.d_zero || "Sua mensalidade vence HOJE. Pague com o QR Code abaixo..."}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleExecutarFaseRegua('d_zero')}
                        disabled={executandoFase === 'd_zero'}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {executandoFase === 'd_zero' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        Disparar Lote D0 (22 clientes)
                      </button>
                    </div>
                  </div>

                  {/* Fase 3: D+3 */}
                  <div onClick={() => showToast('Abrindo detalhes do card')} className="bg-slate-950 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FASE 3 • D+3</span>
                        <span className="text-[11px] text-emerald-400">Tolerância</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Auto-Desbloqueio & PIX</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Notificação cordial com oferta de Desbloqueio em Confiança 24h direto no Portal.
                      </p>
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 font-mono line-clamp-2">
                        {reguaConfig?.templates?.d_mais_3 || "Não identificamos o pagamento. Precisa de 24h de liberação?..."}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleExecutarFaseRegua('d_mais_3')}
                        disabled={executandoFase === 'd_mais_3'}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {executandoFase === 'd_mais_3' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        Disparar Lote D+3 (12 clientes)
                      </button>
                    </div>
                  </div>

                  {/* Fase 4: D+7 */}
                  <div onClick={() => showToast('Abrindo detalhes do card')} className="bg-slate-950 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">FASE 4 • D+7</span>
                        <span className="text-[11px] text-red-400 font-bold">Pré-Bloqueio</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Aviso de Suspensão</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Último aviso legal antes da redução de velocidade no concentrador PPPoE/Radius.
                      </p>
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 font-mono line-clamp-2">
                        {reguaConfig?.templates?.d_mais_7 || "URGENTE: Sua conexão entrará em redução em 24h. Pague via PIX..."}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleExecutarFaseRegua('d_mais_7')}
                        disabled={executandoFase === 'd_mais_7'}
                        className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {executandoFase === 'd_mais_7' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        Disparar Lote D+7 (8 clientes)
                      </button>
                    </div>
                  </div>
                </div>

                {/* FILA DE ASSINANTES NA RÉGUA HOJE */}
                <div className="mt-8 bg-slate-950 border border-white/5 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users size={16} className="text-blue-400" />
                        Assinantes na Fila da Régua Hoje
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {reguaConfig?.filaAssinantes?.length || 6} assinantes
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Gerencie notificações individuais com envio pontual de WhatsApp, cópia de PIX e status de sincronia com o concentrador.
                      </p>
                    </div>

                    {/* Filtros da Fila */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => setFiltroFaseFila('todas')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filtroFaseFila === 'todas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Todas
                        </button>
                        <button 
                          onClick={() => setFiltroFaseFila('d_menos_3')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filtroFaseFila === 'd_menos_3' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                          D-3
                        </button>
                        <button 
                          onClick={() => setFiltroFaseFila('d_zero')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filtroFaseFila === 'd_zero' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                          D0
                        </button>
                        <button 
                          onClick={() => setFiltroFaseFila('d_mais_3')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filtroFaseFila === 'd_mais_3' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                          D+3
                        </button>
                        <button 
                          onClick={() => setFiltroFaseFila('d_mais_7')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filtroFaseFila === 'd_mais_7' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
                        >
                          D+7
                        </button>
                      </div>

                      <select 
                        value={filtroStatusEnvio}
                        onChange={(e) => setFiltroStatusEnvio(e.target.value)}
                        className="bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
                      >
                        <option value="todos">Status: Todos</option>
                        <option value="pendente">Apenas Pendentes</option>
                        <option value="enviado">Já Notificados</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabela de Assinantes */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400 uppercase tracking-wider border-b border-white/5 text-[10px]">
                        <tr>
                          <th className="py-3 px-3">Assinante</th>
                          <th className="py-3 px-3">Plano & Valor</th>
                          <th className="py-3 px-3">Fase & Vencimento</th>
                          <th className="py-3 px-3">Concentrador</th>
                          <th className="py-3 px-3">Status Envio</th>
                          <th className="py-3 px-3 text-right">Ações Rápidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {((reguaConfig?.filaAssinantes || []) as any[])
                          .filter(cli => filtroFaseFila === 'todas' || cli.fase === filtroFaseFila)
                          .filter(cli => filtroStatusEnvio === 'todos' || cli.statusEnvio === filtroStatusEnvio)
                          .map((cli) => {
                            const faseBadge = {
                              d_menos_3: { label: 'D-3 • Preventivo', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                              d_zero: { label: 'D0 • Vence Hoje', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                              d_mais_3: { label: 'D+3 • Tolerância', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                              d_mais_7: { label: 'D+7 • Pré-Bloqueio', class: 'bg-red-500/10 text-red-400 border-red-500/20' }
                            }[cli.fase as 'd_menos_3' | 'd_zero' | 'd_mais_3' | 'd_mais_7'];

                            return (
                              <tr key={cli.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-white">{cli.nome}</div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span>{cli.telefone}</span>
                                    <span>•</span>
                                    <span className="text-slate-500">{cli.bairro}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="text-white font-medium">{cli.plano}</div>
                                  <div className="text-xs font-mono font-bold text-emerald-400">R$ {cli.valor?.toFixed(2)}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${faseBadge?.class}`}>
                                    {faseBadge?.label}
                                  </span>
                                  <div className="text-[11px] text-slate-400 mt-1">{cli.vencimento}</div>
                                </td>
                                <td className="py-3 px-3">
                                  {cli.statusRadius === 'bloqueio_parcial' ? (
                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                                      Bloqueio Parcial
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                      Conexão Ativa
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {cli.statusEnvio === 'enviado' ? (
                                    <div>
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                                        <Check size={10} /> Enviado
                                      </span>
                                      <div className="text-[10px] text-slate-500 mt-0.5">{cli.ultimoEnvio || 'Hoje'}</div>
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                                      <Clock size={10} /> Pendente
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => handleCopiarPix(cli.id, cli.pixCopiaECola)}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all border border-white/5"
                                      title="Copiar Chave PIX"
                                    >
                                      {pixCopiadoId === cli.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>

                                    <a 
                                      href={`https://wa.me/55${cli.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${cli.nome}, segue o código PIX da sua fatura de internet:\n\n${cli.pixCopiaECola}`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all border border-emerald-500/20"
                                      title="Conversar via WhatsApp"
                                    >
                                      <MessageSquare size={14} />
                                    </a>

                                    <button 
                                      onClick={() => handleDispararIndividual(cli.id)}
                                      disabled={disparandoClienteId === cli.id}
                                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                      title="Disparar régua agora via WABA"
                                    >
                                      {disparandoClienteId === cli.id ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                      ) : (
                                        <Send size={12} />
                                      )}
                                      {cli.statusEnvio === 'enviado' ? 'Reenviar' : 'Disparar'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Histórico Recente de Disparos da Régua */}
                <div className="mt-8">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" /> Histórico Recente de Disparos Automatizados da Régua
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-white/5 rounded-xl overflow-hidden">
                      <thead className="bg-slate-950 text-slate-400 border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3">Fase da Régua</th>
                          <th className="px-4 py-3">Disparados</th>
                          <th className="px-4 py-3">PIX Gerados</th>
                          <th className="px-4 py-3">Taxa Entrega</th>
                          <th className="px-4 py-3">Executado em</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {(reguaConfig?.historicoExecucoes || [
                          { id: "1", fase: "D-3 (Lembrete Preventivo)", disparados: 42, pixGerados: 42, sucesso: 42, data: "Hoje, às 08:30" },
                          { id: "2", fase: "D0 (Vence Hoje)", disparados: 28, pixGerados: 28, sucesso: 28, data: "Hoje, às 09:15" },
                          { id: "3", fase: "D+3 (Notificação de Tolerância)", disparados: 14, pixGerados: 14, sucesso: 14, data: "Hoje, às 10:00" }
                        ]).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                              <Zap size={13} className="text-amber-400" />
                              {item.fase}
                            </td>
                            <td className="px-4 py-3 font-mono">{item.disparados} destinatários</td>
                            <td className="px-4 py-3 font-mono text-emerald-400">{item.pixGerados} chaves criadas</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">100%</td>
                            <td className="px-4 py-3 text-slate-400">{item.data}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">CONCLUÍDO</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'ativos' ? (
            /* ATIVOS DE CAMPANHA (TEMPLATES) */
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-white/5 p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white font-outfit">Templates e Ativos</h2>
                      <p className="text-sm text-slate-400 mt-0.5">Gestão de HSM (WhatsApp) e Áudios de URA</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Novo Template HSM
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Template HSM WhatsApp */}
                  <div onClick={() => showToast('Editando template HSM')} className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aprovado Meta
                        </span>
                        <MessageCircle size={16} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">cobranca_aviso_d3</h3>
                      <p className="text-xs text-slate-400 italic">"Olá {`{{1}}`}! Identificamos que sua fatura vence em {`{{2}}`}. O código PIX Copia e Cola é: {`{{3}}`}..."</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); showToast('Visualizando ativo...'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Eye size={12} /> Ver</button>
                      <button onClick={(e) => { e.stopPropagation(); showToast('Ativo copiado para a área de transferência!'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Copy size={12} /> Copiar</button>
                    </div>
                  </div>
                  
                  {/* Template HSM WhatsApp - Vendas */}
                  <div onClick={() => showToast('Editando template HSM')} className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Aprovado Meta
                        </span>
                        <MessageCircle size={16} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">oferta_wifi6_mesh</h3>
                      <p className="text-xs text-slate-400 italic">"Oi {`{{1}}`}! Como assinante fiel, liberamos um upgrade para roteador Wi-Fi 6 Mesh na sua casa por apenas {`{{2}}`}..."</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); showToast('Visualizando ativo...'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Eye size={12} /> Ver</button>
                      <button onClick={(e) => { e.stopPropagation(); showToast('Ativo copiado para a área de transferência!'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Copy size={12} /> Copiar</button>
                    </div>
                  </div>

                  {/* Audio URA */}
                  <div onClick={() => showToast('Editando template HSM')} className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Áudio Gravado
                        </span>
                        <PhoneCall size={16} className="text-blue-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">ura_aviso_corte.mp3</h3>
                      <p className="text-xs text-slate-400 italic flex items-center gap-1"><Clock size={12} /> Duração: 00:15</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); showToast('Reproduzindo áudio...'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Play size={12} /> Ouvir</button>
                      <button onClick={(e) => { e.stopPropagation(); showToast('Trocar arquivo de áudio...'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><RefreshCw size={12} /> Trocar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'push' ? (
            /* Push Notifications Management */
            <div className="space-y-6">
              {/* Form de Disparo Push */}
              <div className="bg-slate-900 rounded-3xl border border-white/5 p-6  ">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white font-outfit">Transmitir Alerta Web Push (PWA)</h3>
                      <p className="text-xs text-slate-500">Envia notificação instantânea para a tela dos clientes com PWA instalado.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gateway Push Operacional
                  </span>
                </div>

                {feedbackPush && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                    {feedbackPush}
                  </div>
                )}

                <form onSubmit={handleEnviarPush} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Título da Notificação</label>
                      <input 
                        type="text" 
                        value={novoPushTitulo} 
                        onChange={(e) => setNovoPushTitulo(e.target.value)}
                        placeholder="Ex: Fatura Pronta para Pagamento ou Aviso de Manutenção" 
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-600 "
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pilar / Categoria</label>
                      <select 
                        value={novoPushCategoria} 
                        onChange={(e: any) => setNovoPushCategoria(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-600"
                      >
                        <option value="cobranca">Cobrança (SGP)</option>
                        <option value="suporte">Suporte Técnico</option>
                        <option value="manutencao">Manutenção de Fibra</option>
                        <option value="marketing">Promoção / Vendas</option>
                        <option value="geral">Aviso Geral</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mensagem / Texto do Push</label>
                    <textarea 
                      value={novoPushMensagem} 
                      onChange={(e) => setNovoPushMensagem(e.target.value)}
                      rows={2} 
                      placeholder="Ex: Olá! Sua fatura do plano Fibra 500MB vence amanhã. Clique para pagar via PIX sem juros." 
                      className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-600 "
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <ShieldCheck size={14} className="text-slate-400" />
                      Assinado com chaves VAPID RFC-8292 seguras.
                    </p>
                    <button 
                      type="submit" 
                      disabled={loadingPush}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all  -600/20 active:scale-95 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {loadingPush ? 'Transmitindo...' : 'Disparar Notificação Push'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Histórico e Dispositivos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-3xl border border-white/5 p-6  ">
                  <h4 className="font-bold text-white font-outfit mb-4 flex items-center gap-2">
                    <Smartphone size={18} className="text-slate-500" /> Dispositivos Inscritos
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(pushStatus?.inscricoes || []).map((sub: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{sub.cliente_nome}</p>
                          <p className="text-xs text-slate-500">{sub.dispositivo} • ID: {sub.cliente_id}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ativo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl border border-white/5 p-6  ">
                  <h4 className="font-bold text-white font-outfit mb-4 flex items-center gap-2">
                    <Bell size={18} className="text-slate-500" /> Histórico de Envios
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(pushStatus?.historico_recente || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{item.titulo}</span>
                          <span className="text-[10px] text-slate-500">{item.enviado_em}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{item.mensagem}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* List */
            <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden  ">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar campanha..." 
                    className="w-full bg-slate-950 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-blue-600/50 "
                  />
                </div>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">Campanha</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">Progresso</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">Métricas</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                    <th className="px-6 py-4 text-center text-[10px] uppercase tracking-wider font-bold text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(activeTab === 'whatsapp' ? campanhasWhatsapp : campanhasVoz).map((camp, i) => {
                    const percent = (camp.processados / camp.leads) * 100;
                    return (
                      <tr key={i} className="hover:bg-slate-950/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{camp.nome}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">ID: CMP-{(1000 + camp.id).toString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{camp.processados} / {camp.leads}</span>
                            <span className="font-bold text-slate-400">{Math.round(percent)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 border border-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${camp.status === 'Concluída' ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded w-max border border-emerald-200">Conv: {camp.conversao}</span>
                            {'dropRate' in camp && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded w-max border border-amber-200">Drop: {camp.dropRate}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${
                            camp.status === 'Rodando' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' :
                            camp.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-white/5 text-slate-400 border border-white/5'
                          }`}>
                            {camp.status === 'Rodando' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
                            {camp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {camp.status === 'Rodando' ? (
                            <button 
                              onClick={() => handleToggleStatus(camp.id)}
                              title="Pausar Campanha"
                              className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:scale-105 rounded-lg flex items-center justify-center transition-all mx-auto"
                            >
                              <Pause size={14} />
                            </button>
                          ) : (camp.status === 'Agendada' || camp.status === 'Pausada') ? (
                            <button 
                              onClick={() => handleToggleStatus(camp.id)}
                              title="Iniciar / Retomar Campanha"
                              className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 rounded-lg flex items-center justify-center transition-all mx-auto"
                            >
                              <Play size={14} className="ml-0.5" />
                            </button>
                          ) : (
                            <button className="w-8 h-8 bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg flex items-center justify-center transition-all mx-auto">
                              <BarChart2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Modal Nova Campanha */}
      {isModalNovaCampanhaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-outfit">Criar Nova Campanha</h3>
                  <p className="text-xs text-slate-400">Disparo em lote via WhatsApp WABA ou Discador Asterisk</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalNovaCampanhaOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCriarCampanha} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome da Campanha
                </label>
                <input 
                  type="text"
                  value={formCampanha.nome}
                  onChange={e => setFormCampanha({ ...formCampanha, nome: e.target.value })}
                  placeholder="Ex: Campanha Retenção - Bairro Morumbi"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Canal de Saída
                  </label>
                  <select 
                    value={formCampanha.canal}
                    onChange={(e: any) => {
                      const canal = e.target.value;
                      setFormCampanha({ 
                        ...formCampanha, 
                        canal,
                        tipo: canal === 'voz' ? 'URA Reversa' : 'HSM Template'
                      });
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="whatsapp">WhatsApp WABA</option>
                    <option value="voz">Discador Asterisk 20+ (Voz)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Tipo / Formato
                  </label>
                  <select 
                    value={formCampanha.tipo}
                    onChange={e => setFormCampanha({ ...formCampanha, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    {formCampanha.canal === 'whatsapp' ? (
                      <>
                        <option value="HSM Template">HSM Template (Aprovado Meta)</option>
                        <option value="Texto Livre">Texto Livre com Variáveis</option>
                        <option value="PIX Copia e Cola">Cobrança PIX Direta</option>
                      </>
                    ) : (
                      <>
                        <option value="URA Reversa">URA Reversa Interativa</option>
                        <option value="Discador Preditivo">Discador Preditivo (Operadores)</option>
                        <option value="Pesquisa NPS Voz">Pesquisa NPS com Reconhecimento de Voz</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantidade Estimada de Leads / Destinatários
                </label>
                <input 
                  type="number"
                  min={1}
                  value={formCampanha.leads}
                  onChange={e => setFormCampanha({ ...formCampanha, leads: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {formCampanha.canal === 'whatsapp' ? 'Mensagem / Parâmetros do HSM' : 'Script do Áudio / TTS da URA'}
                </label>
                <textarea 
                  rows={3}
                  value={formCampanha.mensagem}
                  onChange={e => setFormCampanha({ ...formCampanha, mensagem: e.target.value })}
                  placeholder={formCampanha.canal === 'whatsapp' 
                    ? "Olá {{1}}, temos uma condição especial para seu plano de {{2}} Mega..." 
                    : "Olá, aqui é do suporte técnico do provedor. Identificamos que você avaliou seu serviço recentemente..."}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalNovaCampanhaOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCampanha}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {salvandoCampanha ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Disparar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIGURAÇÃO DE PARÂMETROS & HORÁRIOS DA RÉGUA */}
      {modalConfigRegua && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Parâmetros da Régua de Cobrança</h3>
                  <p className="text-xs text-slate-400">Configure horários de disparo, canais ativos e regras financeiras</p>
                </div>
              </div>
              <button 
                onClick={() => setModalConfigRegua(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarConfigRegua} className="mt-5 space-y-4">
              {/* Status da Régua */}
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Automação da Régua Ativa</span>
                  <span className="text-[11px] text-slate-400">Permitir que o sistema analise e dispare cobranças nos horários definidos</span>
                </div>
                <input 
                  type="checkbox"
                  checked={configLocal.ativa}
                  onChange={e => setConfigLocal({ ...configLocal, ativa: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Janela de Horário Permitido */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Janela de Horário Permitida para Disparos
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Início dos Disparos</span>
                    <input 
                      type="time"
                      value={configLocal.horarioInicio || "08:30"}
                      onChange={e => setConfigLocal({ ...configLocal, horarioInicio: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Término Máximo</span>
                    <input 
                      type="time"
                      value={configLocal.horarioFim || "19:30"}
                      onChange={e => setConfigLocal({ ...configLocal, horarioFim: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Desconto de Pontualidade & Tolerância */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Desconto de Pontualidade (R$)
                  </label>
                  <input 
                    type="number"
                    step="0.50"
                    min="0"
                    value={configLocal.descontoPontualidade || 10}
                    onChange={e => setConfigLocal({ ...configLocal, descontoPontualidade: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Dias Tolerância (D+)
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="15"
                    value={configLocal.diasAposVencimentoTolerancia || 3}
                    onChange={e => setConfigLocal({ ...configLocal, diasAposVencimentoTolerancia: parseInt(e.target.value) || 3 })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Seleção de Canais */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Canais de Notificação Habilitados
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.04]">
                    <input 
                      type="checkbox"
                      checked={configLocal.canais?.whatsapp}
                      onChange={e => setConfigLocal({
                        ...configLocal,
                        canais: { ...configLocal.canais, whatsapp: e.target.checked }
                      })}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">WhatsApp WABA (Oficial)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.04]">
                    <input 
                      type="checkbox"
                      checked={configLocal.canais?.sms}
                      onChange={e => setConfigLocal({
                        ...configLocal,
                        canais: { ...configLocal.canais, sms: e.target.checked }
                      })}
                      className="accent-blue-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">SMS Flash / Gateway</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.04]">
                    <input 
                      type="checkbox"
                      checked={configLocal.canais?.push}
                      onChange={e => setConfigLocal({
                        ...configLocal,
                        canais: { ...configLocal.canais, push: e.target.checked }
                      })}
                      className="accent-indigo-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">Push Notification (PWA)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.04]">
                    <input 
                      type="checkbox"
                      checked={configLocal.canais?.email}
                      onChange={e => setConfigLocal({
                        ...configLocal,
                        canais: { ...configLocal.canais, email: e.target.checked }
                      })}
                      className="accent-purple-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">E-mail Transacional</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalConfigRegua(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoConfigRegua}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {salvandoConfigRegua ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITOR DE TEMPLATES & PREVIEW COM SIMULADOR DE ENVIO */}
      {modalTemplatesRegua && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Templates de Notificação da Régua</h3>
                  <p className="text-xs text-slate-400">Edite as mensagens de cada fase e teste o envio em tempo real</p>
                </div>
              </div>
              <button 
                onClick={() => setModalTemplatesRegua(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas das 4 Fases */}
            <div className="flex items-center gap-2 mt-4 pb-3 border-b border-white/5 shrink-0 overflow-x-auto">
              <button
                onClick={() => { setTemplateFaseAtiva('d_menos_3'); setResultadoTeste(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${templateFaseAtiva === 'd_menos_3' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Fase 1 • D-3 (Preventivo)
              </button>
              <button
                onClick={() => { setTemplateFaseAtiva('d_zero'); setResultadoTeste(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${templateFaseAtiva === 'd_zero' ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Fase 2 • D0 (Vence Hoje)
              </button>
              <button
                onClick={() => { setTemplateFaseAtiva('d_mais_3'); setResultadoTeste(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${templateFaseAtiva === 'd_mais_3' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Fase 3 • D+3 (Tolerância 24h)
              </button>
              <button
                onClick={() => { setTemplateFaseAtiva('d_mais_7'); setResultadoTeste(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${templateFaseAtiva === 'd_mais_7' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                Fase 4 • D+7 (Pré-Bloqueio)
              </button>
            </div>

            {/* Conteúdo Principal: Editor à Esquerda, Preview e Teste à Direita */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 overflow-y-auto pr-1">
              {/* Coluna Esquerda: Editor de Texto e Tags */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Texto do Template (WhatsApp / SMS)
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {templatesLocais[templateFaseAtiva]?.length || 0} caracteres
                    </span>
                  </div>
                  <textarea 
                    rows={8}
                    value={templatesLocais[templateFaseAtiva] || ''}
                    onChange={e => setTemplatesLocais({
                      ...templatesLocais,
                      [templateFaseAtiva]: e.target.value
                    })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed resize-none"
                    placeholder="Digite a mensagem do template..."
                  />
                </div>

                {/* Tags Disponíveis */}
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block mb-1.5">Tags Dinâmicas Disponíveis (Clique para inserir):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{{nome_cliente}}',
                      '{{plano}}',
                      '{{valor_fatura}}',
                      '{{data_vencimento}}',
                      '{{desconto_pontualidade}}',
                      '{{chave_pix}}',
                      '{{link_segunda_via}}'
                    ].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const atual = templatesLocais[templateFaseAtiva] || '';
                          setTemplatesLocais({
                            ...templatesLocais,
                            [templateFaseAtiva]: `${atual} ${tag}`
                          });
                        }}
                        className="px-2 py-1 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 rounded-lg text-[10px] font-mono border border-white/5 transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Preview Visual no WhatsApp e Simulador de Envio */}
              <div className="space-y-4">
                {/* Visualização de Balão WhatsApp */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Pré-Visualização Real no WhatsApp
                  </span>
                  <div className="bg-[#0b141a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-inner min-h-[190px]">
                    <div className="max-w-[90%] bg-[#005c4b] text-white p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow space-y-2">
                      <div className="whitespace-pre-line">
                        {(templatesLocais[templateFaseAtiva] || '')
                          .replace(/{{nome_cliente}}/g, "Carlos Silva")
                          .replace(/{{plano}}/g, "Fibra 500MB")
                          .replace(/{{valor_fatura}}/g, "99,90")
                          .replace(/{{data_vencimento}}/g, "15/10/2026")
                          .replace(/{{desconto_pontualidade}}/g, "10,00")
                          .replace(/{{chave_pix}}/g, "00020126580014BR.GOV.BCB.PIX0136pix-cobranca@isp.com.br520400005303986540599.905802BR5912CARLOS SILVA6009SAO PAULO62070503***6304E8A1")
                          .replace(/{{link_segunda_via}}/g, "https://isp.provedor.com.br/faturas/123")}
                      </div>
                      <div className="text-[10px] text-emerald-200/60 text-right flex items-center justify-end gap-1">
                        <span>10:42</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulador de Envio para Teste */}
                <form onSubmit={handleSimularTesteEnvio} className="bg-slate-950 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone size={14} className="text-emerald-400" />
                      Testar Envio com Número Real
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Simulador WABA</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={telefoneTeste}
                      onChange={e => setTelefoneTeste(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={enviandoTeste}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {enviandoTeste ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      Enviar Teste
                    </button>
                  </div>

                  {resultadoTeste && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[11px] font-mono flex items-center justify-between">
                      <span>{resultadoTeste.mensagem}</span>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Footer do Modal de Templates */}
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalTemplatesRegua(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSalvarTemplatesRegua}
                disabled={salvandoConfigRegua}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {salvandoConfigRegua ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar Todos os Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
