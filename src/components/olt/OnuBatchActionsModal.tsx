import React, { useState } from 'react';
import {
 Sliders,
 Power,
 Lock,
 Unlock,
 Layers,
 RefreshCw,
 CheckCircle2,
 AlertTriangle
} from 'lucide-react';
import { BatchOnuOperationPayload } from '../../types/olt';
import { oltApi } from '../../services/oltApi';

interface OnuBatchActionsModalProps {
 isOpen: boolean;
 onClose: () => void;
 selectedIds: string[];
 onSuccess: () => void;
}

export const OnuBatchActionsModal: React.FC<OnuBatchActionsModalProps> = ({
 isOpen,
 onClose,
 selectedIds,
 onSuccess
}) => {
 const [action, setAction] = useState<'reboot' | 'disable' | 'enable' | 'change_vlan'>('reboot');
 const [vlan, setVlan] = useState<number>(200);
 const [submitting, setSubmitting] = useState(false);
 const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

 if (!isOpen) return null;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);
 setResult(null);

 try {
 const payload: BatchOnuOperationPayload = {
 onu_ids: selectedIds,
 action,
 params: action === 'change_vlan' ? { vlan } : undefined
 };

 const res = await oltApi.executeBatchOperation(payload);
 setResult({ success: res.success, failed: res.failed });
 setTimeout(() => {
 onSuccess();
 onClose();
 }, 2000);
 } catch (err: any) {
 alert('Erro ao executar operação em lote: ' + err.message);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h3 className="font-bold text-foreground text-base flex items-center gap-2">
 <Sliders size={18} className="text-amber-400" />
 Operação em Lote ({selectedIds.length} ONUs)
 </h3>
 <p className="text-xs text-muted-foreground">
 Aplique comandos simultâneos para todas as ONUs selecionadas.
 </p>
 </div>
 <button onClick={onClose} disabled={submitting} className="text-muted-foreground hover:text-foreground text-lg font-bold">
 ✕
 </button>
 </div>

 {result && (
 <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
 <CheckCircle2 size={16} />
 <span>
 Operação concluída! Sucesso: {result.success}, Falhas: {result.failed}
 </span>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-2">
 Selecione a Ação em Massa:
 </label>
 <div className="space-y-2">
 <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-border">
 <input
 type="radio"
 name="action"
 checked={action === 'reboot'}
 onChange={() => setAction('reboot')}
 className="text-amber-500 focus:ring-0"
 />
 <div className="flex items-center gap-2 text-xs text-card-foreground">
 <Power size={14} className="text-amber-400" />
 <div>
 <span className="font-bold block">Reiniciar ONUs (Reboot em Massa)</span>
 <span className="text-[11px] text-muted-foreground">Envia comando de reinicialização remota via OMCI.</span>
 </div>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-border">
 <input
 type="radio"
 name="action"
 checked={action === 'disable'}
 onChange={() => setAction('disable')}
 className="text-rose-500 focus:ring-0"
 />
 <div className="flex items-center gap-2 text-xs text-card-foreground">
 <Lock size={14} className="text-rose-400" />
 <div>
 <span className="font-bold block">Bloquear Portas (Administrative Disable)</span>
 <span className="text-[11px] text-muted-foreground">Interrompe o tráfego óptico no chassi da OLT.</span>
 </div>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-border">
 <input
 type="radio"
 name="action"
 checked={action === 'enable'}
 onChange={() => setAction('enable')}
 className="text-emerald-500 focus:ring-0"
 />
 <div className="flex items-center gap-2 text-xs text-card-foreground">
 <Unlock size={14} className="text-emerald-400" />
 <div>
 <span className="font-bold block">Desbloquear Portas (Administrative Enable)</span>
 <span className="text-[11px] text-muted-foreground">Restaura a operação e o fluxo de pacotes na OLT.</span>
 </div>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:border-border">
 <input
 type="radio"
 name="action"
 checked={action === 'change_vlan'}
 onChange={() => setAction('change_vlan')}
 className="text-cyan-500 focus:ring-0"
 />
 <div className="flex items-center gap-2 text-xs text-card-foreground">
 <Layers size={14} className="text-cyan-400" />
 <div>
 <span className="font-bold block">Migrar VLAN em Lote</span>
 <span className="text-[11px] text-muted-foreground">Altera a tag de VLAN de serviço de todas as ONUs.</span>
 </div>
 </div>
 </label>
 </div>
 </div>

 {action === 'change_vlan' && (
 <div>
 <label className="block text-xs font-semibold text-muted-foreground mb-1">
 Nova Tag de VLAN
 </label>
 <input
 type="number"
 value={vlan}
 onChange={(e) => setVlan(Number(e.target.value))}
 placeholder="200"
 className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-card-foreground font-mono focus:outline-none focus:border-cyan-500"
 required
 />
 </div>
 )}

 <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
 <button
 type="button"
 onClick={onClose}
 disabled={submitting}
 className="px-4 py-2 rounded-lg bg-muted hover:bg-accent text-muted-foreground text-xs font-semibold"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow disabled:opacity-50"
 >
 {submitting ? (
 <>
 <RefreshCw size={14} className="animate-spin" />
 Executando...
 </>
 ) : (
 'Aplicar em Lote'
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};
