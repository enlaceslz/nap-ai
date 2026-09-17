import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Server,
  Network,
  Zap,
  CheckCircle2,
  Terminal,
  AlertCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { OltDevice, OltPonPort, UnassignedOnu, OltProfile, AuthorizeOnuPayload } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OnuProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  olts: OltDevice[];
  unassigned: UnassignedOnu[];
  initialUnassigned?: UnassignedOnu | null;
  onSuccess: () => void;
}

export const OnuProvisioningModal: React.FC<OnuProvisioningModalProps> = ({
  isOpen,
  onClose,
  olts,
  unassigned,
  initialUnassigned,
  onSuccess
}) => {
  const [selectedOltId, setSelectedOltId] = useState<string>(olts[0]?.id || '');
  const [pons, setPons] = useState<OltPonPort[]>([]);
  const [selectedPon, setSelectedPon] = useState<string>('');
  const [profiles, setProfiles] = useState<OltProfile[]>([]);

  // Campos do formulário
  const [serial, setSerial] = useState('');
  const [mac, setMac] = useState('');
  const [modelo, setModelo] = useState('ZTE F670L');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [vlan, setVlan] = useState<number>(101);
  const [profileLine, setProfileLine] = useState('PROFILE_500M_FIBRA');
  const [profileService, setProfileService] = useState('SRV_INTERNET_ROUTER');

  // Estado de envio
  const [submitting, setSubmitting] = useState(false);
  const [cliOutput, setCliOutput] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Carrega portas PON e perfis da OLT selecionada
  useEffect(() => {
    if (selectedOltId) {
      oltApi.getPons(selectedOltId).then((data) => {
        setPons(data);
        if (data.length > 0 && !selectedPon) {
          setSelectedPon(data[0].pon_identifier);
          if (data[0].vlan_default) setVlan(data[0].vlan_default);
        }
      });

      oltApi.getProfiles(selectedOltId).then((data) => {
        setProfiles(data);
        const line = data.find((p) => p.tipo === 'line');
        const srv = data.find((p) => p.tipo === 'service');
        if (line) setProfileLine(line.nome);
        if (srv) setProfileService(srv.nome);
      });
    }
  }, [selectedOltId]);

  // Se veio pré-preenchido por uma descoberta rápida
  useEffect(() => {
    if (initialUnassigned) {
      setSelectedOltId(initialUnassigned.olt_id);
      setSelectedPon(initialUnassigned.pon_identifier);
      setSerial(initialUnassigned.serial);
      if (initialUnassigned.modelo_estimado) {
        setModelo(initialUnassigned.modelo_estimado);
      }
    }
  }, [initialUnassigned]);

  if (!isOpen) return null;

  const handleSelectUnassigned = (u: UnassignedOnu) => {
    setSelectedOltId(u.olt_id);
    setSelectedPon(u.pon_identifier);
    setSerial(u.serial);
    if (u.modelo_estimado) setModelo(u.modelo_estimado);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCliOutput(null);

    if (!serial.trim()) {
      setErrorMsg('O número de série (Serial) da ONU é obrigatório.');
      return;
    }
    if (!clienteNome.trim()) {
      setErrorMsg('O nome do cliente/assinante é obrigatório.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: AuthorizeOnuPayload = {
        olt_id: selectedOltId,
        pon_identifier: selectedPon,
        serial: serial.trim().toUpperCase(),
        mac: mac.trim() || undefined,
        modelo: modelo.trim(),
        cliente_nome: clienteNome.trim(),
        cliente_cpf: clienteCpf.trim() || undefined,
        vlan: Number(vlan) || 100,
        profile_line: profileLine,
        profile_service: profileService
      };

      const res = await oltApi.authorizeOnu(payload);
      if (res.success) {
        setIsSuccess(true);
        setCliOutput(res.raw_output || 'ONU autorizada e registrada com sucesso.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      } else {
        setErrorMsg('Falha ao autorizar ONU.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Erro de comunicação ao autorizar ONU.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentOlt = olts.find((o) => o.id === selectedOltId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-400" />
              Provisionamento & Autorização de ONU (GPON)
            </h3>
            <p className="text-xs text-slate-400">
              Registra e comissiona a ONT no chassi {currentOlt?.fabricante || 'OLT'} gerando os comandos CLI nativos.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sugestões de ONUs Descobertas Automaticamente */}
        {unassigned.length > 0 && !isSuccess && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap size={14} />
                ONUs Auto-detectadas na Fibra (Selecione para preencher)
              </span>
              <span className="text-[10px] text-amber-300 font-mono">
                {unassigned.length} aguardando
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUnassigned(u)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 border ${
                    serial === u.serial
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  <span>{u.serial}</span>
                  <span className="text-[10px] opacity-75">({u.pon_identifier})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens de Sucesso ou Erro */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} />
              ONU Autorizada com Sucesso!
            </div>
            <p className="text-slate-300">
              A ONT foi gravada na OLT com os perfis de velocidade e VLAN atribuídos. Sincronizando banco de dados...
            </p>
          </div>
        )}

        {/* CLI Raw Output se disponível */}
        {cliOutput && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
              <Terminal size={13} />
              <span>Log de Execução CLI na OLT:</span>
            </div>
            <pre className="whitespace-pre-wrap text-slate-400">{cliOutput}</pre>
          </div>
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OLT e Porta PON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  OLT Destino
                </label>
                <select
                  value={selectedOltId}
                  onChange={(e) => setSelectedOltId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {olts.map((olt) => (
                    <option key={olt.id} value={olt.id}>
                      {olt.nome} ({olt.fabricante} {olt.modelo} - {olt.ip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Interface PON
                </label>
                <select
                  value={selectedPon}
                  onChange={(e) => {
                    setSelectedPon(e.target.value);
                    const found = pons.find((p) => p.pon_identifier === e.target.value);
                    if (found?.vlan_default) setVlan(found.vlan_default);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {pons.map((pon) => (
                    <option key={pon.id} value={pon.pon_identifier}>
                      PON {pon.pon_identifier} ({pon.onus_total} ONUs cadastradas)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Serial, MAC e Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serial da ONT (PON SN) *
                </label>
                <input
                  type="text"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="Ex: ZTEGC48190A1 ou 4857..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Endereço MAC (Opcional)
                </label>
                <input
                  type="text"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  placeholder="Ex: 74:a7:8e:..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modelo do Equipamento
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: ZTE F670L, Huawei EG8145V5"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Cliente e CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cliente / Assinante *
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome completo do assinante"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPF / CNPJ do Assinante
                </label>
                <input
                  type="text"
                  value={clienteCpf}
                  onChange={(e) => setClienteCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* VLAN e Perfis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  VLAN de Dados
                </label>
                <input
                  type="number"
                  value={vlan}
                  onChange={(e) => setVlan(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Perfil de Linha (Line Profile)
                </label>
                <select
                  value={profileLine}
                  onChange={(e) => setProfileLine(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PROFILE_400M_FIBRA">PROFILE_400M_FIBRA</option>
                  <option value="PROFILE_500M_FIBRA">PROFILE_500M_FIBRA</option>
                  <option value="PROFILE_700M_TURBO">PROFILE_700M_TURBO</option>
                  <option value="PROFILE_1G_DEDICADO">PROFILE_1G_DEDICADO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Perfil de Serviço (Service Profile)
                </label>
                <select
                  value={profileService}
                  onChange={(e) => setProfileService(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="SRV_INTERNET_ROUTER">SRV_INTERNET_ROUTER</option>
                  <option value="SRV_INTERNET_BRIDGE">SRV_INTERNET_BRIDGE</option>
                  <option value="SRV_INTERNET_RESIDENCIAL">SRV_INTERNET_RESIDENCIAL</option>
                </select>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Gravando na OLT...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Comissionar ONT
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
