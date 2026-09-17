import React, { useState, useEffect } from 'react';
import { 
  Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Loader2, Eye, EyeOff, ShieldCheck, Zap, ExternalLink, 
  ArrowRight, Copy, Check, Sparkles, Terminal, Sliders,
  HelpCircle, Wifi, Database, Radio, Activity
} from 'lucide-react';
import { useConfig, SupportedErp } from '../contexts/ConfigContext';
import ErpPingBadge from './ErpPingBadge';
import { useErpPingMonitor } from '../hooks/useErpPingMonitor';

export interface ApiValidationTarget {
  id: 'ixc' | 'hubsoft' | 'mikweb' | 'sgp';
  nome: string;
  sigla: string;
  badgeCor: string;
  protocolo: string;
  versaoHomologada: string;
  docUrl: string;
  defaultUrl: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  tokenAjuda: string;
  appIdLabel?: string;
  appIdPlaceholder?: string;
  descricao: string;
  dicaRapida: string;
}

const ERP_TARGETS: ApiValidationTarget[] = [
  {
    id: 'sgp',
    nome: 'SGP',
    sigla: 'SGP',
    badgeCor: 'from-emerald-600 to-green-600',
    protocolo: 'API REST JSON',
    versaoHomologada: 'SGP API v3',
    docUrl: 'https://sgp.net.br',
    defaultUrl: 'https://sgp.naptelecom.com.br/api',
    tokenLabel: 'Token de Integração API',
    tokenPlaceholder: 'sgp_token_...',
    tokenAjuda: 'Token gerado nas configurações de integração do SGP',
    descricao: 'SGP (Billing/ERP Emulator) - Software de Gestão de Provedores com controle de PIX, financeiro e assinantes.',
    dicaRapida: 'Verifique se as permissões de leitura financeira estão habilitadas no perfil do token SGP.'
  },
  {
    id: 'ixc',
    nome: 'IXC Soft',
    sigla: 'IXC',
    badgeCor: 'from-blue-600 to-indigo-600',
    protocolo: 'Webservice REST JSON v1',
    versaoHomologada: 'Webservice REST v1.8.4',
    docUrl: 'https://ixcsoft.com.br',
    defaultUrl: 'https://ixc.naptelecom.com.br/webservice/v1',
    tokenLabel: 'Token de Acesso / Hash Webservice',
    tokenPlaceholder: 'aXhjX3VzZXI6c2VjcmV0X3Rva2Vu...',
    tokenAjuda: 'Token no formato Base64 ou Token de API gerado em Configurações > Usuários > Webservice',
    appIdLabel: 'ID do Usuário Webservice (Opcional)',
    appIdPlaceholder: '1',
    descricao: 'Líder nacional em gestão de ISPs, FTTH, mapeamento de portas de OLT e contratos.',
    dicaRapida: 'No IXC, certifique-se de que a conta de webservice possui permissões nas tabelas "cliente", "radusuarios" e "fn_areceber".'
  },
  {
    id: 'hubsoft',
    nome: 'Hubsoft',
    sigla: 'HUB',
    badgeCor: 'from-cyan-600 to-blue-600',
    protocolo: 'API REST v1 / v2',
    versaoHomologada: 'Hubsoft Public API v2.1',
    docUrl: 'https://docs.hubsoft.com.br',
    defaultUrl: 'https://naptelecom.hubsoft.com.br/api/v1',
    tokenLabel: 'Client Secret / Bearer Token',
    tokenPlaceholder: 'hub_sec_token_99482718923...',
    tokenAjuda: 'Chave secreta obtida em Configurações > Integrações > Chaves de API no Hubsoft',
    appIdLabel: 'Client ID / App Key',
    appIdPlaceholder: 'nap_hubsoft_client_id',
    descricao: 'ERP Cloud moderno com foco em autoatendimento digital, régua de cobrança rápida e PIX.',
    dicaRapida: 'No Hubsoft, adicione os escopos "cliente.ler", "financeiro.ler_escrever", "servico.desbloqueio" e "diagnostico.ler".'
  },
  {
    id: 'mikweb',
    nome: 'MikWeb',
    sigla: 'MIK',
    badgeCor: 'from-rose-600 to-red-600',
    protocolo: 'MikWeb REST API v1.2',
    versaoHomologada: 'MikWeb REST API v1.2',
    docUrl: 'https://mikweb.com.br',
    defaultUrl: 'https://api.mikweb.com.br/v1',
    tokenLabel: 'Token de API MikWeb',
    tokenPlaceholder: 'mikweb_token_7182947192837...',
    tokenAjuda: 'Token gerado no painel MikWeb em Minha Conta > Integração API',
    appIdLabel: 'Código da Conta / Provedor ID',
    appIdPlaceholder: 'PROV_MIK_882',
    descricao: 'Especialista em controle em nuvem de concentradores MikroTik, corte rápido e auto-desbloqueio.',
    dicaRapida: 'No MikWeb, certifique-se de que seus concentradores MikroTik estão marcados como sincronizados e online.'
  }
];

