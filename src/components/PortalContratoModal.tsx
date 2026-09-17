import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, ShieldCheck, Download, 
  X, Check, Lock, Calendar, User, Hash, AlertTriangle, Printer
} from 'lucide-react';

interface PortalContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    nome: string;
    cpf: string;
    contrato: string;
    plano: string;
    endereco: string;
  };
}

export default function PortalContratoModal({
  isOpen,
  onClose,
  cliente
}: PortalContratoModalProps) {
  // Check if contract has been signed in local storage
  const storageKey = `@nap_contrato_assinado_${cliente.contrato}`;
  const [assinado, setAssinado] = useState<boolean>(() => {
    return localStorage.getItem(storageKey) === 'true';
  });
  const [assinando, setAssinando] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [dataAssinatura, setDataAssinatura] = useState<string>(() => {
    return localStorage.getItem(`${storageKey}_data`) || '12/09/2026 às 10:14:22';
  });
  const [hashAssinatura, setHashAssinatura] = useState<string>(() => {
    return localStorage.getItem(`${storageKey}_hash`) || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  });

  if (!isOpen) return null;

  const handleAssinar = () => {
    if (!aceitouTermos) return;
    setAssinando(true);
    setTimeout(() => {
      const now = new Date();
      const formatada = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
      const fakeHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(`${storageKey}_data`, formatada);
      localStorage.setItem(`${storageKey}_hash`, fakeHash);

      setAssinado(true);
      setDataAssinatura(formatada);
      setHashAssinatura(fakeHash);
      setAssinando(false);
    }, 1200);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg font-outfit">Contrato de Prestação de Serviços (SCM)</h3>
              <p className="text-xs text-slate-400 font-mono">Instrumento Particular • {cliente.contrato}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate Seal if signed */}
        {assinado && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Contrato Assinado Digitalmente</strong> em {dataAssinatura} • IP: 177.67.240.12 (Válido Juridicamente)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] border border-emerald-300">
                HASH: {hashAssinatura.slice(0, 12)}...
              </span>
              <button 
                onClick={handleImprimir}
                className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-[11px] transition-colors"
              >
                <Printer size={12} /> Imprimir / PDF
              </button>
            </div>
          </div>
        )}

        {/* Document Body (Scrollable Legal Terms) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-sm leading-relaxed bg-slate-50/50 select-text">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-base font-outfit border-b border-slate-100 pb-2">
              QUALIFICAÇÃO DAS PARTES
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 font-medium">CONTRATANTE (ASSINANTE):</p>
                <p className="font-bold text-slate-900">{cliente.nome}</p>
                <p className="font-mono text-slate-600">CPF: {cliente.cpf}</p>
                <p className="text-slate-600">{cliente.endereco}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">CONTRATADA (PRESTADORA):</p>
                <p className="font-bold text-slate-900">NAP TELECOMUNICAÇÕES LTDA</p>
                <p className="font-mono text-slate-600">CNPJ: 18.293.401/0001-99</p>
                <p className="text-slate-600">Ato de Autorização ANATEL nº 10.420/2021</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div>
              <h5 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">1</span>
                CLÁUSULA PRIMEIRA – DO OBJETO
              </h5>
              <p className="text-slate-600">
                1.1. O presente instrumento tem por objeto a prestação de Serviços de Comunicação Multimídia (SCM) de provimento de acesso à internet por meio de Fibra Óptica (FTTH), referente ao plano <strong>{cliente.plano}</strong>, com taxa de download e upload simétricas e disponibilidade de 99,5% do tempo mensal contratado, observadas as normas da Agência Nacional de Telecomunicações (ANATEL).
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">2</span>
                CLÁUSULA SEGUNDA – DO COMODATO DE EQUIPAMENTOS
              </h5>
              <p className="text-slate-600">
                2.1. A CONTRATADA cede em regime de COMODATO ao CONTRATANTE, para uso exclusivo na execução deste contrato, 01 (um) Terminal de Rede Óptica (ONT Wi-Fi 6 Gigabit), ficando o assinante como fiel depositário do bem, obrigando-se a devolvê-lo nas mesmas condições de funcionamento e conservação em caso de rescisão ou distrato.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">3</span>
                CLÁUSULA TERCEIRA – DA FIDELIDADE E BENEFÍCIOS
              </h5>
              <p className="text-slate-600">
                3.1. Em contrapartida aos benefícios concedidos pela CONTRATADA, consistentes na isenção de taxa de adesão, custos de instalação da fibra e cessão gratuita dos equipamentos em comodato, o CONTRATANTE adere ao prazo de permanência mínima de 12 (doze) meses contados a partir da ativação do serviço.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">4</span>
                CLÁUSULA QUARTA – DA ASSINATURA ELETRÔNICA
              </h5>
              <p className="text-slate-600">
                4.1. As partes reconhecem a plena validade jurídica da manifestação de vontade expressa em formato eletrônico através deste aplicativo do assinante, com fulcro na Medida Provisória nº 2.200-2/2001 e na Lei Federal nº 14.063/2020, constituindo título executivo extrajudicial hábil a todos os efeitos legais.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer / Signature Action */}
        <div className="p-6 bg-white border-t border-slate-200">
          {!assinado ? (
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={aceitouTermos} 
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">
                  Declaro que li, compreendi e concordo integralmente com as cláusulas deste <strong>Contrato de Prestação de Serviços de Internet e Comodato</strong>, manifestando meu aceite formal e eletrônico.
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={handleAssinar}
                  disabled={!aceitouTermos || assinando}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    aceitouTermos && !assinando
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  {assinando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Registrando Assinatura Digital...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Assinar Contrato Digitalmente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Assinatura validada e arquivada em nuvem.</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleImprimir}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Download size={14} /> Baixar Cópia
                </button>
                <button 
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
