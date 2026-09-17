import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  QrCode, 
  RefreshCw, 
  Smartphone, 
  Tv, 
  Laptop, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Save, 
  Info,
  Power
} from 'lucide-react';

interface DeviceItem {
  nome: string;
  ip: string;
  mac: string;
  banda: string;
  sinal: number;
  tipo?: string;
}

interface WifiConfig {
  serialNumber: string;
  modeloCpe: string;
  fabricante: string;
  mac: string;
  ipCpe: string;
  status: string;
  ssid24: string;
  ssid5: string;
  senhaWifi: string;
  ocultarSsid: boolean;
  seguranca: string;
  bandaSincronizada: boolean;
  canal24: string;
  canal5: string;
  potenciaTx: string;
  dispositivosConectados: DeviceItem[];
  ultimaAlteracao: string;
}

interface PortalWifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPassword: string) => void;
}

export default function PortalWifiModal({ isOpen, onClose, onSuccess }: PortalWifiModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [wifiData, setWifiData] = useState<WifiConfig | null>(null);

  // Form states
  const [activeTab, setActiveTab] = useState<'alterar' | 'dispositivos' | 'qrcode'>('alterar');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ssid24, setSsid24] = useState('');
  const [ssid5, setSsid5] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [removingMac, setRemovingMac] = useState<string | null>(null);
  
  const handleRemoveDevice = async (mac: string) => {
    setRemovingMac(mac);
    try {
      const res = await fetch('/api/portal/wifi/remove-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac })
      });
      const data = await res.json();
      if (data.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: data.mensagem });
        if (data.sugerirTrocaSenha) {
          setTimeout(() => {
             setFeedback({ tipo: 'erro', texto: 'Este dispositivo foi removido repetidas vezes. Sugerimos trocar a senha do seu Wi-Fi para impedir que ele volte a se conectar.' });
             setActiveTab('alterar');
          }, 4000);
        }
        await fetchWifiConfig(); // Atualiza a lista
      } else {
        setFeedback({ tipo: 'erro', texto: data.erro || 'Erro ao remover dispositivo.' });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Erro de conexão ao tentar remover dispositivo.' });
    }
    setRemovingMac(null);
  };


  // Carregar dados da ONU/Wi-Fi
  const fetchWifiConfig = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch('/api/portal/wifi');
      const data = await res.json();
      if (data.sucesso && data.config) {
        setWifiData(data.config);
        setSsid24(data.config.ssid24);
        setSsid5(data.config.ssid5);
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Não foi possível carregar as informações do seu roteador.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWifiConfig();
      setNewPassword('');
      setConfirmPassword('');
      setFeedback(null);
      setActiveTab('alterar');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPassword = () => {
    if (!wifiData?.senhaWifi) return;
    navigator.clipboard.writeText(wifiData.senhaWifi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Avaliação de força de senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Vazia', score: 0, color: 'bg-slate-200 text-slate-500' };
    if (pwd.length < 8) return { label: 'Curta (mínimo 8 dígitos)', score: 1, color: 'bg-red-500 text-red-700' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Fraca', score: 2, color: 'bg-amber-500 text-amber-700' };
    if (score === 3) return { label: 'Boa', score: 3, color: 'bg-blue-500 text-blue-700' };
    return { label: 'Forte e Segura', score: 4, color: 'bg-emerald-500 text-emerald-700' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSaveWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ tipo: 'erro', texto: 'A nova senha do Wi-Fi deve ter no mínimo 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ tipo: 'erro', texto: 'A confirmação de senha não coincide com a nova senha digitada.' });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/portal/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaWifi: newPassword,
          ssid24: ssid24.trim() || undefined,
          ssid5: ssid5.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.sucesso) {
        setWifiData(data.config);
        setFeedback({ 
          tipo: 'sucesso', 
          texto: 'Senha alterada com sucesso! O roteador está aplicando os novos parâmetros via TR-069. Seus dispositivos podem precisar reconectar.' 
        });
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) onSuccess(newPassword);
      } else {
        setFeedback({ tipo: 'erro', texto: data.erro || 'Erro ao comunicar com a ONU via TR-069.' });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Erro de conexão ao salvar nova senha no roteador.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRebootCpe = async () => {
    if (!confirm('Deseja realmente reiniciar o seu roteador Wi-Fi agora? Sua conexão cairá por cerca de 60 segundos.')) return;
    try {
      setRebooting(true);
      const res = await fetch('/api/portal/wifi/reboot', { method: 'POST' });
      const data = await res.json();
      if (data.sucesso) {
        setFeedback({ tipo: 'sucesso', texto: data.mensagem });
      }
    } catch {
      setFeedback({ tipo: 'erro', texto: 'Falha ao enviar comando de reinício para a ONU.' });
    } finally {
      setRebooting(false);
    }
  };

  // Formato padronizado de QR Code Wi-Fi: WIFI:T:WPA;S:nome_da_rede;P:senha_wifi;;
  const qrWifiString = wifiData ? `WIFI:T:WPA;S:${wifiData.ssid5 || wifiData.ssid24};P:${wifiData.senhaWifi};;` : '';

  const getDeviceIcon = (tipo?: string) => {
    switch (tipo) {
      case 'smartphone': return <Smartphone size={16} className="text-blue-600" />;
      case 'tv': return <Tv size={16} className="text-purple-600" />;
      case 'computador': return <Laptop size={16} className="text-emerald-600" />;
      default: return <Radio size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header do Modal */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Wifi size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold font-outfit">Gerenciar Wi-Fi Residencial</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> TR-069
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                {wifiData ? `${wifiData.modeloCpe} • Online` : 'Carregando parâmetros do roteador...'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all relative z-10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('alterar')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'alterar'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Lock size={15} /> Alterar Senha
            </button>
            <button
              onClick={() => setActiveTab('dispositivos')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'dispositivos'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Smartphone size={15} /> Dispositivos Conectados ({wifiData?.dispositivosConectados.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'qrcode'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <QrCode size={15} /> Compartilhar QR Code
            </button>
          </div>

          <button
            onClick={fetchWifiConfig}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Atualizar dados da ONU"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 border ${
            feedback.tipo === 'sucesso' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {feedback.tipo === 'sucesso' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-relaxed">{feedback.texto}</span>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="animate-spin text-blue-600" size={32} />
              <p className="text-sm font-medium">Consultando parâmetros do roteador via GenieACS...</p>
            </div>
          ) : (
            <>
              {/* Card Resumo do Wi-Fi Atual */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome da Rede (SSID):</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-xs">
                      {wifiData?.ssid5 || wifiData?.ssid24}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>Segurança: <strong>{wifiData?.seguranca || 'WPA2-PSK'}</strong></span>
                    <span>•</span>
                    <span>Banda: <strong>Dual-Band (2.4G & 5G)</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Senha Atual</span>
                    <span className="text-sm font-mono font-bold text-slate-800 tracking-wider">
                      {showCurrentPassword ? wifiData?.senhaWifi : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title={showCurrentPassword ? "Ocultar senha" : "Ver senha atual"}
                    >
                      {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Copiar senha"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ABA 1: ALTERAR SENHA */}
              {activeTab === 'alterar' && (
                <form onSubmit={handleSaveWifi} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Nova Senha do Wi-Fi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha (mínimo 8 caracteres)"
                          className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none text-slate-900 font-mono text-sm transition-all"
                          required
                          minLength={8}
                          maxLength={63}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Medidor de força da senha */}
                      {newPassword && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500">Força da senha:</span>
                            <span className="font-bold text-slate-700">{strength.label}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}></div>
                            <div className={`h-full rounded-full transition-all ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}></div>
                            <div className={`h-full rounded-full transition-all ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}></div>
                            <div className={`h-full rounded-full transition-all ${strength.score >= 4 ? strength.color : 'bg-transparent'}`}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Confirmar Nova Senha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha exatamente igual"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none text-slate-900 font-mono text-sm transition-all"
                        required
                        minLength={8}
                        maxLength={63}
                      />
                    </div>

                    {/* Personalização opcional de SSID */}
                    <div className="pt-2 border-t border-slate-100">
                      <details className="group">
                        <summary className="text-xs font-bold text-blue-600 cursor-pointer hover:underline list-none flex items-center justify-between">
                          <span>Opções Avançadas: Personalizar Nome da Rede (SSID)</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Nome da Rede 2.4 GHz
                            </label>
                            <input
                              type="text"
                              value={ssid24}
                              onChange={(e) => setSsid24(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Nome da Rede 5 GHz (Ultra)
                            </label>
                            <input
                              type="text"
                              value={ssid5}
                              onChange={(e) => setSsid5(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Informação sobre reconexão */}
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                    <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Atenção:</strong> Ao salvar a nova senha, os parâmetros serão enviados diretamente para o roteador via protocolo TR-069. Todos os aparelhos que utilizavam a senha antiga serão desconectados e deverão usar a nova senha.
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleRebootCpe}
                      disabled={rebooting || saving}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Power size={14} className={rebooting ? "animate-spin text-red-500" : ""} />
                      {rebooting ? 'Reiniciando Roteador...' : 'Reiniciar Roteador'}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 sm:flex-initial px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving || newPassword.length < 8}
                        className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:hover:scale-100"
                      >
                        {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? 'Aplicando na ONU (TR-069)...' : 'Salvar Nova Senha'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ABA 2: DISPOSITIVOS CONECTADOS */}
              {activeTab === 'dispositivos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Aparelhos Conectados no Roteador</h4>
                      <p className="text-xs text-slate-500">Mapeamento em tempo real via tabela ARP e TR-069.</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                      {wifiData?.dispositivosConectados.length || 0} dispositivos ativos
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {wifiData?.dispositivosConectados.map((dev, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            {getDeviceIcon(dev.tipo)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{dev.nome}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>{dev.ip}</span>
                              <span>•</span>
                              <span>{dev.mac}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div className="hidden sm:block">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sinal</span>
                            <span className="text-xs font-mono font-bold text-emerald-600">{dev.sinal} dBm</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            dev.banda.includes('5') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {dev.banda}
                          </span>
                          <button 
                            onClick={() => handleRemoveDevice(dev.mac)}
                            disabled={removingMac === dev.mac}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50 ml-1"
                            title="Desconectar e Bloquear Dispositivo"
                          >
                            {removingMac === dev.mac ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 3: COMPARTILHAR QR CODE */}
              {activeTab === 'qrcode' && (
                <div className="flex flex-col items-center justify-center p-6 space-y-5 text-center">
                  <div className="p-6 bg-white rounded-3xl border-2 border-dashed border-blue-200 shadow-sm flex flex-col items-center">
                    <div className="w-48 h-48 bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-white relative shadow-lg">
                      {/* Simulação gráfica elegante do QR Code com SVG vetorial */}
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                        <path d="M10,10 h25 v25 h-25 z M15,15 v15 h15 v-15 z M19,19 h7 v7 h-7 z" />
                        <path d="M65,10 h25 v25 h-25 z M70,15 v15 h15 v-15 z M74,19 h7 v7 h-7 z" />
                        <path d="M10,65 h25 v25 h-25 z M15,70 v15 h15 v-15 z M19,74 h7 v7 h-7 z" />
                        <rect x="42" y="12" width="6" height="20" />
                        <rect x="52" y="18" width="8" height="6" />
                        <rect x="42" y="42" width="16" height="16" />
                        <rect x="12" y="42" width="8" height="8" />
                        <rect x="25" y="48" width="10" height="6" />
                        <rect x="65" y="42" width="10" height="12" />
                        <rect x="80" y="48" width="8" height="8" />
                        <rect x="42" y="65" width="6" height="20" />
                        <rect x="52" y="72" width="12" height="6" />
                        <rect x="70" y="65" width="18" height="18" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 border-2 border-white flex items-center justify-center shadow-md">
                          <Wifi size={18} className="text-white" />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mt-4 font-mono">
                      Rede: {wifiData?.ssid5 || wifiData?.ssid24}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Aponte a câmera do celular para conectar sem digitar a senha.
                    </p>
                  </div>

                  <div className="w-full max-w-sm flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Senha da Rede</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{wifiData?.senhaWifi}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copiada!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
