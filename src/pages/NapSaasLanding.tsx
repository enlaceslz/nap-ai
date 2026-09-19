import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
 Server, Shield, Zap, Bot, Smartphone, Headphones, 
 CheckCircle2, Edit3, Save, X, Globe, Activity, Mail, Phone, LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NapSaasLanding() {
 const { user } = useAuth();
 const isSuperAdmin = user?.role === 'superadmin';
 const [isEditMode, setIsEditMode] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 // Default content
 const defaultContent = {
 heroTitle: "DJD: O Cérebro do seu Provedor",
 heroSubtitle: "A primeira plataforma Omnichannel IA-First feita exclusivamente para ISPs. Automatize vendas, suporte e retenção com integração nativa SGP, Zabbix e Radius.",
 contactEmail: "contato@nap.ai.slz.br",
 contactPhone: "(98) 99999-9999",
 plan1Name: "Starter ISP",
 plan1Price: "R$ 499/mês",
 plan1Features: ["Até 1.000 Assinantes", "WABA Básico (Sem IA)", "CRM Kanban", "Suporte Ticket"],
 plan2Name: "Pro Automático",
 plan2Price: "R$ 999/mês",
 plan2Features: ["Até 5.000 Assinantes", "Triagem IA (Gemini)", "Integração SGP + Radius", "Portal PWA do Cliente"],
 plan3Name: "Enterprise NOC",
 plan3Price: "R$ 1.999/mês",
 plan3Features: ["Assinantes Ilimitados", "Agent Tool Registry Completo", "Zabbix + OLT Mapping", "Gestão de Frota e Campo"],
 };

 const [content, setContent] = useState(defaultContent);
 const [editedContent, setEditedContent] = useState(defaultContent);

 useEffect(() => {
 const docRef = doc(db, 'system_config', 'nap_saas_landing');
 
 // Attempt to fetch, if it doesn't exist, it uses default.
 const unsubscribe = onSnapshot(docRef, (snap) => {
 if (snap.exists()) {
 setContent({ ...defaultContent, ...snap.data() });
 setEditedContent({ ...defaultContent, ...snap.data() });
 }
 }, (err) => {
 console.warn('[NapSaasLanding] Usando configuração padrão em memória:', err?.message || err);
 });

 return () => unsubscribe();
 }, []);

 const handleSave = async () => {
 setIsSaving(true);
 try {
 const docRef = doc(db, 'system_config', 'nap_saas_landing');
 await setDoc(docRef, editedContent, { merge: true });
 setContent(editedContent);
 setIsEditMode(false);
 } catch (e: any) {
 console.warn("[NapSaasLanding] Falha ao salvar no Firestore (mantido em memória):", e?.message || e);
 setContent(editedContent);
 setIsEditMode(false);
 } finally {
 setIsSaving(false);
 }
 };

 const handleChange = (field: string, value: any) => {
 setEditedContent(prev => ({ ...prev, [field]: value }));
 };

 const handleFeatureChange = (planNum: 1 | 2 | 3, index: number, value: string) => {
 setEditedContent(prev => {
 const planKey = `plan${planNum}Features` as keyof typeof prev;
 const features = [...(prev[planKey] as string[])];
 features[index] = value;
 return { ...prev, [planKey]: features };
 });
 };

 return (
 <div className="min-h-screen bg-[#0b0f19] text-muted-foreground font-sans selection:bg-blue-500/30">
 
 {/* Top Navbar */}
 <nav className="fixed top-0 w-full bg-[#0b0f19]/90 backdrop-blur-md border-b border-border z-50">
 <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
 <Server className="text-foreground" size={20} />
 </div>
 <span className="text-2xl font-black text-foreground tracking-tight">DJD<span className="text-blue-500">.ai</span></span>
 </div>
 <div className="flex items-center gap-6">
 <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block">Plataforma</a>
 <a href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block">Planos</a>
 <a href="#contact" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block">Contato</a>
 <Link to="/login" className="bg-white/10 hover:bg-white/20 text-foreground px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
 <LayoutDashboard size={16} /> Acessar DJD
 </Link>
 </div>
 </div>
 </nav>

 {/* Edit Mode Floating Controls */}
 {isSuperAdmin && (
 <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
 {isEditMode ? (
 <div className="bg-card border border-border p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in">
 <button 
 onClick={() => setIsEditMode(false)}
 className="p-2.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
 title="Cancelar"
 >
 <X size={20} />
 </button>
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
 >
 <Save size={18} />
 {isSaving ? 'Salvando...' : 'Publicar Alterações'}
 </button>
 </div>
 ) : (
 <button 
 onClick={() => setIsEditMode(true)}
 className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all hover:scale-105"
 >
 <Edit3 size={18} />
 Personalizar Landing Page (SuperAdmin)
 </button>
 )}
 </div>
 )}

 {/* Hero Section */}
 <section className="pt-40 pb-20 px-6 relative overflow-hidden">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
 <div className="max-w-4xl mx-auto text-center relative z-10">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
 <Globe size={14} /> Integração Oficial: nap.ai.slz.br
 </div>
 
 {isEditMode ? (
 <div className="space-y-4 mb-8">
 <input 
 type="text" 
 value={editedContent.heroTitle}
 onChange={(e) => handleChange('heroTitle', e.target.value)}
 className="w-full text-5xl md:text-7xl font-black text-center bg-card border border-border rounded-xl p-4 text-foreground focus:outline-none focus:border-blue-500"
 />
 <textarea 
 value={editedContent.heroSubtitle}
 onChange={(e) => handleChange('heroSubtitle', e.target.value)}
 className="w-full text-xl text-center bg-card border border-border rounded-xl p-4 text-muted-foreground focus:outline-none focus:border-blue-500"
 rows={3}
 />
 </div>
 ) : (
 <>
 <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8 leading-[1.1]">
 {content.heroTitle}
 </h1>
 <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
 {content.heroSubtitle}
 </p>
 </>
 )}

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <a href="#pricing" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30">
 Ver Planos ISP
 </a>
 <a href="#contact" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-accent text-foreground font-bold text-lg transition-all border border-border">
 Falar com Consultor
 </a>
 </div>
 </div>
 </section>

 {/* Features Showcase */}
 <section id="features" className="py-24 px-6 border-t border-border bg-background/50">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-black text-foreground mb-4">Arquitetura de Alta Performance</h2>
 <p className="text-muted-foreground">Construído em Node.js e React para rodar de forma isolada na sua infraestrutura.</p>
 </div>
 
 <div className="grid md:grid-cols-3 gap-6">
 <div className="bg-card/50 border border-border p-8 rounded-3xl hover:bg-card transition-colors">
 <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
 <Bot className="text-indigo-400" size={28} />
 </div>
 <h3 className="text-xl font-bold text-foreground mb-3">Motor Gemini Integrado</h3>
 <p className="text-muted-foreground leading-relaxed">Não é apenas um chatbot. A IA da DJD Telecom atua como operador autônomo: lê gráficos Zabbix, reseta portas PON e gera Handoff direto para o CRM.</p>
 </div>
 <div className="bg-card/50 border border-border p-8 rounded-3xl hover:bg-card transition-colors">
 <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
 <Zap className="text-emerald-400" size={28} />
 </div>
 <h3 className="text-xl font-bold text-foreground mb-3">SGP & Radius Connect</h3>
 <p className="text-muted-foreground leading-relaxed">Sincronização bidirecional. O DJD libera clientes em atraso via Promessa de Pagamento automaticamente através dos webhooks da WABA.</p>
 </div>
 <div className="bg-card/50 border border-border p-8 rounded-3xl hover:bg-card transition-colors">
 <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
 <Smartphone className="text-blue-400" size={28} />
 </div>
 <h3 className="text-xl font-bold text-foreground mb-3">PWA do Assinante</h3>
 <p className="text-muted-foreground leading-relaxed">Seu cliente tem um App nativo (Progressive Web App) para 2ª via de fatura, teste de velocidade e suporte, reduzindo o L1 do seu call center.</p>
 </div>
 </div>
 </div>
 </section>

 {/* Pricing */}
 <section id="pricing" className="py-24 px-6 relative">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">Planos Dimensionados para o seu Provedor</h2>
 <p className="text-muted-foreground text-lg">Hospedado no seu VPS. Segurança 100% isolada e de acordo com a LGPD.</p>
 </div>

 <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
 {/* Plan 1 */}
 <div className="bg-card border border-border rounded-3xl p-8 flex flex-col">
 {isEditMode ? (
 <>
 <input type="text" value={editedContent.plan1Name} onChange={e => handleChange('plan1Name', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-xl font-bold text-foreground mb-2" />
 <input type="text" value={editedContent.plan1Price} onChange={e => handleChange('plan1Price', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-3xl font-black text-foreground mb-6" />
 </>
 ) : (
 <>
 <h3 className="text-xl font-bold text-muted-foreground mb-2">{content.plan1Name}</h3>
 <div className="text-4xl font-black text-foreground mb-6">{content.plan1Price}</div>
 </>
 )}
 
 <div className="flex-1 space-y-4 mb-8">
 {[0, 1, 2, 3].map((i) => (
 <div key={i} className="flex items-center gap-3">
 <CheckCircle2 size={20} className="text-muted-foreground shrink-0" />
 {isEditMode ? (
 <input type="text" value={editedContent.plan1Features[i]} onChange={e => handleFeatureChange(1, i, e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1 flex-1 text-sm text-muted-foreground" />
 ) : (
 <span className="text-muted-foreground text-sm">{content.plan1Features[i]}</span>
 )}
 </div>
 ))}
 </div>
 <button className="w-full py-3.5 rounded-xl bg-muted hover:bg-accent text-foreground font-bold transition-colors">Contratar Starter</button>
 </div>

 {/* Plan 2 */}
 <div className="bg-gradient-to-b from-blue-900/40 to-slate-900 border border-blue-500/50 rounded-3xl p-8 flex flex-col relative transform lg:-translate-y-4 shadow-2xl shadow-blue-900/20">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
 Mais Escolhido
 </div>
 {isEditMode ? (
 <>
 <input type="text" value={editedContent.plan2Name} onChange={e => handleChange('plan2Name', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-xl font-bold text-blue-400 mb-2" />
 <input type="text" value={editedContent.plan2Price} onChange={e => handleChange('plan2Price', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-3xl font-black text-foreground mb-6" />
 </>
 ) : (
 <>
 <h3 className="text-xl font-bold text-blue-400 mb-2">{content.plan2Name}</h3>
 <div className="text-4xl font-black text-foreground mb-6">{content.plan2Price}</div>
 </>
 )}
 
 <div className="flex-1 space-y-4 mb-8">
 {[0, 1, 2, 3].map((i) => (
 <div key={i} className="flex items-center gap-3">
 <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
 {isEditMode ? (
 <input type="text" value={editedContent.plan2Features[i]} onChange={e => handleFeatureChange(2, i, e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1 flex-1 text-sm text-card-foreground" />
 ) : (
 <span className="text-card-foreground text-sm font-medium">{content.plan2Features[i]}</span>
 )}
 </div>
 ))}
 </div>
 <button className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">Contratar Pro</button>
 </div>

 {/* Plan 3 */}
 <div className="bg-card border border-border rounded-3xl p-8 flex flex-col">
 {isEditMode ? (
 <>
 <input type="text" value={editedContent.plan3Name} onChange={e => handleChange('plan3Name', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-xl font-bold text-muted-foreground mb-2" />
 <input type="text" value={editedContent.plan3Price} onChange={e => handleChange('plan3Price', e.target.value)} className="bg-background border border-border rounded-lg p-2 text-3xl font-black text-foreground mb-6" />
 </>
 ) : (
 <>
 <h3 className="text-xl font-bold text-muted-foreground mb-2">{content.plan3Name}</h3>
 <div className="text-4xl font-black text-foreground mb-6">{content.plan3Price}</div>
 </>
 )}
 
 <div className="flex-1 space-y-4 mb-8">
 {[0, 1, 2, 3].map((i) => (
 <div key={i} className="flex items-center gap-3">
 <CheckCircle2 size={20} className="text-muted-foreground shrink-0" />
 {isEditMode ? (
 <input type="text" value={editedContent.plan3Features[i]} onChange={e => handleFeatureChange(3, i, e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1 flex-1 text-sm text-muted-foreground" />
 ) : (
 <span className="text-muted-foreground text-sm">{content.plan3Features[i]}</span>
 )}
 </div>
 ))}
 </div>
 <button className="w-full py-3.5 rounded-xl bg-muted hover:bg-accent text-foreground font-bold transition-colors">Falar com Especialista</button>
 </div>
 </div>
 </div>
 </section>

 {/* Footer / Contact */}
 <footer id="contact" className="border-t border-border bg-background py-12 px-6 mt-12">
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <Server className="text-blue-500" size={24} />
 <span className="text-xl font-black text-foreground tracking-tight">DJD<span className="text-blue-500">.ai</span></span>
 </div>
 <p className="text-muted-foreground text-sm">O Cérebro do seu Provedor de Internet.</p>
 <p className="text-muted-foreground text-sm mt-1">Sede Oficial e API Base: <span className="font-mono text-muted-foreground">nap.ai.slz.br</span></p>
 </div>
 
 <div className="flex flex-col sm:flex-row gap-6">
 <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border">
 <Mail className="text-blue-500" size={20} />
 {isEditMode ? (
 <input type="text" value={editedContent.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} className="bg-transparent border-b border-blue-500/50 text-foreground focus:outline-none w-48 text-sm" />
 ) : (
 <span className="text-foreground text-sm font-medium">{content.contactEmail}</span>
 )}
 </div>
 <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border">
 <Phone className="text-emerald-500" size={20} />
 {isEditMode ? (
 <input type="text" value={editedContent.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} className="bg-transparent border-b border-emerald-500/50 text-foreground focus:outline-none w-32 text-sm" />
 ) : (
 <span className="text-foreground text-sm font-medium">{content.contactPhone}</span>
 )}
 </div>
 </div>
 </div>
 </footer>
 </div>
 );
}
