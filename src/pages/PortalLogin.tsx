import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, User, ArrowRight, Loader2, Sparkles, UserX, HeadphonesIcon, AlertTriangle, Lock, KeyRound, MessageSquare } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import WebchatWidget from '../components/WebchatWidget';

export default function PortalLogin() {
  const [cpf, setCpf] = useState('');
  const [authMode, setAuthMode] = useState<'otp' | 'senha'>('otp');
  const [otp, setOtp] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [cpfNotFound, setCpfNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  if (localStorage.getItem('@nap_client_auth')) {
    return <Navigate to="/portal" replace />;
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setCpf(value);
  };

  // Solicitar código OTP por WhatsApp
  const handleRequestOtp = async () => {
    if (cpf.length < 14 || !isValidCpf(cpf)) {
      setErrorMsg('Informe um CPF válido para receber o código.');
      return;
    }
    setErrorMsg('');
    setIsSendingOtp(true);

    try {
      const res = await fetch('/api/portal/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setCpfNotFound(true);
        } else {
          setErrorMsg(data.error || 'Falha ao solicitar código de acesso.');
        }
        return;
      }

      setOtpSent(true);
      setMaskedPhone(data.maskedPhone || '');
      setOtpMessage(data.message || 'Código enviado por WhatsApp.');
      if (data.devOtpCode) {
        setOtp(data.devOtpCode);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao solicitar código: ' + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Efetuar Login Real (CPF + OTP ou Senha)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;
    
    if (!isValidCpf(cpf)) {
      setErrorMsg('CPF inválido de acordo com a Receita Federal');
      return;
    }

    if (authMode === 'otp' && (!otp || otp.length < 4)) {
      setErrorMsg('Insira o código de 6 dígitos recebido por WhatsApp.');
      return;
    }

    if (authMode === 'senha' && (!senha || senha.length < 6)) {
      setErrorMsg('Insira sua senha de acesso do portal (mínimo 6 caracteres).');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload: any = { cpf };
      if (authMode === 'otp') payload.otp = otp;
      if (authMode === 'senha') payload.senha = senha;

      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 404) {
        setCpfNotFound(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.client) {
        localStorage.setItem('@nap_client_auth', JSON.stringify(data.client));
        if (data.token) {
          localStorage.setItem('@nap_client_token', data.token);
        }
        navigate('/portal');
      } else {
        setErrorMsg(data.error || 'Credenciais inválidas. Verifique os dados digitados.');
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao autenticar no portal: ' + err.message);
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
              onClick={() => { setCpfNotFound(false); setCpf(''); setOtpSent(false); setOtp(''); }}
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
                Acesso Seguro ao Portal
              </h2>
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Lock size={12} /> Autenticação 2FA
              </span>
            </div>

            {/* Alternador de Método de Autenticação */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setErrorMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${authMode === 'otp' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MessageSquare size={14} />
                Código WhatsApp
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('senha'); setErrorMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${authMode === 'senha' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <KeyRound size={14} />
                Senha do Portal
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  CPF do Titular
                </label>

                <div className="relative">
                  <input
                    type="tel"
                    value={cpf}
                    onChange={(e) => { setErrorMsg(''); handleCpfChange(e); }}
                    placeholder="000.000.000-00"
                    className={`w-full h-12 pl-4 pr-11 bg-background border-2 rounded-xl text-base font-mono font-medium text-foreground focus:ring-4 outline-none transition-all placeholder:text-muted-foreground ${errorMsg ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-blue-500 focus:ring-blue-500/20'}`}
                    required
                    autoFocus
                  />
                  {cpf.length === 14 && isValidCpf(cpf) && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <ShieldCheck size={20} />
                    </div>
                  )}
                </div>
              </div>

              {/* Modo OTP por WhatsApp */}
              {authMode === 'otp' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Código de 6 Dígitos
                    </label>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={cpf.length < 14 || isSendingOtp}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {isSendingOtp ? 'Enviando...' : (otpSent ? 'Reenviar Código' : 'Receber Código no WhatsApp')}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => { setErrorMsg(''); setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
                    placeholder="Ex: 123456"
                    className="w-full h-12 px-4 bg-background border-2 border-border rounded-xl text-center text-xl font-mono tracking-widest font-bold text-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                    maxLength={6}
                  />
                  {otpSent && maskedPhone && (
                    <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                      ✓ Código enviado para o número {maskedPhone}
                    </p>
                  )}
                </div>
              )}

              {/* Modo Senha */}
              {authMode === 'senha' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => { setErrorMsg(''); setSenha(e.target.value); }}
                    placeholder="Digite sua senha"
                    className="w-full h-12 px-4 bg-background border-2 border-border rounded-xl text-sm font-medium text-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              )}

              {errorMsg && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertTriangle size={12} /> {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={cpf.length < 14 || isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Autenticando...</span>
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
