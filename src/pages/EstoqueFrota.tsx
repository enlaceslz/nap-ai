import React, { useState, useEffect } from 'react';
import { 
 Package, Truck, Wrench, Search, Plus, MapPin, AlertTriangle, 
 CheckCircle2, Clock, Filter, BarChart2, Hash, ArrowRight, ScanLine, Key,
 X, Save, Check
} from 'lucide-react';

const initialEstoque = [
 { id: 'EQP-1001', nome: 'ONT Huawei HG8145V5', categoria: 'ONU/ONT', qtd: 145, minimo: 50, status: 'ok' },
 { id: 'EQP-1002', nome: 'ONT ZTE F670L', categoria: 'ONU/ONT', qtd: 32, minimo: 50, status: 'alerta' },
 { id: 'EQP-1003', nome: 'Roteador TP-Link EX220', categoria: 'Roteador Wi-Fi 6', qtd: 210, minimo: 100, status: 'ok' },
 { id: 'CAB-2001', nome: 'Cabo Drop Flat 1KM (Bobina)', categoria: 'Fibra Óptica', qtd: 8, minimo: 15, status: 'alerta' },
 { id: 'CX-3001', nome: 'Caixa CTO 16 Portas', categoria: 'Caixas FTTx', qtd: 4, minimo: 10, status: 'critico' },
 { id: 'CON-4001', nome: 'Conector Fast SC/APC', categoria: 'Ferragens & Acessórios', qtd: 1500, minimo: 500, status: 'ok' },
];

const initialFrota = [
 { id: 'FROTA-01', placa: 'ABC-1234', veiculo: 'Fiat Uno (Escada)', tecnico: 'Marcos Silva', status: 'em_rota', combustivel: 80, km: '45.120', rastreador: 'Online' },
 { id: 'FROTA-02', placa: 'XYZ-9876', veiculo: 'VW Gol (Suporte)', tecnico: 'João Pedro', status: 'base', combustivel: 15, km: '89.430', rastreador: 'Online' },
 { id: 'FROTA-03', placa: 'DEF-5678', veiculo: 'Fiat Fiorino (Fibra)', tecnico: 'Equipe Lançamento', status: 'em_rota', combustivel: 65, km: '21.050', rastreador: 'Online' },
 { id: 'FROTA-04', placa: 'GHI-9012', veiculo: 'Renault Kwid', tecnico: 'Manutenção', status: 'manutencao', combustivel: 40, km: '112.500', rastreador: 'Offline' },
];

