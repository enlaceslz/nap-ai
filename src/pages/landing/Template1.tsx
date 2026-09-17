import React from 'react';
import { motion } from 'motion/react';
import { Wifi, Zap, Shield, ChevronRight, Globe, Phone, Smartphone, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig, SystemConfig } from '../../contexts/ConfigContext';
import ConsultaViabilidadeBox from '../../components/ConsultaViabilidadeBox';

interface TemplateProps {
 config?: SystemConfig;
}

export default function Template1({ config: propsConfig }: TemplateProps) {
 const { config: contextConfig } = useConfig();
 const config = propsConfig || contextConfig;

 const nomeProvedor = config?.provedor?.nomeFantasia || "DJD Telecom";
 const logoUrl = config?.provedor?.logoUrl;
 const tituloHero = config?.landingPage?.tituloPrincipal || "A internet que conecta você ao futuro.";
 const subtituloHero = config?.landingPage?.subtitulo || "Navegue com ultravelocidade, jogue sem lag e assista seus filmes em 4K sem travamentos. A estabilidade que sua casa e empresa merecem.";
 const textoBotaoCta = config?.landingPage?.textoBotaoCta || "Ver Planos Disponíveis";
 const rawZap = config?.landingPage?.whatsappVendas || config?.provedor?.telefoneWhatsapp || "11987654321";
 const zapClean = String(rawZap).replace(/\D/g, '') || "11987654321";

 const planos = [
 {
 mb: config?.landingPage?.plano1?.velocidade || "500",
 name: config?.landingPage?.plano1?.nome || "Essencial",
 price: config?.landingPage?.plano1?.preco || "89,90",
 tag: config?.landingPage?.plano1?.tag || "Essencial",
 popular: false,
 features: [
 "Upload simétrico de alta performance",
 config?.landingPage?.plano1?.wifi || "Wi-Fi Dual Band Incluso",
 "Instalação 100% gratuita",
 "Suporte técnico humanizado 24h"
 ]
 },
 {
 mb: config?.landingPage?.plano2?.velocidade || "700",
 name: config?.landingPage?.plano2?.nome || "Família",
 price: config?.landingPage?.plano2?.preco || "109,90",
 tag: config?.landingPage?.plano2?.tag || "Mais Vendido",
 popular: true,
 features: [
 "Streaming em 4K sem travamentos",
 config?.landingPage?.plano2?.wifi || "Wi-Fi 6 Mesh Incluso",
 "Instalação 100% gratuita",
 "Suporte VIP Prioritário"
 ]
 },
 {
 mb: config?.landingPage?.plano3?.velocidade || "1000",
 name: config?.landingPage?.plano3?.nome || "Gamer Ultra",
 price: config?.landingPage?.plano3?.preco || "149,90",
 tag: config?.landingPage?.plano3?.tag || "Gamer Pro",
 popular: false,
 features: [
 "Ping ultra baixo com rotas diretas",
 config?.landingPage?.plano3?.wifi || "2x Roteadores Wi-Fi 6 Mesh",
 "Upload de 500 Mega ou simétrico",
 "Prioridade de tráfego QoS"
 ]
 }
 ];

 return (
 <div className="relative min-h-screen bg-background text-white font-outfit overflow-x-hidden selection:bg-blue-500/30" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop)`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
 <div className="absolute inset-0 bg-background/90 pointer-events-none"></div>
 <div className="relative z-10">
 {/* Header */}
 <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
 <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
 {/* Logo do Provedor */}
 <Link to="/" className="flex items-center gap-3">
 {logoUrl ? (
 <img 
 src={logoUrl} 
 alt={nomeProvedor} 
 className="h-10 w-auto max-w-[190px] object-contain"
 />
 ) : (
 <div className="flex items-center gap-2">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0a50ff] to-[#55b0ff] flex items-center justify-center shadow-[0_2px_10px_rgba(10,80,255,0.4)]">
 <span className="text-foreground font-black text-xl tracking-tight font-sans mt-[1px]">N</span>
 </div>
 <span className="font-bold text-2xl tracking-tight text-foreground font-outfit">
 {nomeProvedor}
 </span>
 </div>
 )}
 </Link>
 
 <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
 <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
 <a href="#vantagens" className="hover:text-foreground transition-colors">Vantagens</a>
 <a href={`https://wa.me/55${zapClean}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">WhatsApp Vendas</a>
 </nav>

 <div className="flex items-center gap-3">
 <Link 
 to="/portal" 
 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-card-foreground hover:text-white px-3 sm:px-4 py-2 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition-all"
 >
 <Smartphone size={15} className="text-blue-400" />
 <span>Portal do Cliente</span>
 </Link>
 <Link to="/login" className="bg-card text-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-1.5">
 <span>Login Admin</span> <ChevronRight size={14} />
 </Link>
 </div>
 </div>
 </header>

 {/* Hero Section */}
 <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
 {/* Background Image with Overlay */}
 <div className="absolute inset-0 z-0">
 <img 
 src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
 alt="Cyberpunk Fiber Background" 
 className="w-full h-full object-cover opacity-30"
 />
 <div className="absolute inset-0 bg-gradient-to-b from-[#060b14]/80 via-[#060b14]/90 to-[#060b14]"></div>
 <div className="absolute inset-0 bg-blue-900/10 mix-blend-color"></div>
 </div>

 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
 
 <div className="max-w-7xl mx-auto relative z-10 text-center">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
 >
 <Zap size={14} className="fill-current" /> 100% Fibra Óptica de Ponta a Ponta
 </motion.div>
 
 <motion.h1 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.1 }}
 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight max-w-4xl mx-auto"
 >
 {tituloHero}
 </motion.h1>
 
 <motion.p 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
 >
 {subtituloHero}
 </motion.p>
 
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.3 }}
 className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
 >
 <a 
 href="#planos" 
 className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-all shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
 >
 {textoBotaoCta}
 </a>
 <Link to="/portal" className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-foreground px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-all border border-border hover:border-white/30 flex items-center justify-center gap-2">
 <Smartphone size={20} className="text-blue-400" />
 Acessar Portal do Cliente
 </Link>
 </motion.div>

 {/* Consulta de Viabilidade Integrada */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.4 }}
 className="max-w-xl mx-auto"
 >
 <ConsultaViabilidadeBox 
 nomeProvedor={nomeProvedor} 
 telefoneWhatsapp={zapClean} 
 theme="dark"
 />
 </motion.div>
 </div>
 </section>

 {/* Features Grid */}
 <section className="py-24 px-6 border-t border-border bg-card/50" id="vantagens">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-bold mb-4">Por que escolher a {nomeProvedor}?</h2>
 <p className="text-muted-foreground">Tecnologia de ponta para entregar a melhor experiência.</p>
 </div>
 
 <div className="grid md:grid-cols-3 gap-8">
 {[
 { icon: <Wifi size={32} />, title: "Wi-Fi 6 Incluso", desc: "Roteadores de última geração com maior alcance e capacidade para dezenas de dispositivos simultâneos." },
 { icon: <Shield size={32} />, title: "Conexão Segura & Estável", desc: "Rede monitorada 24/7 pelo NOC com rotas redundantes e proteção contra instabilidades." },
 { icon: <Phone size={32} />, title: "Suporte Humanizado", desc: "Atendimento ágil via WhatsApp, Telefone ou pelo App exclusivo com auto-atendimento." }
 ].map((item, i) => (
 <motion.div 
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="bg-background border border-border p-8 rounded-3xl hover:border-blue-500/30 transition-colors group"
 >
 <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
 {item.icon}
 </div>
 <h3 className="text-xl font-bold mb-3">{item.title}</h3>
 <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* Pricing */}
 <section className="py-24 px-6" id="planos">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16">
 <h2 className="text-3xl font-bold mb-4">Planos Residenciais {nomeProvedor}</h2>
 <p className="text-muted-foreground">Escolha a velocidade ideal para a sua residência ou empresa.</p>
 </div>

 <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
 {planos.map((plan, i) => (
 <motion.div 
 key={i}
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className={`relative rounded-3xl p-1 ${plan.popular ? 'bg-gradient-to-b from-blue-500 to-cyan-400' : 'bg-white/5'} overflow-hidden`}
 >
 {plan.popular && (
 <div className="absolute top-6 right-0 bg-card text-blue-600 text-xs font-bold px-3 py-1 rounded-l-full uppercase tracking-wider shadow">
 {plan.tag}
 </div>
 )}
 <div className="bg-background rounded-[22px] p-8 h-full flex flex-col">
 <h3 className="text-xl font-medium text-muted-foreground mb-2">{plan.name}</h3>
 <div className="flex items-baseline gap-2 mb-6">
 <span className="text-5xl font-bold text-foreground">{plan.mb}</span>
 <span className="text-xl text-muted-foreground font-medium">Mega</span>
 </div>
 <div className="flex items-baseline gap-1 mb-8">
 <span className="text-muted-foreground">R$</span>
 <span className="text-3xl font-bold">{plan.price}</span>
 <span className="text-muted-foreground">/mês</span>
 </div>
 <div className="space-y-4 mb-8 flex-1">
 {plan.features.map((f, j) => (
 <div key={j} className="flex items-center gap-3 text-muted-foreground text-sm">
 <Check size={16} className="text-emerald-400 shrink-0" />
 <span>{f}</span>
 </div>
 ))}
 </div>
 <a 
 href={`https://wa.me/55${zapClean}?text=${encodeURIComponent(`Olá! Tenho interesse em assinar o plano ${plan.name} de ${plan.mb} Mega por R$ ${plan.price}/mês na ${nomeProvedor}.`)}`}
 target="_blank"
 rel="noreferrer"
 className={`w-full py-4 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 ${plan.popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 hover:bg-accent text-white'}`}
 >
 Assinar Plano
 </a>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 
 <footer className="py-8 border-t border-border text-center text-muted-foreground text-sm">
 <p>© {new Date().getFullYear()} {nomeProvedor}. Todos os direitos reservados.</p>
 </footer>
 </div>
 </div>
 );
}
