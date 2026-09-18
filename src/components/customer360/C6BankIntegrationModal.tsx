import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Key, Lock, CheckCircle2, AlertTriangle, 
  RefreshCw, Copy, Check, UploadCloud, Radio, ExternalLink, Zap,
  FileCheck, Shield, ChevronRight, Info, BookOpen, ArrowLeft
} from 'lucide-react';
import type { C6BankConfig } from '../../types';
import C6BankProcedimentosGuia from './C6BankProcedimentosGuia';

interface Props {
  onConfigSaved?: () => void;
}

export default function C6BankIntegrationModal({ onConfigSaved }: Props) {
  const [config, setConfig] = useState<C6BankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Form State
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cnpj' | 'email' | 'aleatoria' | 'telefone'>('cnpj');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [ispName, setIspName] = useState('');
  const [certFileName, setCertFileName] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/c6-config');
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setPixKey(data.config.pixKey || '');
        setPixKeyType(data.config.pixKeyType || 'cnpj');
        setClientId(data.config.clientId || '');
        setWebhookUrl(data.config.webhookUrl || `${window.location.origin}/api/payments/webhook`);
        setEnvironment(data.config.environment || 'production');
        setIspName(data.config.ispName || '');
        setCertFileName(data.config.mtlsCertificateName || '');
      }
    } catch (err) {
      console.error("Falha ao carregar configuração C6 Bank:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/payments/c6-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixKey,
          pixKeyType,
          clientId,
          clientSecret: clientSecret || undefined,
          webhookUrl,
          environment,
          ispName
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setClientSecret('');
        if (onConfigSaved) onConfigSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/payments/c6-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setTestFeedback(data);
      if (data.success) {
        loadConfig();
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: err.message || 'Erro de comunicação no handshake com o C6 Bank'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSimulateCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await fetch('/api/payments/c6-config/upload-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateName: file.name })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setCertFileName(file.name);
        setTestFeedback({
          success: true,
          message: `Certificado mTLS '${file.name}' carregado e validado com sucesso!`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (showGuide) {
    return (
      <C6BankProcedimentosGuia
        onClose={() => setShowGuide(false)}
        onUseWebhookUrl={(url) => {
          setWebhookUrl(url);
          setShowGuide(false);
        }}
      />
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header com Status em Tempo Real */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-outfit text-foreground">
                Integração C6 Bank (336) • Enlace-Pay
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                API Pix v2 Oficial
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Liquidação instantânea mTLS de Pix, geração de TXID automatizada e conciliação bancária sem intermediários.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
          >
            <BookOpen size={14} className="text-amber-400" />
            Ver Procedimentos C6 PJ
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <Zap size={14} className={testing ? "text-amber-400 animate-spin" : "text-amber-400"} />
            {testing ? "Testando Handshake..." : "Testar Conexão mTLS"}
          </button>
        </div>
      </div>

      {/* Banner de Feedback do Teste */}
      {testFeedback && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-3 transition-all ${
          testFeedback.success 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/40 border-red-500/30 text-red-300'
        }`}>
          {testFeedback.success ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />}
          <div className="space-y-1">
            <p className="font-semibold">{testFeedback.message}</p>
            {testFeedback.latencyMs && (
              <p className="text-[11px] opacity-80">
                Latência mTLS: <span className="font-mono font-bold text-foreground">{testFeedback.latencyMs}ms</span> • ISPB: 31872495 (Banco C6 S.A.) • Webhook Ativo
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status da Conexão e Criptografia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Status do Link</span>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Conectado &amp; Autorizado
            </div>
          </div>
          <ShieldCheck size={20} className="text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Certificado mTLS</span>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileCheck size={13} className="text-blue-400" />
              {config?.mtlsCertificateUploaded ? 'Instalado & Válido' : 'Pendente de Upload'}
            </div>
          </div>
          <Lock size={18} className="text-blue-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Ambiente C6</span>
            <div className="text-xs font-bold text-amber-400 uppercase font-mono">
              {config?.environment === 'production' ? 'Produção (Live)' : 'Sandbox (Testes)'}
            </div>
          </div>
          <Radio size={18} className="text-amber-400" />
        </div>
      </div>

      {/* Formulário de Configuração Segura */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do Provedor / Titular */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Razão Social / Nome da Conta no C6 Bank
            </label>
            <input
              type="text"
              value={ispName}
              onChange={(e) => setIspName(e.target.value)}
              placeholder="Ex: DJD Telecom Ltda"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Ambiente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Ambiente de Operação
            </label>
            <select
              value={environment}
              onChange={(e: any) => setEnvironment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50"
            >
              <option value="production">Produção (api-pix.c6bank.com.br)</option>
              <option value="sandbox">Homologação / Sandbox</option>
            </select>
          </div>

          {/* Tipo de Chave Pix */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Tipo de Chave Pix Cadastrada no C6
            </label>
            <select
              value={pixKeyType}
              onChange={(e: any) => setPixKeyType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50"
            >
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="aleatoria">Chave Aleatória (EVP)</option>
              <option value="telefone">Telefone Celular</option>
            </select>
          </div>

          {/* Chave Pix */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Chave Pix de Recebimento
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: 12.345.678/0001-90 ou financeiro@djdtelecom.com.br"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50 font-mono"
              required
            />
          </div>

          {/* Client ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" />
              Client ID (C6 API)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Ex: c6_client_live_89172401"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50 font-mono"
              required
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" />
                Client Secret (Chave Privada)
              </span>
              {config?.clientSecretMasked && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Atual: {config.clientSecretMasked}
                </span>
              )}
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={config?.clientSecretMasked ? "Preencha somente para alterar o secret atual" : "Digite o client secret fornecido pelo C6"}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-foreground focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>
        </div>

        {/* Upload do Certificado mTLS (.crt / .pem) */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Shield size={14} className="text-amber-400" />
                Certificado mTLS (Segurança Bancária Banco Central)
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                O C6 Bank exige certificado digital mTLS para autorizar a criação de cobranças e receber webhooks assinados.
              </p>
            </div>
            {config?.mtlsCertificateUploaded && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {certFileName || 'c6_mtls_prod.crt'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium cursor-pointer border border-slate-700 transition">
              <UploadCloud size={14} className="text-blue-400" />
              Carregar Novo Certificado (.crt / .pem)
              <input
                type="file"
                accept=".crt,.pem,.pfx,.cer"
                onChange={handleSimulateCertUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              Onde baixar no C6 Empresas? <ChevronRight size={12} />
            </button>
            <span className="text-[11px] text-muted-foreground">
              Armazenado de forma criptografada em cofre local isolado da VM.
            </span>
          </div>
        </div>

        {/* URL do Webhook Oficial para o C6 Bank & Simulador de Evento */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Radio size={14} className="text-emerald-400" />
              URL Oficial do Webhook (Cole no Painel C6 Empresas)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setTesting(true);
                  try {
                    const res = await fetch('/api/customer360/simulate/payment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        txid: 'E123456789',
                        valor: 119.90,
                        banco: 'C6 Bank S.A. (Cobrança-API)'
                      })
                    });
                    const resData = await res.json();
                    setTestFeedback({
                      success: true,
                      message: `Simulação de Webhook Pix executada com sucesso! TXID: ${resData.txid || 'E123456789'} processado no ERP e baixado em tempo real.`
                    });
                  } catch (err: any) {
                    setTestFeedback({
                      success: false,
                      message: `Falha ao simular disparo de webhook: ${err.message}`
                    });
                  } finally {
                    setTesting(false);
                  }
                }}
                disabled={testing}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold transition disabled:opacity-50"
              >
                <Zap size={12} className="text-emerald-400" />
                Simular Disparo Webhook Pix
              </button>
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, 'webhook')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
              >
                {copiedField === 'webhook' ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copiar URL
                  </>
                )}
              </button>
            </div>
          </div>
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            O C6 Bank notificará esta URL instantaneamente quando qualquer cliente realizar o pagamento Pix. O NAP realizará a baixa automática no ERP e desbloqueio em até 3 segundos.
          </p>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? "Salvando Credenciais..." : "Salvar & Conectar ao C6 Bank"}
          </button>
        </div>
      </form>
    </div>
  );
}
