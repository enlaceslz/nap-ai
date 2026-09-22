import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, User, ArrowRight, Loader2, Sparkles, UserX, HeadphonesIcon, AlertTriangle, Lock } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import WebchatWidget from '../components/WebchatWidget';

export default function PortalLogin() {
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cpfNotFound, setCpfNotFound] = useState(false);
  const [cpfError, setCpfError] = useState('');

  const isValidCpf = (cpfStr: string) => {
    const clean = cpfStr.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let soma = 0;
    let resto: number;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(clean.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(clean.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.substring(10, 11))) return false;

    return true;
  };

  const navigate = useNavigate();
  const { config } = useConfig();
  
  const nomeProvedor = config.provedor?.nomeFantasia || 'DJD Telecom';

  // Se já estiver logado, redireciona
  if (localStorage.getItem('@nap_client_auth')) {
    return <Navigate to="/portal" replace />;
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica a máscara CPF (000.000.000-00)
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setCpf(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;
    
    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido de acordo com a Receita Federal');
      return;
    }
    setCpfError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf })
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setCpfError(data.message || 'Bloqueio de segurança WAF ativado. Tente novamente em alguns instantes.');
        setIsLoading(false);
        return;
      }

      if (res.status === 404) {
        setCpfNotFound(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.client) {
        localStorage.setItem('@nap_client_auth', JSON.stringify(data.client));
        navigate('/portal');
      } else {
        setCpfNotFound(true);
      }
    } catch (err: any) {
      setCpfError('Erro de conexão ao autenticar no portal: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-700 to-blue-600 rounded-b-[48px] shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      </div>

      <div className="px-2 flex flex-col z-10 w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] rounded-2xl shadow-[0_4px_20px_rgba(10,80,255,0.4)] mx-auto flex items-center justify-center mb-3 border-2 border-border">
            <span className="text-foreground font-black text-3xl font-sans mt-[1px]">N</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-outfit">Central do Assinante</h1>
          <p className="text-blue-100 text-xs md:text-sm mt-1">Portal PWA Mobile-First • Autoatendimento {nomeProvedor}</p>
        </div>

        {/* Card Principal de Login */}
        {cpfNotFound ? (
          <div className="bg-card rounded-3xl shadow-xl border border-border/80 p-6 md:p-8 mb-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <UserX size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 font-outfit">CPF não localizado</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Não encontramos nenhum contrato ativo para o CPF <strong className="text-foreground font-mono">{cpf}</strong> na base do provedor.
            </p>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 mb-6 text-left relative overflow-hidden shadow-lg shadow-blue-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-card rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/3"></div>
              <h3 className="text-foreground font-bold text-lg mb-1 relative z-10">Quer ser cliente {nomeProvedor}?</h3>
              <p className="text-blue-100 text-xs mb-4 relative z-10">Temos planos de Fibra Óptica com ultravelocidade simétrica e instalação imediata.</p>
              <button 
                type="button"
                onClick={() => {
                  const btn = document.querySelector('.webchat-widget-toggle');
                  if (btn) (btn as HTMLElement).click();
                }}
                className="w-full bg-card text-blue-700 hover:bg-blue-50 font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 relative z-10 text-sm"
              >
                <HeadphonesIcon size={18} />
                Falar com Consultor (Comercial)
              </button>
            </div>

            <button 
              type="button"
              onClick={() => { setCpfNotFound(false); setCpf(''); }}
              className="w-full bg-muted hover:bg-accent text-foreground font-bold py-3.5 rounded-xl transition-all active:scale-95 text-sm"
            >
              Tentar outro CPF
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-3xl shadow-xl border border-border/80 p-6 md:p-8 mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="text-blue-600" size={22} />
                Acesso com CPF
              </h2>
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Lock size={12} /> Acesso Seguro
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  CPF do Titular
                </label>

                <div className="relative">
                  <input
                    type="tel"
                    value={cpf}
                    onChange={(e) => { setCpfError(''); handleCpfChange(e); }}
                    placeholder="000.000.000-00"
                    className={`w-full h-13 pl-4 pr-11 bg-background border-2 rounded-xl text-lg font-mono font-medium text-foreground focus:ring-4 outline-none transition-all placeholder:text-muted-foreground ${cpfError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-blue-500 focus:ring-blue-500/20'}`}
                    required
                    autoFocus
                  />
                  {cpf.length === 14 && !cpfError && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <ShieldCheck size={22} />
                    </div>
                  )}
                </div>
                {cpfError && (
                  <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                    <AlertTriangle size={12} /> {cpfError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={cpf.length < 14 || isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Consultando Contrato...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Botão de Novo Assinante */}
            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs font-medium text-muted-foreground mb-3">Ainda não possui nossa conexão?</p>
              <button 
                type="button"
                onClick={() => {
                  const btn = document.querySelector('.webchat-widget-toggle');
                  if (btn) (btn as HTMLElement).click();
                }}
                className="text-blue-600 font-bold hover:text-blue-700 flex items-center justify-center gap-1.5 mx-auto w-full py-3 bg-blue-50/50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100/50 text-sm"
              >
                <Sparkles size={16} />
                Quero assinar a {nomeProvedor}
              </button>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[11px] text-muted-foreground">
                Ao acessar, você concorda com a política de privacidade e os termos de uso de {nomeProvedor}.
              </p>
            </div>
          </div>
        )}
      </div>
      <WebchatWidget />
    </div>
  );
}
