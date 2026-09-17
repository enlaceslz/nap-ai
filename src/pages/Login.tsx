import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Server, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
 const [username, setUsername] = useState('admin');
 const [password, setPassword] = useState('admin123');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const { login } = useAuth();
 const navigate = useNavigate();

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 
 try {
 await login(username, password);
 navigate('/admin');
 } catch (err: any) {
 setError(err?.message || 'Credenciais inválidas. Tente novamente.');
 } finally {
 setLoading(false);
 }
 };

 const handleQuickFill = (quickUser: string, quickPass: string) => {
 setUsername(quickUser);
 setPassword(quickPass);
 setError('');
 };

 return (
 <div className="min-h-screen flex bg-background">
 {/* Lado Esquerdo - Decorativo */}
 <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop)`, backgroundSize: "cover", backgroundPosition: "center" }}>
 <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
 {/* Pattern de fundo */}
 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
 
 {/* Glow Effects */}
 <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px]"></div>
 <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[100px]"></div>

 <div className="relative z-10">
 <div className="flex items-center gap-3 mb-16">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center shadow-[0_2px_10px_rgba(10,80,255,0.4)]">
 <span className="text-foreground font-black text-2xl tracking-tight font-sans mt-[1px]">N</span>
 </div>
 <span className="font-bold text-2xl text-white tracking-tight font-outfit">DJD <span className="text-[#55b0ff] font-bold text-xs uppercase tracking-wider bg-[#0a50ff]/15 border border-[#0a50ff]/30 px-2 py-1 rounded ml-1">Omni</span></span>
 </div>

 <h1 className="text-5xl font-bold text-foreground font-outfit leading-tight mb-6">
 A central de comando <br/>do seu provedor.
 </h1>
 <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
 Gestão unificada de chamados, CRM, integrações nativas com SGP e IA projetada para Telecom.
 </p>
 </div>

 <div className="relative z-10 grid grid-cols-2 gap-6 mt-12 max-w-lg">
 <div className="bg-muted/50 backdrop-blur-md border border-border p-5 rounded-2xl">
 <Server className="text-blue-500 mb-3" size={24} />
 <h3 className="text-foreground font-bold mb-1">SGP Sync</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">Sincronização bidirecional em tempo real.</p>
 </div>
 <div className="bg-muted/50 backdrop-blur-md border border-border p-5 rounded-2xl">
 <ShieldCheck className="text-emerald-500 mb-3" size={24} />
 <h3 className="text-foreground font-bold mb-1">Multi-tenant</h3>
 <p className="text-muted-foreground text-sm leading-relaxed">Isolamento seguro de dados por operador.</p>
 </div>
 </div>
 </div>

 {/* Lado Direito - Form de Login */}
 <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
 <div className="w-full max-w-md">
 <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center shadow-[0_2px_10px_rgba(10,80,255,0.4)]">
 <span className="text-foreground font-black text-lg tracking-tight font-sans mt-[1px]">N</span>
 </div>
 <span className="font-bold text-xl text-foreground tracking-tight font-outfit">DJD <span className="text-[#0a50ff] font-bold text-[10px] uppercase tracking-wider bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded ml-1">Omni</span></span>
 </div>

 <div className="mb-8 text-center lg:text-left">
 <h2 className="text-3xl font-bold text-foreground font-outfit mb-2">Bem-vindo de volta</h2>
 <p className="text-muted-foreground font-medium text-sm">Insira suas credenciais para acessar o painel administrativo.</p>
 </div>

 {/* Card com Credenciais de Acesso Disponíveis - Hierarquia do Provedor */}
 <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-2.5">
 <div className="flex items-center justify-between text-blue-900 font-bold">
 <span className="flex items-center gap-1.5">
 <ShieldCheck size={14} className="text-blue-600" />
 Hierarquia de Acesso do Provedor (1-Clique):
 </span>
 <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono font-semibold">4 Perfis Padrão</span>
 </div>
 <div className="grid grid-cols-2 gap-2 pt-0.5">
 <button
 type="button"
 onClick={() => handleQuickFill('admin', 'admin123')}
 className="text-left p-2.5 bg-card hover:bg-blue-100/50 border border-blue-200 rounded-xl transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground text-[11px] group-hover:text-blue-700">1. Admin Geral</span>
 <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">Nível 1</span>
 </div>
 <span className="block text-[10px] text-muted-foreground truncate">Roberto (admin)</span>
 <span className="block font-mono text-[9px] text-blue-600 font-semibold">senha: admin123</span>
 </button>

 <button
 type="button"
 onClick={() => handleQuickFill('operador', 'admin123')}
 className="text-left p-2.5 bg-card hover:bg-blue-100/50 border border-blue-200 rounded-xl transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground text-[11px] group-hover:text-blue-700">2. Operador</span>
 <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold">Nível 2</span>
 </div>
 <span className="block text-[10px] text-muted-foreground truncate">Mariana (Ramal 2001)</span>
 <span className="block font-mono text-[9px] text-blue-600 font-semibold">senha: admin123</span>
 </button>

 <button
 type="button"
 onClick={() => handleQuickFill('tecnico1', 'admin123')}
 className="text-left p-2.5 bg-card hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground text-[11px] group-hover:text-emerald-700">3. Técnico de Campo</span>
 <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">Rua N2</span>
 </div>
 <span className="block text-[10px] text-muted-foreground truncate">Carlos (Fiorino 01)</span>
 <span className="block font-mono text-[9px] text-emerald-600 font-semibold">GPS + OS Mobile</span>
 </button>

 <button
 type="button"
 onClick={() => handleQuickFill('tecnico2', 'admin123')}
 className="text-left p-2.5 bg-card hover:bg-amber-50 border border-amber-200 rounded-xl transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground text-[11px] group-hover:text-amber-700">4. Técnico de NOC</span>
 <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-bold">Nível 3</span>
 </div>
 <span className="block text-[10px] text-muted-foreground truncate">Lucas (NOC Base)</span>
 <span className="block font-mono text-[9px] text-amber-600 font-semibold">GenieACS + CRM</span>
 </button>
 </div>
 </div>

 {error && (
 <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
 <AlertCircle size={18} /> {error}
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-6">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Usuário</label>
 <div className="relative">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
 <input 
 type="text" 
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all font-medium "
 required
 />
 </div>
 </div>

 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha</label>
 <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Esqueceu a senha?</a>
 </div>
 <div className="relative">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
 <input 
 type="password" 
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-foreground outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all font-medium "
 required
 />
 </div>
 </div>

 <button 
 type="submit"
 disabled={loading}
 className="w-full bg-blue-700 hover:bg-blue-600 text-white py-4 rounded-xl font-bold transition-all -700/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 mt-4"
 >
 {loading ? <Loader2 size={20} className="animate-spin" /> : 'Acessar Painel'}
 </button>
 </form>

 <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
 Problemas para acessar? <a href="#" className="text-blue-600 font-bold hover:underline">Fale com o suporte técnico</a>
 </p>
 </div>
 </div>
 </div>
 );
}