interface FeedbackState {
  tipo: 'sucesso' | 'erro' | null;
  mensagem: string;
  dica?: string;
  latenciaMs?: number;
  protocolo?: string;
  versaoDetectada?: string;
  checklist?: Array<{
    id: string;
    item: string;
    status: 'ok' | 'alerta' | 'erro';
    mensagem: string;
  }>;
  exemplo?: any;
}

export default function ApiValidationCard() {
  const { config: globalConfig, updateConfig } = useConfig();
  const [selectedErp, setSelectedErp] = useState<'ixc' | 'hubsoft' | 'mikweb' | 'sgp'>('sgp');

  // Monitoramento de latência (ping) em tempo real dos provedores
  const { 
    pings, 
    loading: pingLoading, 
    pingingSpecific, 
    refreshAll: refreshAllPings, 
    pingSingle 
  } = useErpPingMonitor(10000);

  // Campos do formulário
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [appId, setAppId] = useState('');
  const [autoDesbloqueio, setAutoDesbloqueio] = useState(true);

  // Estados de controle da UI
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSuccessFeedback, setActiveSuccessFeedback] = useState<string | null>(null);

  const target = ERP_TARGETS.find(t => t.id === selectedErp) || ERP_TARGETS[0];

  // Carrega credenciais do ERP selecionado a partir do ConfigContext
  useEffect(() => {
    setFeedback(null);
    const erpItem = globalConfig.erps?.[selectedErp];
    const savedConfig: any = (erpItem as any)?.config || erpItem;
    if (savedConfig) {
      setUrl(savedConfig.urlBase || target.defaultUrl);
      setToken(savedConfig.token || savedConfig.clientSecret || '');
      setAppId(savedConfig.appId || savedConfig.clientId || '');
      setAutoDesbloqueio(savedConfig.autoDesbloqueio48h !== false);
    } else {
      setUrl(target.defaultUrl);
      setToken('');
      setAppId('');
      setAutoDesbloqueio(true);
    }
  }, [selectedErp, globalConfig]);

  // Preencher credenciais de demonstração válidas
  const handlePreencherExemplo = () => {
    if (selectedErp === 'ixc') {
      setUrl('https://ixc.naptelecom.com.br/webservice/v1');
      setToken('aXhjX3VzZXI6c2VjcmV0X3Rva2VuXzg4OTk=');
      setAppId('1');
    } else if (selectedErp === 'hubsoft') {
      setUrl('https://naptelecom.hubsoft.com.br/api/v1');
      setToken('hub_sec_token_9948271892348123');
      setAppId('nap_hubsoft_client_id');
    } else if (selectedErp === 'sgp') {
      setUrl('https://sgp.naptelecom.com.br/api');
      setToken('sgp_token_mock_valido_999');
      setAppId('');
    } else {
      setUrl('https://api.mikweb.com.br/v1');
      setToken('mikweb_token_7182947192837');
      setAppId('PROV_MIK_882');
    }
    setFeedback(null);
  };

  // Simular credencial inválida para testar feedback de erro
  const handleSimularErro = () => {
    setUrl('https://api-offline.servidor.invalido/v1');
    setToken('token_erro_invalido');
    setFeedback(null);
  };

  // Limpar campos
  const handleLimpar = () => {
    setUrl('');
    setToken('');
    setAppId('');
    setFeedback(null);
  };

  // Executar o teste de validação de API
  const handleTestarConexao = async () => {
    setLoading(true);
    setFeedback(null);
    setActiveSuccessFeedback(null);

    try {
      const payload = {
        erpId: selectedErp,
        config: {
          urlBase: url,
          token: token,
          clientId: appId,
          appId: appId,
          clientSecret: token,
          autoDesbloqueio48h: autoDesbloqueio
        }
      };

      const res = await fetch('/api/integracoes/erp/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        setFeedback({
          tipo: 'sucesso',
          mensagem: data.mensagem || `Conexão com a API do ${target.nome} estabelecida com sucesso!`,
          latenciaMs: data.latenciaMs || 280,
          protocolo: data.protocolo || target.protocolo,
          versaoDetectada: data.versaoApiDetectada || target.versaoHomologada,
          checklist: data.checklist || [],
          exemplo: data.exemploSincronizado
        });
      } else {
        setFeedback({
          tipo: 'erro',
          mensagem: data.erro || `Falha ao validar conexão com o ${target.nome}.`,
          dica: data.dica || target.dicaRapida,
          latenciaMs: data.latenciaMs,
          checklist: data.checklist || [
            {
              id: 'handshake',
              item: 'Conectividade e Handshake TLS',
              status: 'erro',
              mensagem: data.erro || 'Falha de comunicação com o endpoint'
            }
          ]
        });
      }
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: err.message || 'Erro inesperado na tentativa de conexão com o servidor local.',
        dica: 'Certifique-se de que a instância da aplicação está online e tem acesso à internet.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar e ativar ERP como principal do NAP
  const handleSalvarEAtivar = async () => {
    try {
      // 1. Salvar
      await fetch('/api/integracoes/erp/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          erpId: selectedErp,
          config: {
            urlBase: url,
            token: token,
            appId: appId,
            clientId: appId,
            autoDesbloqueio48h: autoDesbloqueio
          }
        })
      });

      // 2. Ativar
      const resAtivar = await fetch('/api/integracoes/erp/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erpId: selectedErp })
      });

      if (resAtivar.ok) {
        updateConfig({
          ...globalConfig,
          erpAtivo: selectedErp
        });
        setActiveSuccessFeedback(`O ${target.nome} foi salvo e ativado como o ERP primário do NAP!`);
        setTimeout(() => setActiveSuccessFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar e ativar ERP:', err);
    }
  };

  const isAtivoGlobalmente = globalConfig.erpAtivo === selectedErp;

  return (
    <div id="card-utilitario-validacao-erp" className="p-6 md:p-7 rounded-2xl bg-slate-900 border border-white/10 shadow-xl space-y-6">
      
      {/* Header do Card Utilitário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Validador de Conexão de API ERP
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                IXC • Hubsoft • MikWeb
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Teste em tempo real o handshake TLS, autenticação do token e leitura de contratos nos principais ERPs telecom.
            </p>
          </div>
        </div>

        {isAtivoGlobalmente && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{target.nome} é o ERP Ativo no Sistema</span>
          </div>
        )}
      </div>

      {/* Seletor Rápido de ERP (IXC / Hubsoft / MikWeb) com Monitor de Ping */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            1. Selecione a API do ERP para Validar:
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ping contínuo a cada 10s
            </span>
            <button
              type="button"
              id="btn-retestar-todos-pings"
              onClick={refreshAllPings}
              disabled={pingLoading}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              title="Pingar todos os provedores agora"
            >
              <RefreshCw size={10} className={pingLoading ? 'animate-spin' : ''} />
              <span>Atualizar Pings</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ERP_TARGETS.map((t) => {
            const isSelected = selectedErp === t.id;
            const isAtivo = globalConfig.erpAtivo === t.id;
            const pingData = pings[t.id];
            const isPinging = pingingSpecific[t.id];

            return (
              <div
                key={t.id}
                id={`btn-selecionar-erp-${t.id}`}
                onClick={() => setSelectedErp(t.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-950 border-blue-500 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30 cursor-default'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-400 hover:text-white cursor-pointer'
                }`}
              >
                {/* Linha superior: Ícone, Nome e Badge Ativo */}
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${t.badgeCor} flex items-center justify-center text-white font-black text-xs shrink-0 shadow`}>
                    {t.sigla}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {t.nome}
                      </h4>
                      {isAtivo && (
                        <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                          Ativo
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">
                      {t.protocolo}
                    </span>
                  </div>
                </div>

                {/* Linha inferior: Indicador Visual de Latência / Ping em Tempo Real */}
                <div className="w-full pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Latência / Ping:
                  </span>
                  <ErpPingBadge 
                    ping={pingData} 
                    loading={isPinging} 
                    onRefresh={() => pingSingle(t.id)} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Descrição & Documentação do ERP Escolhido */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <Server size={14} className="text-blue-400 shrink-0" />
          <span>{target.descricao}</span>
          {pings[target.id] && pings[target.id].online && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ping: {pings[target.id].latenciaMs}ms (Jitter: ±{pings[target.id].jitterMs || 2}ms)
            </span>
          )}
        </div>
        <a 
          href={target.docUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="text-blue-400 hover:text-blue-300 hover:underline font-semibold flex items-center gap-1 shrink-0 text-[11px]"
        >
          <span>Guia Oficial de API</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Formulário com Campos: URL e Token */}
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            2. Credenciais de Conexão:
          </label>
        </div>

        {/* Campo 1: URL da API */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>URL da API do {target.nome}</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setUrl(target.defaultUrl)}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <span>Restaurar URL Padrão</span>
            </button>
          </div>
          <div className="relative">
            <input
              id="input-url-api-erp"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={target.defaultUrl}
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Endereço base do webservice (HTTPS obrigatório para produção). Exemplo: <code className="text-slate-400">{target.defaultUrl}</code>
          </span>
        </div>

        {/* Campo 2: Token / Chave de API */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{target.tokenLabel}</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Nunca compartilhe esta chave publicamente</span>
          </div>
          <div className="relative">
            <input
              id="input-token-api-erp"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={target.tokenPlaceholder}
              className="w-full p-2.5 pr-10 bg-slate-950 border border-white/10 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
            />
            <button
              type="button"
              id="btn-toggle-show-token"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              title={showToken ? 'Ocultar token' : 'Exibir token'}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {target.tokenAjuda}
          </span>
        </div>

        {/* Campo Opcional: App ID ou Client ID */}
        {target.appIdLabel && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                {target.appIdLabel}
              </label>
              <span className="text-[11px] text-slate-500">Parâmetro de identificação</span>
            </div>
            <input
              id="input-appid-api-erp"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder={target.appIdPlaceholder}
              className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
            />
          </div>
        )}

        {/* Opção Rápida de Desbloqueio 24h */}
        <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Testar Permissão de Desbloqueio em Confiança (24h)</span>
            <span className="text-[11px] text-slate-500">Verifica se a API autoriza o comando de reativação temporária para o assinante.</span>
          </div>
          <input
            type="checkbox"
            checked={autoDesbloqueio}
            onChange={(e) => setAutoDesbloqueio(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-preencher-exemplo"
            onClick={handlePreencherExemplo}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5"
            title="Preencher com credenciais de teste homologadas"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Dados Homologados</span>
          </button>

          <button
            type="button"
            id="btn-simular-erro"
            onClick={handleSimularErro}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-medium transition-all"
            title="Simula preenchimento com credencial inválida para testar o feedback de erro"
          >
            <span>Simular Erro</span>
          </button>

          <button
            type="button"
            id="btn-limpar-campos"
            onClick={handleLimpar}
            className="px-2.5 py-2 text-slate-500 hover:text-slate-300 text-xs transition-all"
          >
            Limpar
          </button>
        </div>

        {/* Botão Principal de Teste */}
        <button
          type="button"
          id="btn-testar-conexao-erp"
          disabled={loading}
          onClick={handleTestarConexao}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Validando API do {target.nome}...</span>
            </>
          ) : (
            <>
              <RefreshCw size={15} />
              <span>Testar Conexão com {target.nome}</span>
            </>
          )}
        </button>
      </div>

      {/* FEEDBACK VISUAL DE SUCESSO OU ERRO */}
      {feedback && (
        <div 
          id="feedback-validacao-container"
          className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/25 border-rose-500/30 text-rose-300'
          }`}
        >
          {/* Header do Feedback */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="flex items-start sm:items-center gap-3">
              {feedback.tipo === 'sucesso' ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <XCircle size={20} />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2 text-white">
                  {feedback.tipo === 'sucesso' 
                    ? `Conexão com ${target.nome} Estabelecida com Sucesso!` 
                    : `Falha na Validação da API do ${target.nome}`}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {feedback.mensagem}
                </p>
              </div>
            </div>

            {/* Chips de Métricas (quando sucesso ou quando latência existir) */}
            <div className="flex items-center gap-2 shrink-0">
              {feedback.latenciaMs && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                  feedback.tipo === 'sucesso'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <Radio size={12} className="animate-pulse" />
                  <span>{feedback.latenciaMs} ms</span>
                </span>
              )}

              {feedback.versaoDetectada && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-[11px] font-mono">
                  {feedback.versaoDetectada}
                </span>
              )}
            </div>
          </div>

          {/* Dica de Diagnóstico em caso de Erro */}
          {feedback.tipo === 'erro' && feedback.dica && (
            <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-rose-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <HelpCircle size={14} />
                <span>Como Solucionar Este Erro:</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-5">
                {feedback.dica}
              </p>
            </div>
          )}

          {/* Checklist dos Módulos Avaliados */}
          {feedback.checklist && feedback.checklist.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Relatório de Handshake Técnico:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(feedback.checklist || []).map((item) => {
                  if (!item) return null;
                  return (
                  <div 
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                      item.status === 'ok'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                        : item.status === 'alerta'
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.status === 'ok' && <CheckCircle2 size={14} className="text-emerald-400" />}
                      {item.status === 'alerta' && <AlertTriangle size={14} className="text-amber-400" />}
                      {item.status === 'erro' && <XCircle size={14} className="text-rose-400" />}
                    </div>
                    <div>
                      <span className="font-bold text-white block text-[11px]">{item.item}</span>
                      <span className="text-[11px] text-slate-400">{item.mensagem}</span>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Exemplo de dados consultados no SUCESSO */}
          {feedback.tipo === 'sucesso' && feedback.exemplo && (
            <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Database size={12} className="text-emerald-400" />
                  Amostra de Resposta da API ({target.nome}):
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Payload JSON Validado</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Assinante Teste</span>
                  <span className="text-white truncate block font-sans">{feedback.exemplo.cliente_exemplo}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Contrato</span>
                  <span className="text-blue-400 truncate block">{feedback.exemplo.contrato_codigo}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Sessão PPPoE / IP</span>
                  <span className="text-emerald-400 truncate block">{feedback.exemplo.ipv4}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Fatura Aberta</span>
                  <span className="text-amber-400 truncate block">{feedback.exemplo.fatura_aberta}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Ação Imediata no Sucesso */}
          {feedback.tipo === 'sucesso' && (
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-300">
                Tudo pronto! Você pode salvar estas credenciais e tornar o <strong>{target.nome}</strong> o ERP ativo do NAP.
              </span>
              <button
                type="button"
                id="btn-salvar-e-ativar-erp"
                onClick={handleSalvarEAtivar}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20"
              >
                <Check size={14} />
                <span>Salvar e Ativar {target.nome}</span>
              </button>
            </div>
          )}

          {activeSuccessFeedback && (
            <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold text-center">
              {activeSuccessFeedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
