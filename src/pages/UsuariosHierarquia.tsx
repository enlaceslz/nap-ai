import React, { useState, useEffect } from 'react';
import { 
 Users, Shield, Smartphone, Radio, MapPin, Navigation, 
 Send, RefreshCw, CheckCircle2, Battery, AlertCircle, Plus,
 UserCheck, Bell, Activity, Truck, Phone, ChevronRight, Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOperatorPushNotifications } from '../hooks/useOperatorPushNotifications';

type UsuarioItem = {
 id: number;
 nome: string;
 email: string;
 username: string;
 cargo: 'admin' | 'operador' | 'tecnico_campo' | 'tecnico_noc';
 nivel_hierarquia: number;
 cargo_label: string;
 ramal?: string;
 veiculo?: string;
 status: 'online' | 'pausa' | 'em_rota' | 'no_cliente' | 'offline';
 status_label: string;
 filas: string[];
 telefone: string;
 geolocalizacao: {
 ativo: boolean;
 lat: number;
 lng: number;
 precisao_metros: number;
 endereco_estimado: string;
 velocidade_kmh?: number;
 bateria_percentual?: number;
 atualizado_em: string;
 };
 pwa: {
 instalado: boolean;
 dispositivo: string;
 push_ativo: boolean;
 ultimo_acesso: string;
 };
};

type MapaData = {
 total_tecnicos_campo: number;
 tecnicos_em_deslocamento: number;
 tecnicos_em_atendimento: number;
 tecnicos: Array<{
 id: number;
 nome: string;
 veiculo?: string;
 status: string;
 status_label: string;
 lat: number;
 lng: number;
 endereco: string;
 velocidade_kmh: number;
 bateria: number;
 atualizado_em: string;
 }>;
 ordens_servico: Array<{
 id: string;
 numero: string;
 tipo: string;
 cliente_nome: string;
 endereco: string;
 bairro: string;
 lat: number;
 lng: number;
 status: string;
 tecnico_nome: string;
 }>;
};

