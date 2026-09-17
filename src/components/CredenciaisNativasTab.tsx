import React, { useState } from 'react';
import { 
  Terminal, Server, Radio, Activity, Globe, Database, ShieldCheck, 
  Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, 
  Copy, Check, Loader2, ArrowRight, Layers, Key, Lock, Cpu, MessageCircle,
  Smartphone, Network, PhoneForwarded, Plug
} from 'lucide-react';
import { SystemConfig } from '../contexts/ConfigContext';

interface CredenciaisNativasTabProps {
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  handlePreencherNativos: () => Promise<void>;
  runTest: (service: 'sgp' | 'asterisk_20' | 'asterisk-ari' | 'whatsapp' | 'gemini' | 'genieacs' | 'zabbix' | 'mapa') => Promise<void>;
  testing: { [key: string]: boolean };
  testResults: { [key: string]: any };
  saving: boolean;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function CredenciaisNativasTab({
  runTest,
  testing,
  testResults,
  showToast
}: CredenciaisNativasTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    showToast('success', 'Copiado para a área de transferência!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Base URL for endpoints (usually the window origin in production, or a placeholder for docs)
  const baseUrl = window.location.origin;
  const publicDomain = baseUrl.includes('localhost') ? 'https://nap.seudominio.com.br' : baseUrl;

  const CopyButton = ({ text, id }: { text: string, id: string }) => (
    <button 
      onClick={() => copyToClipboard(text, id)}
      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white shrink-0"
      title="Copiar"
    >
      {copiedField === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white font-outfit">Integrações & Endpoints Oficiais</h2>
        <p className="text-sm text-slate-400 mt-1">
          O NAP foi construído com arquitetura <strong>Nativa e Injetada</strong>. Todas as senhas e credenciais já são carregadas via arquivo <code>.env</code> a nível de SO (Debian 12). Siga os guias abaixo para apontar os sistemas externos (CPEs, Meta, SGP, Telegram) para os conectores do NAP.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. GenieACS (TR-069) */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Network className="text-blue-400" size={18} />
              GenieACS (TR-069)
            </h3>
            <button 
              onClick={() => runTest('genieacs')}
              disabled={testing['genieacs']}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg"
            >
              {testing['genieacs'] ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
              Testar ACS
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Como cadastrar a URL (ACS URL) nos equipamentos (ONUs/Roteadores) para o provisionamento automático e reboot via NOC.
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">ACS URL (CWMP)</span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-emerald-400 break-all">http://&lt;IP_DO_NAP&gt;:7547</code>
                <CopyButton text="http://<IP_DO_NAP>:7547" id="acs-url" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">ACS Auth (Opcional)</span>
              <p className="text-xs text-slate-300">
                Se habilitado no GenieACS, o usuário e senha são os mesmos configurados em <code>GENIEACS_AUTH_USER</code> e <code>GENIEACS_AUTH_PASS</code> no servidor.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Asterisk 20+ (Telefonia) */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <PhoneForwarded className="text-indigo-400" size={18} />
              Asterisk (Ramais & Softphone)
            </h3>
            <button 
              onClick={() => runTest('asterisk-ari')}
              disabled={testing['asterisk-ari']}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg"
            >
              {testing['asterisk-ari'] ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
              Testar PABX
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Como registrar um softphone físico (ex: Zoiper, MicroSIP) ou usar o Webphone nativo do PWA.
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Registro SIP (Softphone Físico)</span>
              <ul className="text-xs text-slate-300 space-y-1">
                <li><strong>Host/Domínio:</strong> &lt;IP_DO_NAP&gt;</li>
                <li><strong>Porta UDP:</strong> 5060</li>
                <li><strong>Usuário:</strong> 2001 (ou ID do Operador)</li>
                <li><strong>Senha:</strong> (Variável ASTERISK_RAMAL_SECRET)</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">WebRTC (PWA Webphone)</span>
              <p className="text-xs text-slate-300">
                O console do operador utiliza a porta segura <strong>WSS 8089</strong>. Necessário certificado SSL válido no NAP para funcionar o microfone no navegador.
              </p>
            </div>
          </div>
        </div>

        {/* 3. ERP SGP */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Database className="text-orange-400" size={18} />
              Integração SGP (ERP)
            </h3>
            <button 
              onClick={() => runTest('sgp')}
              disabled={testing['sgp']}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg"
            >
              {testing['sgp'] ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
              Testar SGP
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            O NAP consome a API do SGP para gerar faturas PIX e checar bloqueios. 
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Como Habilitar</span>
              <ul className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                <li>Acesse o seu painel do SGP como Super Administrador.</li>
                <li>Vá em <strong>Configurações &gt; Integrações &gt; API</strong>.</li>
                <li>Gere um Token (AppKey) com permissões de Leitura de Clientes e Financeiro.</li>
                <li>Insira a URL e o Token no arquivo <code>.env</code> do servidor NAP.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. WhatsApp Cloud API Oficial */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <MessageCircle className="text-emerald-400" size={18} />
              WhatsApp Oficial (WABA)
            </h3>
            <button 
              onClick={() => runTest('whatsapp')}
              disabled={testing['whatsapp']}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg"
            >
              {testing['whatsapp'] ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
              Testar API
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Como habilitar o número oficial da sua empresa no painel Meta for Developers.
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">URL do Webhook (No painel da Meta)</span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-emerald-400 break-all">{publicDomain}/api/webhooks/waba/incoming</code>
                <CopyButton text={`${publicDomain}/api/webhooks/waba/incoming`} id="waba-webhook" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Token de Verificação (Verify Token)</span>
              <p className="text-xs text-slate-300 mb-2">
                Defina uma senha segura e insira no painel da Meta. A mesma senha deve estar na variável <code>WABA_VERIFY_TOKEN</code> no arquivo <code>.env</code>.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Certifique-se de se inscrever no evento <strong>messages</strong> no painel da Meta.
            </p>
          </div>
        </div>

        {/* 5. Telegram Hub */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Smartphone className="text-cyan-400" size={18} />
              Telegram & Copilot Hub
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Integração intuitiva para os técnicos e gestores receberem alertas do NOC (OLTs offline, rompimentos) direto no celular.
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Passo a Passo (Intuitivo)</span>
              <ul className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                <li>No Telegram, busque por <strong>@BotFather</strong> e crie um novo bot (ex: <code>/newbot</code>).</li>
                <li>Copie o <strong>HTTP API Token</strong> fornecido.</li>
                <li>Cole esse Token no arquivo <code>.env</code> na variável <code>TELEGRAM_BOT_TOKEN</code> e reinicie o NAP.</li>
                <li>O NAP configurará o webhook automaticamente no servidor!</li>
                <li>Para vincular um operador ao Telegram, vá na aba "Telegram & Copilot" neste painel, gere o código e envie para o bot.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 6. IPAM Nautobot */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Globe className="text-emerald-500" size={18} />
              IPAM (Nautobot/NetBox)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            O NAP atua como interface inteligente consumindo os IPs do Source of Truth corporativo.
          </p>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Configuração (Intuitiva)</span>
              <ul className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                <li>Gere um token de API (Write/Read) no painel administrativo do seu Nautobot.</li>
                <li>Adicione <code>NAUTOBOT_URL</code> no arquivo <code>.env</code> (ex: http://ip:8080/api).</li>
                <li>Adicione <code>NAUTOBOT_TOKEN</code> no arquivo <code>.env</code>.</li>
                <li>Caso deixe em branco, o NAP utilizará um fallback interno no PostgreSQL para reter alocações de emergência.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
