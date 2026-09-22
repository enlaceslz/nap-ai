import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Settings, CheckCircle2, ChevronRight, Loader2, Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    adminEmail: 'admin@djdtelecom.com.br',
    adminPassword: ''
  });

  const steps = [
    { num: 1, title: 'Administrador Raiz', icon: Key },
    { num: 2, title: 'Infraestrutura & Secrets', icon: ShieldCheck },
    { num: 3, title: 'Finalização & Bloqueio', icon: Server }
  ];

  const nextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.adminEmail || !formData.adminPassword) {
        setErrorMsg('Informe o e-mail e a senha do administrador.');
        return;
      }
      if (formData.adminPassword.length < 8) {
        setErrorMsg('A senha mestra deve conter no mínimo 8 caracteres.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/setup/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao finalizar provisionamento do administrador.');
        setLoading(false);
        return;
      }

      navigate('/admin');
    } catch {
      setErrorMsg('Falha de conexão com o servidor de setup.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-card border border-border rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Steps */}
        <div className="md:w-64 bg-black/40 p-8 border-r border-border">
          <div className="flex items-center gap-3 mb-10">
            <Settings className="w-8 h-8 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground font-outfit">NAP Setup</h2>
          </div>

          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.num} className={`flex items-center gap-3 ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors ${
                  step === s.num ? 'border-blue-500 bg-blue-500/10' : 
                  step > s.num ? 'border-blue-500 bg-blue-500 text-white' : 'border-border'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="font-medium text-sm">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <div>
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-bold text-foreground mb-2">Criar Administrador Raiz</h3>
                <p className="text-muted-foreground mb-6">
                  Defina as credenciais para o acesso primário ao painel administrativo. A senha é armazenada estritamente como hash no banco de dados.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={formData.adminEmail}
                      onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Senha Mestra</label>
                    <input 
                      type="password" 
                      value={formData.adminPassword}
                      onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-bold text-foreground mb-2">Infraestrutura & Variáveis de Ambiente</h3>
                <p className="text-muted-foreground mb-6">
                  Em conformidade com as diretrizes de segurança de produção, os segredos de infraestrutura nunca são trafegados pelo navegador.
                </p>

                <div className="space-y-3 bg-background/50 border border-border rounded-2xl p-5 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">ERP / SGP</span>
                      <p className="text-muted-foreground text-xs">Configurado via <code className="text-blue-400">SGP_URL</code> e <code className="text-blue-400">SGP_TOKEN</code> no arquivo de ambiente do servidor.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Inteligência Artificial (Gemini)</span>
                      <p className="text-muted-foreground text-xs">Configurado via <code className="text-blue-400">GEMINI_API_KEY</code> diretamente no runtime do container/servidor.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Telefonia Asterisk & GenieACS</span>
                      <p className="text-muted-foreground text-xs">Portas ARI (8088), AMI (5038), WSS (8089) e NBI (7557) gerenciadas por serviços locais isolados.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-6">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Pronto para Finalizar</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  Ao concluir, o usuário administrador será persistido no banco e as rotas de Setup serão bloqueadas permanentemente.
                </p>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground px-4 py-2 font-medium disabled:opacity-50 transition-colors"
              >
                Voltar
              </button>
            ) : <div />}
            
            {step < 3 ? (
              <button 
                onClick={nextStep}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Administrador e Bloquear Setup'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
