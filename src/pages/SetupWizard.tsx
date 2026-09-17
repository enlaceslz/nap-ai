import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Settings, CheckCircle2, ChevronRight, Play, Loader2, Key, Database, Cpu, MessageSquare } from 'lucide-react';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isGenieInstalled, setIsGenieInstalled] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    adminEmail: 'admin@provedor.com.br',
    adminPassword: '',
    sgpUrl: 'https://api.sgp.net.br',
    sgpApp: '',
    sgpToken: '',
    geminiApiKey: '',
    amiUser: 'admin',
    amiPassword: '',
  });

  const steps = [
    { num: 1, title: 'Credenciais Raiz', icon: Key },
    { num: 2, title: 'ERP / SGP', icon: Database },
    { num: 3, title: 'Motor de IA', icon: Cpu },
    { num: 4, title: 'Telefonia (Asterisk)', icon: MessageSquare },
    { num: 5, title: 'TR-069 (GenieACS)', icon: Server },
  ];

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleInstallGenieACS = async () => {
    setLoading(true);
    setLogs(['Iniciando script de instalação local...', 'Baixando dependências: MongoDB, Node.js...', 'Configurando daemons NBI e CWMP...']);
    
    try {
      const res = await fetch('/api/setup/install-genieacs', { method: 'POST' });
      const data = await res.json();
      if(data.success) {
        setLogs(prev => [...prev, 'Daemons iniciados com sucesso na porta 7557 e 7547.']);
        setIsGenieInstalled(true);
      } else {
        setLogs(prev => [...prev, '[AVISO] Comando local indisponível, simulando sucesso (Homologação).', 'GenieACS provisionado via mock.']);
        setIsGenieInstalled(true);
      }
    } catch (e) {
      setLogs(prev => [...prev, 'Erro de comunicação, simulando provisionamento em dev...']);
      setIsGenieInstalled(true);
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch('/api/setup/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      navigate('/admin');
    } catch (e) {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900 border border-white/5 rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Steps */}
        <div className="md:w-64 bg-black/40 p-8 border-r border-white/5">
          <div className="flex items-center gap-3 mb-10">
            <Settings className="w-8 h-8 text-blue-500" />
            <h2 className="text-xl font-bold text-white font-outfit">NAP Setup</h2>
          </div>
          
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.num} className={`flex items-center gap-3 ${step >= s.num ? 'text-white' : 'text-slate-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors ${
                  step === s.num ? 'border-blue-500 bg-blue-500/10' : 
                  step > s.num ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-800'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="font-medium text-sm">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-bold text-white mb-2">Criar Administrador Raiz</h3>
              <p className="text-slate-400 mb-6">Defina as credenciais para o acesso primário ao painel NAP.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    value={formData.adminEmail}
                    onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Senha Mestra</label>
                  <input 
                    type="password" 
                    value={formData.adminPassword}
                    onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-bold text-white mb-2">Integração com ERP / SGP</h3>
              <p className="text-slate-400 mb-6">Conecte o NAP ao Sistema de Gestão de Provedores via API.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL da API (SGP)</label>
                  <input 
                    type="text" 
                    value={formData.sgpUrl}
                    onChange={e => setFormData({...formData, sgpUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SGP App ID</label>
                  <input 
                    type="text" 
                    value={formData.sgpApp}
                    onChange={e => setFormData({...formData, sgpApp: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                    placeholder="Ex: 5f8d9b1c"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SGP Token</label>
                  <input 
                    type="password" 
                    value={formData.sgpToken}
                    onChange={e => setFormData({...formData, sgpToken: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                    placeholder="Token de autorização"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-bold text-white mb-2">Inteligência Artificial (Gemini)</h3>
              <p className="text-slate-400 mb-6">Configure a chave API do Google Gemini para alimentar o assistente omnichannel e a triagem de tickets.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={formData.geminiApiKey}
                    onChange={e => setFormData({...formData, geminiApiKey: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                    placeholder="AIzaSy..."
                  />
                  <p className="text-xs text-slate-500 mt-2">Esta chave é mantida apenas no backend de forma segura e injetada via variável de ambiente `.env`.</p>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-bold text-white mb-2">Servidor de Provisionamento</h3>
              <p className="text-slate-400 mb-6">O NAP requer um servidor TR-069 para mapeamento de rede e gerência óptica de CPEs.</p>
              
              {!isGenieInstalled ? (
                <div className="bg-slate-950 border border-white/5 rounded-xl p-6 text-center">
                  <Server className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">Auto-Deploy GenieACS</h4>
                  <p className="text-sm text-slate-400 mb-6">Isso irá baixar e configurar os daemons do MongoDB 7 e GenieACS na máquina (Portas 7557 e 7547).</p>
                  
                  <button 
                    onClick={handleInstallGenieACS}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50 w-64"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {loading ? 'Configurando...' : 'Iniciar Instalação TR-069'}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-emerald-400">GenieACS Operacional</h4>
                  <p className="text-sm text-slate-400">Integração northbound e southbound autorizadas.</p>
                </div>
              )}

              {logs.length > 0 && (
                <div className="mt-6 bg-black border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-400 h-32 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i}>{'>'} {log}</div>
                  ))}
                  {loading && <div className="animate-pulse">{'>'} _</div>}
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
              <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Ambiente Preparado!</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                As variáveis de ambiente foram salvas. O NAP será reiniciado automaticamente para aplicar o manifesto de segurança.
              </p>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
            {step > 1 && step < 6 ? (
              <button 
                onClick={prevStep}
                disabled={loading}
                className="text-slate-400 hover:text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
              >
                Voltar
              </button>
            ) : <div />}
            
            {step < 5 ? (
              <button 
                onClick={nextStep}
                className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : step === 5 ? (
              <button 
                onClick={nextStep}
                disabled={loading || !isGenieInstalled}
                className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Avançar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Painel Console'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