export default function UsuariosHierarquia() {
 const { user, switchMockUser } = useAuth();
 const { isSubscribed, permission, requestPermission, showNotification } = useOperatorPushNotifications();

 const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
 const [mapa, setMapa] = useState<MapaData | null>(null);
 const [loading, setLoading] = useState(true);
 const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
 const [tabAtiva, setTabAtiva] = useState<'equipe' | 'mapa' | 'pwa_push'>('equipe');
 const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);

 // Carregar usuários e dados do mapa
 const carregarDados = async () => {
 try {
 setLoading(true);
 const [resUsers, resMapa] = await Promise.all([
 fetch('/api/usuarios'),
 fetch('/api/tecnicos/mapa')
 ]);

 const dataUsers = await resUsers.json();
 const dataMapa = await resMapa.json();

 if (dataUsers.sucesso) {
 setUsuarios(dataUsers.usuarios);
 if (!selectedUser && dataUsers.usuarios.length > 0) {
 setSelectedUser(dataUsers.usuarios[0]);
 }
 }
 if (dataMapa.sucesso) {
 setMapa(dataMapa);
 }
 } catch (e) {
 console.warn('Erro ao carregar dados de usuários:', e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 carregarDados();
 const interval = setInterval(carregarDados, 15000); // Polling a cada 15s para posições GPS
 return () => clearInterval(interval);
 }, []);

 // Disparar Push Notification para um membro específico da equipe
 const enviarPushTeste = async (usuario: UsuarioItem) => {
 try {
 const res = await fetch('/api/push/operator/test', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 tipo: (usuario.cargo === 'tecnico_campo' || usuario.cargo === 'tecnico_noc') ? 'suporte' : 'whatsapp',
 operador_nome: usuario.nome,
 ramal: usuario.ramal || 'Campo'
 })
 });
 const data = await res.json();
 if (data.sucesso) {
 setMsgSucesso(`Notificação push enviada para o PWA de ${usuario.nome}!`);
 showNotification(`Push transmitido para ${usuario.nome}`, {
 body: data.mensagem,
 tag: `push_team_${usuario.id}`
 });
 setTimeout(() => setMsgSucesso(null), 4000);
 }
 } catch (e) {
 console.error(e);
 }
 };

 const renderStatusBadge = (status: string, label: string) => {
 switch (status) {
 case 'online':
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
 {label || 'Online'}
 </span>
 );
 case 'em_rota':
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
 <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
 {label || 'Em Rota'}
 </span>
 );
 case 'no_cliente':
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
 <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
 {label || 'No Cliente'}
 </span>
 );
 case 'pausa':
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
 {label || 'Em Pausa'}
 </span>
 );
 case 'offline':
 default:
 return (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
 <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
 {label || 'Offline'}
 </span>
 );
 }
 };

 return (
 <div className="min-h-screen bg-background text-card-foreground p-4 md:p-6 space-y-6 pb-24">
 {/* Header do Módulo de Usuários & Hierarquia */}
 <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
 <Users size={20} />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground font-outfit">Usuários, Hierarquia & Campo</h1>
 <p className="text-xs text-muted-foreground">
 {usuarios.filter(u => u.cargo === 'admin').length} Admin(s) • {usuarios.filter(u => u.cargo === 'operador').length} Operador(es) • {usuarios.filter(u => u.cargo === 'tecnico_campo').length} Técnico(s) de Campo
 </p>
 </div>
 </div>
 </div>

 {/* Alternador de Perfis em Tempo Real para Demonstração */}
 <div className="flex flex-wrap items-center gap-2 bg-background border border-border p-1.5 rounded-xl">
 <span className="text-[10px] text-muted-foreground font-bold uppercase px-2">Trocar Sessão:</span>
 <button
 onClick={() => switchMockUser('admin')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 user?.role === 'admin' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Admin
 </button>
 <button
 onClick={() => switchMockUser('operador')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 user?.role === 'operador' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Operador
 </button>
 <button
 onClick={() => switchMockUser('tecnico1')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 user?.role === 'tecnico_campo' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Técnico Campo
 </button>
 <button
 onClick={() => switchMockUser('tecnico2')}
 className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 user?.role === 'tecnico_noc' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Técnico NOC
 </button>
 </div>
 </div>

 {msgSucesso && (
 <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in fade-in duration-200">
 <CheckCircle2 size={18} />
 <span>{msgSucesso}</span>
 </div>
 )}

 {/* Tabs de Navegação */}
 <div className="flex border-b border-border gap-4 text-sm font-semibold">
 <button
 onClick={() => setTabAtiva('equipe')}
 className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
 tabAtiva === 'equipe'
 ? 'border-blue-500 text-blue-400'
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <Shield size={16} />
 <span>Hierarquia da Equipe ({usuarios.length})</span>
 </button>

 <button
 onClick={() => setTabAtiva('mapa')}
 className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
 tabAtiva === 'mapa'
 ? 'border-emerald-500 text-emerald-400'
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <MapPin size={16} />
 <span>Mapa de Campo em Tempo Real</span>
 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-mono">
 Ao Vivo
 </span>
 </button>

 <button
 onClick={() => setTabAtiva('pwa_push')}
 className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
 tabAtiva === 'pwa_push'
 ? 'border-amber-500 text-amber-400'
 : 'border-transparent text-muted-foreground hover:text-card-foreground'
 }`}
 >
 <Smartphone size={16} />
 <span>PWA & Notificações Push</span>
 </button>
 </div>

 {/* CONTEÚDO TAB 1: Hierarquia da Equipe */}
 {tabAtiva === 'equipe' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Bloco Nível 1: Admin */}
 <div className="bg-card border border-purple-500/30 rounded-2xl p-5 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
 Nível 1 • Diretoria
 </span>
 <span className="text-xs text-purple-400 font-bold">1 Usuário</span>
 </div>

 {usuarios.filter(u => u.cargo === 'admin').map(admin => (
 <div key={admin.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold text-foreground text-base">{admin.nome}</h3>
 <p className="text-xs text-muted-foreground">{admin.cargo_label}</p>
 <p className="text-xs font-mono text-purple-400">{admin.email}</p>
 </div>
 {renderStatusBadge(admin.status, admin.status_label)}
 </div>

 <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
 <span>Ramal: <strong className="text-card-foreground">{admin.ramal}</strong></span>
 <span className="text-emerald-400 font-medium">Acesso Total</span>
 </div>

 <button
 onClick={() => enviarPushTeste(admin)}
 className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-accent text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5 transition-colors"
 >
 <Bell size={12} /> Testar Push PWA
 </button>
 </div>
 ))}
 </div>

 {/* Bloco Nível 2: Operador de Atendimento */}
 <div className="bg-card border border-blue-500/30 rounded-2xl p-5 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
 Nível 2 • Atendimento & Suporte
 </span>
 <span className="text-xs text-blue-400 font-bold">1 Usuário</span>
 </div>

 {usuarios.filter(u => u.cargo === 'operador').map(op => (
 <div key={op.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold text-foreground text-base">{op.nome}</h3>
 <p className="text-xs text-muted-foreground">{op.cargo_label}</p>
 <p className="text-xs font-mono text-blue-400">{op.email}</p>
 </div>
 {renderStatusBadge(op.status, op.status_label)}
 </div>

 <div className="flex flex-wrap gap-1">
 {op.filas.map(f => (
 <span key={f} className="text-[10px] bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
 {f}
 </span>
 ))}
 </div>

 <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
 <span>Ramal: <strong className="text-card-foreground">{op.ramal}</strong></span>
 <span className="text-emerald-400 font-medium">WhatsApp + PABX</span>
 </div>

 <button
 onClick={() => enviarPushTeste(op)}
 className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-xs font-bold text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
 >
 <Bell size={12} /> Testar Push PWA
 </button>
 </div>
 ))}
 </div>

 {/* Bloco Nível 3: Técnicos de Campo */}
 <div className="bg-card border border-emerald-500/30 rounded-2xl p-5 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
 Nível 3 • Operações de Campo
 </span>
 <span className="text-xs text-emerald-400 font-bold">2 Usuários (GPS Ativo)</span>
 </div>

 {usuarios.filter(u => u.cargo === 'tecnico_campo' || u.cargo === 'tecnico_noc').map(tec => (
 <div key={tec.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold text-foreground text-base">{tec.nome}</h3>
 <p className="text-xs text-muted-foreground">{tec.cargo_label}</p>
 <p className="text-xs font-mono text-emerald-400">{tec.veiculo}</p>
 </div>
 <div className="flex flex-col items-end gap-1">
 {renderStatusBadge(tec.status, tec.status_label)}
 {tec.geolocalizacao?.ativo && (
 <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
 <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
 GPS Ativo
 </span>
 )}
 </div>
 </div>

 <div className="text-xs text-muted-foreground space-y-1">
 <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
 <MapPin size={12} className="text-red-400 shrink-0" />
 <span className="truncate">{tec.geolocalizacao.endereco_estimado}</span>
 </div>
 <div className="flex items-center justify-between text-[11px]">
 <span>Velocidade: <strong className="text-card-foreground">{tec.geolocalizacao.velocidade_kmh || 0} km/h</strong></span>
 <span>Bateria: <strong className="text-emerald-400">{tec.geolocalizacao.bateria_percentual || 85}%</strong></span>
 </div>
 </div>

 <button
 onClick={() => enviarPushTeste(tec)}
 className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
 >
 <Bell size={12} /> Notificar OS via Push
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* CONTEÚDO TAB 2: Mapa de Campo em Tempo Real */}
 {tabAtiva === 'mapa' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Visualizador de Coordenadas e Radar dos Técnicos */}
 <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Navigation size={18} className="text-emerald-400" />
 <h3 className="font-bold text-foreground text-base">Radar de Rastreamento GPS ao Vivo</h3>
 </div>
 <button
 onClick={carregarDados}
 className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
 >
 <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
 <span>Sincronizar Satélite</span>
 </button>
 </div>

 {/* Simulação Visual de Mapa com Pontos de Técnicos e OSs */}
 <div className="relative w-full h-80 bg-background rounded-xl border border-border overflow-hidden flex flex-col justify-between p-4">
 {/* Linhas de Grade Tática */}
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

 {/* Marcador Sede Provedor */}
 <div className="relative z-10 self-center mt-12 flex flex-col items-center">
 <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
 ISP
 </div>
 <span className="text-[10px] font-bold bg-card px-2 py-0.5 rounded border border-border mt-1 text-muted-foreground">
 Sede Central (Admin & Operador)
 </span>
 </div>

 {/* Marcadores dos Técnicos em Campo */}
 <div className="relative z-10 grid grid-cols-2 gap-4">
 {mapa?.tecnicos.map((tec, idx) => (
 <div key={tec.id} className="bg-card/90 backdrop-blur border border-emerald-500/40 p-3 rounded-xl shadow-lg">
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center gap-1.5">
 <Truck size={14} className="text-emerald-400" />
 <span className="text-xs font-bold text-foreground">{tec.nome}</span>
 </div>
 <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
 {tec.velocidade_kmh} km/h
 </span>
 </div>
 <p className="text-[11px] text-muted-foreground truncate">{tec.endereco}</p>
 <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-1.5 border-t border-border">
 <span>{tec.veiculo}</span>
 <span className="text-emerald-400 font-semibold">{tec.status_label}</span>
 </div>
 </div>
 ))}
 </div>

 {/* Rodapé do Radar */}
 <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
 <span className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
 Rastreamento GPS Ativo em 100% da Frota
 </span>
 <span className="font-mono text-[11px]">Precisão Média: 8 metros</span>
 </div>
 </div>
 </div>

 {/* Coluna Direita: Ordens de Serviço Georreferenciadas */}
 <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 space-y-4">
 <h3 className="font-bold text-foreground text-base flex items-center gap-2">
 <MapPin size={18} className="text-red-400" />
 OSs Ativas no Mapa
 </h3>

 <div className="space-y-3">
 {mapa?.ordens_servico.map(os => (
 <div key={os.id} className="p-3 bg-background border border-border rounded-xl space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="font-mono text-xs font-bold text-blue-400">{os.numero}</span>
 <span className="text-[10px] uppercase font-bold bg-white/5 text-muted-foreground px-2 py-0.5 rounded">
 {os.tipo}
 </span>
 </div>
 <h4 className="text-xs font-bold text-foreground truncate">{os.cliente_nome}</h4>
 <p className="text-[11px] text-muted-foreground truncate">{os.endereco}, {os.bairro}</p>
 <div className="text-[10px] text-emerald-400 font-medium pt-1 border-t border-border flex items-center justify-between">
 <span>Técnico: {os.tecnico_nome}</span>
 <span className="uppercase">{os.status}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* CONTEÚDO TAB 3: PWA & Notificações Push Multi-Papel */}
 {tabAtiva === 'pwa_push' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Status PWA Global */}
 <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
 <Smartphone size={20} />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-base">PWA Instalado para Todos</h3>
 <p className="text-xs text-muted-foreground">Compatível com Android, iOS, Windows e Mac</p>
 </div>
 </div>

 <div className="space-y-2">
 {usuarios.map(u => (
 <div key={u.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl text-xs">
 <div>
 <strong className="text-foreground block">{u.nome} ({u.cargo_label})</strong>
 <span className="text-muted-foreground text-[11px]">{u.pwa.dispositivo}</span>
 </div>
 <div className="text-right">
 <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
 PWA Ativo
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Notificações Push & VAPID */}
 <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
 <Bell size={20} />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-base">Push Notifications (Web Push API)</h3>
 <p className="text-xs text-muted-foreground">Canais de alerta por papel (WhatsApp, Suporte, NOC, OS)</p>
 </div>
 </div>

 <div className="p-4 bg-background border border-border rounded-xl space-y-3 text-xs">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Permissão do Navegador:</span>
 <span className="font-bold text-emerald-400 uppercase">{permission}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Inscrição VAPID:</span>
 <span className="font-mono text-[11px] text-blue-400">Ativa no Service Worker</span>
 </div>
 <button
 onClick={requestPermission}
 className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
 >
 Garantir Permissão de Notificação Push
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
