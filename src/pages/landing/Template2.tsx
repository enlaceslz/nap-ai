import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Wifi, Zap, ArrowRight, ShieldAlert, MonitorPlay, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig, SystemConfig } from '../../contexts/ConfigContext';
import ConsultaViabilidadeBox from '../../components/ConsultaViabilidadeBox';

interface TemplateProps {
 config?: SystemConfig;
}

export default function Template2({ config: propsConfig }: TemplateProps) {
 const { config: contextConfig } = useConfig();
 const config = propsConfig || contextConfig;

 const nomeProvedor = config?.provedor?.nomeFantasia || "DJD Telecom";
 const logoUrl = config?.provedor?.logoUrl;
 const tituloHero = config?.landingPage?.tituloPrincipal || "Zero Lag. 100% Vitória.";
 const subtituloHero = config?.landingPage?.subtitulo || "A internet fibra óptica desenvolvida para entregar o menor ping e a maior taxa de download da região.";
 const textoBotaoCta = config?.landingPage?.textoBotaoCta || "Quero Fibra Agora";
 const rawZap = config?.landingPage?.whatsappVendas || config?.provedor?.telefoneWhatsapp || "11987654321";
 const zapClean = String(rawZap).replace(/\D/g, '') || "11987654321";

 const planos = [
 {
 mb: config?.landingPage?.plano1?.velocidade || "500",
 name: config?.landingPage?.plano1?.nome || "Start Gamer",
 price: config?.landingPage?.plano1?.preco || "89,90",
 desc: config?.landingPage?.plano1?.wifi || "Perfeito para streaming e jogatinas diárias",
 glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
 highlight: false
 },
 {
 mb: config?.landingPage?.plano2?.velocidade || "700",
 name: config?.landingPage?.plano2?.nome || "Pro Gamer",
 price: config?.landingPage?.plano2?.preco || "109,90",
 desc: config?.landingPage?.plano2?.wifi || "Ping otimizado para servidores de alta competição",
 glow: "shadow-[0_0_40px_rgba(236,72,153,0.4)] border-pink-500/50",
 highlight: true
 },
 {
 mb: config?.landingPage?.plano3?.velocidade || "1000",
 name: config?.landingPage?.plano3?.nome || "Extreme Ultra",
 price: config?.landingPage?.plano3?.preco || "149,90",
 desc: config?.landingPage?.plano3?.wifi || "Upload simétrico máximo com 2 Roteadores Wi-Fi 6 Mesh",
 glow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]",
 highlight: false
 }
 ];

 return (
 <div className="min-h-screen bg-background text-white font-outfit overflow-x-hidden selection:bg-purple-500/30">
 {/* Header */}
 <header className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-purple-500/10">
 <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
 <Link to="/" className="flex items-center gap-3">
 {logoUrl ? (
 <img 
 src={logoUrl} 
 alt={nomeProvedor} 
 className="h-10 w-auto max-w-[190px] object-contain"
 />
 ) : (
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
 <span className="text-foreground font-black text-xl tracking-tight font-sans mt-[1px]">N</span>
 </div>
 <span className="font-bold text-2xl tracking-tight text-foreground">{nomeProvedor}</span>
 </div>
 )}
 </Link>
 
 <nav className="hidden md:flex gap-8 text-sm font-bold text-purple-200/60 uppercase tracking-wider">
 <a href="#planos" className="hover:text-purple-300 transition-colors">Planos</a>
 <a href="#cobertura" className="hover:text-purple-300 transition-colors">Vantagens</a>
 <a href={`https://wa.me/55${zapClean}`} target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">WhatsApp</a>
 </nav>

 <div className="flex items-center gap-3">
 <Link 
 to="/portal" 
 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-100 hover:text-white px-3 sm:px-4 py-2 rounded-full bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 transition-all"
 >
 <Smartphone size={15} className="text-pink-400" />
 <span>Portal do Cliente</span>
 </Link>
 <Link to="/login" className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all flex items-center gap-1.5 uppercase tracking-wide">
 <span>Admin</span>
 </Link>
 </div>
 </div>
 </header>

 {/* Hero Section */}
 <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 px-6 overflow-hidden">
 <div className="absolute inset-0 z-0">
 <img 
 src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
 alt="Gamer Setup Background" 
 className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
 />
 <div className="absolute inset-0 bg-gradient-to-r from-[#090014] via-[#090014]/90 to-[#090014]/40"></div>
 <div className="absolute inset-0 bg-gradient-to-t from-[#090014] via-transparent to-[#090014]/80"></div>
 </div>

 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
 <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/30 blur-[150px] rounded-full mix-blend-screen"></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
 
 {/* Animated grid */}
 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] [transform-origin:center_top] opacity-20"></div>
 </div>
 
 <div className="max-w-7xl mx-auto relative z-10">
 <div className="grid lg:grid-cols-2 gap-12 items-center">
 <div>
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-bold mb-6 uppercase tracking-widest"
 >
 <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span> Ultra Velocidade & Fibra Óptica
 </motion.div>
 
 <motion.h1 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-6 uppercase"
 >
 {tituloHero}
 </motion.h1>
 
 <motion.p 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="text-lg text-purple-200/70 mb-10 max-w-lg leading-relaxed"
 >
 {subtituloHero}
 </motion.p>
 
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="flex flex-col sm:flex-row gap-4"
 >
 <a 
 href="#planos" 
 className="bg-card hover:bg-slate-100 text-black px-8 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
 >
 {textoBotaoCta}
 </a>
 <Link to="/portal" className="bg-purple-900/50 border border-purple-500/40 hover:bg-purple-800/60 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
 <Smartphone size={20} className="text-pink-400" /> Acessar Portal do Cliente
 </Link>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.35 }}
 className="mt-8"
 >
 <ConsultaViabilidadeBox
 nomeProvedor={nomeProvedor}
 telefoneWhatsapp={zapClean}
 theme="dark"
 />
 </motion.div>
 </div>
 
 <div className="relative hidden lg:block">
 {/* Abstact 3D shape replacement */}
 <motion.div 
 animate={{ 
 y: [0, -20, 0],
 rotateZ: [0, 5, 0]
 }}
 transition={{ 
 duration: 6,
 repeat: Infinity,
 ease: "easeInOut"
 }}
 className="relative z-10 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-full blur-[80px] opacity-50"
 />
 </div>
 </div>
 </div>
 </section>

 {/* Pricing */}
 <section className="py-24 px-6 relative z-10" id="planos">
 <div className="max-w-7xl mx-auto">
 <div className="mb-16">
 <h2 className="text-4xl font-black italic tracking-tight mb-4 uppercase">Escolha seu <span className="text-purple-400">Poder</span></h2>
 <p className="text-purple-200/60 text-lg">Planos simétricos com instalação grátis na {nomeProvedor}.</p>
 </div>

 <div className="grid md:grid-cols-3 gap-6 max-w-6xl">
 {planos.map((plan, i) => (
 <motion.div 
 key={i}
 whileHover={{ y: -10 }}
 className={`bg-card border border-purple-500/20 rounded-3xl p-8 transition-all ${plan.glow} ${plan.highlight ? 'scale-105 bg-gradient-to-b from-[#1a0b33] to-[#120524]' : ''}`}
 >
 {plan.highlight && (
 <div className="inline-block bg-pink-500 text-foreground text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
 Recomendado
 </div>
 )}
 <h3 className="text-2xl font-black italic text-foreground/90 mb-2">{plan.name}</h3>
 <div className="flex items-baseline gap-1 mb-2">
 <span className="text-6xl font-black tracking-tighter">{plan.mb}</span>
 <span className="text-xl font-bold text-purple-400 italic">MB</span>
 </div>
 <p className="text-purple-200/60 mb-8 font-medium">{plan.desc}</p>
 
 <div className="flex items-baseline gap-1 mb-8">
 <span className="text-xl text-purple-300">R$</span>
 <span className="text-4xl font-black">{plan.price}</span>
 <span className="text-purple-300">/mês</span>
 </div>
 
 <a 
 href={`https://wa.me/55${zapClean}?text=${encodeURIComponent(`Olá! Quero assinar o plano ${plan.name} de ${plan.mb} MB por R$ ${plan.price}/mês na ${nomeProvedor}.`)}`}
 target="_blank"
 rel="noreferrer"
 className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all text-center block ${plan.highlight ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white' : 'bg-purple-900/50 hover:bg-purple-800 text-white'}`}
 >
 Contratar
 </a>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 <footer className="py-8 border-t border-purple-500/10 text-center text-purple-300/40 text-sm">
 <p>© {new Date().getFullYear()} {nomeProvedor}. Todos os direitos reservados.</p>
 </footer>
 </div>
 );
}