export default function EstoqueFrota() {
 const [activeTab, setActiveTab] = useState<'estoque' | 'frota'>('estoque');
 const [searchTerm, setSearchTerm] = useState('');
 
 // States for data
 const [estoque, setEstoque] = useState(initialEstoque);
 const [frota, setFrota] = useState(initialFrota);

 // States for Modals
 const [toastMsg, setToastMsg] = useState<string | null>(null);
 const [showTransferModal, setShowTransferModal] = useState<string | null>(null); // Item ID
 const [showNovaEntrada, setShowNovaEntrada] = useState(false);
 const [showFrotaAction, setShowFrotaAction] = useState<string | null>(null); // Frota ID

 const showToast = (msg: string) => {
 setToastMsg(msg);
 setTimeout(() => setToastMsg(null), 3000);
 };

 useEffect(() => {
 setSearchTerm('');
 }, [activeTab]);

 const filteredEstoque = estoque.filter(item => 
 item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
 item.id.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const filteredFrota = frota.filter(veiculo => 
 veiculo.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) || 
 veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
 veiculo.id.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleTransfer = (id: string, qtdTranferir: number) => {
 setEstoque(prev => prev.map(item => {
 if (item.id === id) {
 const novaQtd = Math.max(0, item.qtd - qtdTranferir);
 return {
 ...item,
 qtd: novaQtd,
 status: novaQtd <= item.minimo / 2 ? 'critico' : novaQtd <= item.minimo ? 'alerta' : 'ok'
 };
 }
 return item;
 }));
 setShowTransferModal(null);
 showToast(`Transferência de ${qtdTranferir} unid. concluída com sucesso.`);
 };

 const handleNovaEntradaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 const nome = formData.get('nome') as string;
 const qtd = parseInt(formData.get('qtd') as string, 10);
 const minimo = parseInt(formData.get('minimo') as string, 10);
 
 const novoItem = {
 id: `EQP-${Math.floor(Math.random() * 10000)}`,
 nome,
 categoria: formData.get('categoria') as string,
 qtd,
 minimo,
 status: qtd <= minimo / 2 ? 'critico' : qtd <= minimo ? 'alerta' : 'ok'
 };
 
 setEstoque([novoItem, ...estoque]);
 setShowNovaEntrada(false);
 showToast(`Novo item ${novoItem.id} adicionado ao estoque.`);
 };

 const handleFrotaStatusChange = (id: string, novoStatus: string, novoCombustivel: number) => {
 setFrota(prev => prev.map(v => {
 if (v.id === id) {
 return { ...v, status: novoStatus, combustivel: novoCombustivel };
 }
 return v;
 }));
 setShowFrotaAction(null);
 showToast(`Status do veículo atualizado com sucesso.`);
 };

 return (
 <div className="flex-1 flex flex-col h-full bg-background text-muted-foreground overflow-hidden font-sans relative">
 
 {/* TOAST */}
 {toastMsg && (
 <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md font-bold text-sm">
 <Check size={16} />
 {toastMsg}
 </div>
 )}

 {/* HEADER */}
 <div className="px-6 py-5 border-b border-border bg-card/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
 <Package size={20} />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground font-outfit tracking-wide flex items-center gap-2">
 Logística: Estoque & Frota
 </h1>
 <p className="text-sm text-muted-foreground mt-0.5">Gestão de Almoxarifado, CPEs e Rastreamento de Veículos</p>
 </div>
 </div>
 </div>

 <div className="flex bg-background p-1 rounded-xl border border-border">
 <button
 onClick={() => setActiveTab('estoque')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'estoque' 
 ? 'bg-muted text-foreground shadow-sm' 
 : 'text-muted-foreground hover:text-card-foreground hover:bg-accent'
 }`}
 >
 <Package size={16} /> Almoxarifado
 </button>
 <button
 onClick={() => setActiveTab('frota')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'frota' 
 ? 'bg-muted text-foreground shadow-sm' 
 : 'text-muted-foreground hover:text-card-foreground hover:bg-accent'
 }`}
 >
 <Truck size={16} /> Frota & Viaturas
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 <div className="max-w-7xl mx-auto space-y-6">

 {activeTab === 'estoque' && (
 <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
 <ScanLine size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">{estoque.length}</p>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total de Itens (SKUs)</p>
 </div>
 
 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
 <AlertTriangle size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {estoque.filter(e => e.status === 'alerta' || e.status === 'critico').length}
 </p>
 <p className="text-xs text-amber-400 uppercase tracking-wider font-bold">Abaixo do Mínimo</p>
 </div>

 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
 <ArrowRight size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">12</p>
 <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Movimentações Hoje (Saída)</p>
 </div>
 </div>

 <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
 <div className="px-6 py-5 border-b border-border flex flex-wrap justify-between items-center gap-4 bg-card/50">
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <Package size={18} className="text-blue-500" />
 Inventário
 </h3>
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text" 
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 placeholder="Buscar material ou SKU..." 
 className="pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-blue-500 outline-none w-64"
 />
 </div>
 <button 
 onClick={() => setShowNovaEntrada(true)}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
 >
 <Plus size={16} /> Nova Entrada
 </button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-background/50 text-muted-foreground font-bold uppercase tracking-wider text-[11px] border-b border-border">
 <tr>
 <th className="px-6 py-4">SKU / ID</th>
 <th className="px-6 py-4">Descrição do Material</th>
 <th className="px-6 py-4">Categoria</th>
 <th className="px-6 py-4 text-right">Qtd Estoque</th>
 <th className="px-6 py-4 text-center">Status</th>
 <th className="px-6 py-4 text-right">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5 bg-card">
 {filteredEstoque.map(item => (
 <tr key={item.id} className="hover:bg-accent transition-colors group">
 <td className="px-6 py-4 font-mono text-xs">{item.id}</td>
 <td className="px-6 py-4 font-bold text-foreground">{item.nome}</td>
 <td className="px-6 py-4">
 <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-[10px] font-medium border border-border">
 {item.categoria}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <span className={`font-mono font-bold text-base ${item.status === 'critico' ? 'text-red-400' : item.status === 'alerta' ? 'text-amber-400' : 'text-card-foreground'}`}>
 {item.qtd}
 </span>
 <span className="text-[10px] text-muted-foreground block">Mín: {item.minimo}</span>
 </td>
 <td className="px-6 py-4 text-center">
 {item.status === 'ok' && <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12}/> Saudável</span>}
 {item.status === 'alerta' && <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12}/> Alerta</span>}
 {item.status === 'critico' && <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse"><AlertTriangle size={12}/> Crítico</span>}
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => setShowTransferModal(item.id)}
 className="px-3 py-1.5 bg-muted hover:bg-accent text-muted-foreground text-xs font-bold rounded-lg transition-colors border border-border"
 >
 Transferir
 </button>
 </td>
 </tr>
 ))}
 {filteredEstoque.length === 0 && (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
 Nenhum item encontrado no estoque.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'frota' && (
 <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
 
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
 <Truck size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">{frota.length}</p>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Veículos Totais</p>
 </div>
 
 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
 <MapPin size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {frota.filter(v => v.status === 'em_rota').length}
 </p>
 <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold">Na Rua (Em Rota)</p>
 </div>

 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
 <Key size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {frota.filter(v => v.status === 'base').length}
 </p>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pátio / Base</p>
 </div>

 <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
 <div className="flex justify-between items-start mb-2">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
 <Wrench size={20} />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground font-outfit mb-1">
 {frota.filter(v => v.status === 'manutencao').length}
 </p>
 <p className="text-xs text-red-400 uppercase tracking-wider font-bold">Em Manutenção</p>
 </div>
 </div>

 <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
 <div className="px-6 py-5 border-b border-border flex flex-wrap justify-between items-center gap-4 bg-card/50">
 <h3 className="font-bold text-lg text-foreground font-outfit flex items-center gap-2">
 <Truck size={18} className="text-amber-500" />
 Viaturas
 </h3>
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text" 
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 placeholder="Buscar placa ou veículo..." 
 className="pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-blue-500 outline-none w-64"
 />
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-background/50 text-muted-foreground font-bold uppercase tracking-wider text-[11px] border-b border-border">
 <tr>
 <th className="px-6 py-4">ID / Placa</th>
 <th className="px-6 py-4">Veículo</th>
 <th className="px-6 py-4">Equipe / Técnico</th>
 <th className="px-6 py-4">Hodômetro</th>
 <th className="px-6 py-4 text-center">Combustível</th>
 <th className="px-6 py-4 text-center">GPS Tracker</th>
 <th className="px-6 py-4 text-center">Status</th>
 <th className="px-6 py-4 text-right">Ação</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5 bg-card">
 {filteredFrota.map(v => (
 <tr key={v.id} className="hover:bg-accent transition-colors group">
 <td className="px-6 py-4">
 <p className="font-bold text-foreground text-xs">{v.id}</p>
 <p className="font-mono text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded w-fit border border-border">{v.placa}</p>
 </td>
 <td className="px-6 py-4 font-bold text-card-foreground">{v.veiculo}</td>
 <td className="px-6 py-4 text-muted-foreground">{v.tecnico}</td>
 <td className="px-6 py-4 font-mono text-xs">{v.km} km</td>
 <td className="px-6 py-4 text-center">
 <div className="flex flex-col items-center">
 <span className={`text-[10px] font-bold ${v.combustivel < 20 ? 'text-red-400' : 'text-muted-foreground'}`}>{v.combustivel}%</span>
 <div className="w-10 h-1.5 bg-muted rounded-full mt-1 overflow-hidden border border-border">
 <div className={`h-full ${v.combustivel < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${v.combustivel}%` }}></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 {v.rastreador === 'Online' ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Online
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
 <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Offline
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-center">
 {v.status === 'em_rota' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Na Rua</span>}
 {v.status === 'base' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Base (Pátio)</span>}
 {v.status === 'manutencao' && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Oficina</span>}
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => setShowFrotaAction(v.id)}
 className="px-3 py-1.5 bg-muted hover:bg-accent text-muted-foreground text-xs font-bold rounded-lg transition-colors border border-border"
 >
 Atualizar
 </button>
 </td>
 </tr>
 ))}
 {filteredFrota.length === 0 && (
 <tr>
 <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
 Nenhuma viatura encontrada.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* MODALS */}
 {showNovaEntrada && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Plus size={18} className="text-blue-400" /> Nova Entrada de Estoque
 </h3>
 <button onClick={() => setShowNovaEntrada(false)} className="text-muted-foreground hover:text-foreground">
 <X size={20} />
 </button>
 </div>
 <form onSubmit={handleNovaEntradaSubmit} className="p-5 space-y-4">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Descrição do Item</label>
 <input required name="nome" type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500" placeholder="Ex: Roteador AC1200" />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Categoria</label>
 <select required name="categoria" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500">
 <option value="ONU/ONT">ONU / ONT</option>
 <option value="Roteador Wi-Fi 6">Roteador Wi-Fi</option>
 <option value="Fibra Óptica">Cabo / Fibra Óptica</option>
 <option value="Caixas FTTx">Caixas de Emenda / CTO</option>
 <option value="Ferragens & Acessórios">Ferragens & Acessórios</option>
 <option value="Outros">Outros</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Qtd Inicial</label>
 <input required name="qtd" type="number" min="0" defaultValue="1" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500" />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Estoque Mínimo</label>
 <input required name="minimo" type="number" min="1" defaultValue="10" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500" />
 </div>
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
 <button type="button" onClick={() => setShowNovaEntrada(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
 <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
 <Save size={16} /> Salvar Item
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showTransferModal && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <ArrowRight size={18} className="text-amber-400" /> Transferir Item
 </h3>
 <button onClick={() => setShowTransferModal(null)} className="text-muted-foreground hover:text-foreground">
 <X size={20} />
 </button>
 </div>
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 handleTransfer(showTransferModal, parseInt(formData.get('qtd') as string, 10));
 }} className="p-5 space-y-4">
 <p className="text-sm text-muted-foreground mb-4">
 Selecione a quantidade para transferir do <strong className="text-foreground">Estoque Principal</strong> para uma <strong className="text-foreground">Viatura/Técnico</strong>.
 </p>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Quantidade</label>
 <input required name="qtd" type="number" min="1" defaultValue="1" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500" />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Destino (Técnico/Viatura)</label>
 <select required className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500">
 {frota.map(v => (
 <option key={v.id} value={v.id}>{v.tecnico} - {v.veiculo}</option>
 ))}
 </select>
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
 <button type="button" onClick={() => setShowTransferModal(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
 <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-bold flex items-center gap-2">
 <Check size={16} /> Confirmar
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showFrotaAction && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Truck size={18} className="text-emerald-400" /> Atualizar Viatura
 </h3>
 <button onClick={() => setShowFrotaAction(null)} className="text-muted-foreground hover:text-foreground">
 <X size={20} />
 </button>
 </div>
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.currentTarget);
 handleFrotaStatusChange(
 showFrotaAction, 
 formData.get('status') as string, 
 parseInt(formData.get('combustivel') as string, 10)
 );
 }} className="p-5 space-y-4">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Status da Viatura</label>
 <select required name="status" defaultValue={frota.find(v => v.id === showFrotaAction)?.status} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500">
 <option value="base">Base (Pátio)</option>
 <option value="em_rota">Em Rota (Na Rua)</option>
 <option value="manutencao">Em Manutenção / Oficina</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Nível de Combustível (%)</label>
 <input required name="combustivel" type="number" min="0" max="100" defaultValue={frota.find(v => v.id === showFrotaAction)?.combustivel} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-foreground outline-none focus:border-blue-500" />
 </div>
 <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
 <button type="button" onClick={() => setShowFrotaAction(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
 <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2">
 <Save size={16} /> Atualizar
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}
