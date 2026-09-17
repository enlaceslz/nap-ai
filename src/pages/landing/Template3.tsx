import React from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight, Menu, Home, Wifi, Tv, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig, SystemConfig } from '../../contexts/ConfigContext';
import ConsultaViabilidadeBox from '../../components/ConsultaViabilidadeBox';

interface TemplateProps {
  config?: SystemConfig;
}

export default function Template3({ config: propsConfig }: TemplateProps) {
  const { config: contextConfig } = useConfig();
  const config = propsConfig || contextConfig;

  const nomeProvedor = config?.provedor?.nomeFantasia || "FibraNet";
  const logoUrl = config?.provedor?.logoUrl;
  const tituloHero = config?.landingPage?.tituloPrincipal || "A internet que não te deixa na mão.";
  const subtituloHero = config?.landingPage?.subtitulo || "Estabilidade, velocidade e um suporte que realmente funciona. Leve a melhor fibra óptica para a sua casa e família.";
  const textoBotaoCta = config?.landingPage?.textoBotaoCta || "Ver planos residenciais";
  const rawZap = config?.landingPage?.whatsappVendas || config?.provedor?.telefoneWhatsapp || "11987654321";
  const zapClean = String(rawZap).replace(/\D/g, '') || "11987654321";

  const planos = [
    {
      mb: config?.landingPage?.plano1?.velocidade || "300",
      name: config?.landingPage?.plano1?.nome || "Básico Família",
      price: config?.landingPage?.plano1?.preco || "79,90",
      highlight: false,
      tag: config?.landingPage?.plano1?.tag || "Econômico",
      features: [
        "100% Fibra Óptica Dedicada",
        config?.landingPage?.plano1?.wifi || "Roteador Wi-Fi Incluso",
        "Acesso ilimitado ao App Cliente (PWA)",
        "Instalação Grátis"
      ]
    },
    {
      mb: config?.landingPage?.plano2?.velocidade || "600",
      name: config?.landingPage?.plano2?.nome || "Ultra Família",
      price: config?.landingPage?.plano2?.preco || "99,90",
      highlight: true,
      tag: config?.landingPage?.plano2?.tag || "MAIS ASSINADO",
      features: [
        "100% Fibra Óptica Gigabit",
        config?.landingPage?.plano2?.wifi || "Roteador Wi-Fi 6 de Alta Cobertura",
        "Acesso ao App do Cliente com 2ª via PIX",
        "Suporte Prioritário Humanizado"
      ]
    },
    {
      mb: config?.landingPage?.plano3?.velocidade || "900",
      name: config?.landingPage?.plano3?.nome || "Premium Conectado",
      price: config?.landingPage?.plano3?.preco || "129,90",
      highlight: false,
      tag: config?.landingPage?.plano3?.tag || "Super Veloz",
      features: [
        "100% Fibra Óptica com ultra estabilidade",
        config?.landingPage?.plano3?.wifi || "2x Roteadores Wi-Fi 6 Mesh",
        "Streaming 4K e jogos simultâneos",
        "Atendimento VIP Especializado"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit selection:bg-emerald-500/20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={nomeProvedor} 
                className="h-10 w-auto max-w-[190px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <span className="text-white font-black text-xl tracking-tight font-sans mt-[1px]">N</span>
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900 font-outfit">{nomeProvedor}</span>
              </div>
            )}
          </Link>
          
          <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
            <a href="#planos" className="hover:text-emerald-600 transition-colors">Planos Internet</a>
            <a href="#vantagens" className="hover:text-emerald-600 transition-colors">Vantagens</a>
            <a href={`https://wa.me/55${zapClean}`} target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors">WhatsApp</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              to="/portal" 
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 px-3 sm:px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
            >
              <Smartphone size={15} className="text-emerald-600" />
              <span>Portal do Cliente</span>
            </Link>
            <Link to="/login" className="bg-emerald-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30">
              <span>Admin</span> <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Conectando Famílias e Empresas
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900 max-w-4xl mx-auto"
          >
            {tituloHero}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {subtituloHero}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-10"
          >
            <a 
              href="#planos" 
              className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center"
            >
              {textoBotaoCta}
            </a>
            <Link to="/portal" className="bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Smartphone size={20} className="text-emerald-600" /> Acessar Portal do Cliente
            </Link>
          </motion.div>

          {/* Consulta de Viabilidade Integrada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-xl mx-auto"
          >
            <ConsultaViabilidadeBox 
              nomeProvedor={nomeProvedor} 
              telefoneWhatsapp={zapClean} 
              theme="light"
            />
          </motion.div>
        </div>

        {/* Hero Graphic / Features preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative h-[360px]"
          id="vantagens"
        >
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" 
               alt="Família conectada com internet de alta velocidade" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 to-blue-950/75 mix-blend-multiply"></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 text-center">
               <div className="flex flex-col items-center gap-3 text-white">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-lg">
                    <Home size={28} className="text-white" />
                  </div>
                  <span className="font-bold text-sm sm:text-base">Casa Inteligente</span>
               </div>
               <div className="flex flex-col items-center gap-3 text-white sm:mt-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-lg">
                    <Wifi size={28} className="text-white" />
                  </div>
                  <span className="font-bold text-sm sm:text-base">Wi-Fi Total Estável</span>
               </div>
               <div className="flex flex-col items-center gap-3 text-white">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-lg">
                    <Tv size={28} className="text-white" />
                  </div>
                  <span className="font-bold text-sm sm:text-base">Streaming em 4K</span>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white border-t border-slate-100" id="planos">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Planos {nomeProvedor}</h2>
            <p className="text-slate-500 text-lg">Sem surpresas. Preço fixo e instalação gratuita.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {planos.map((plan, i) => (
              <div 
                key={i}
                className={`bg-white rounded-3xl p-8 border ${plan.highlight ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20' : 'border-slate-200 shadow-sm'} flex flex-col`}
              >
                {plan.highlight && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full self-start mb-4">
                    {plan.tag}
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold text-slate-900">{plan.mb}</span>
                  <span className="text-lg font-bold text-slate-500">Mega</span>
                </div>
                <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">R$</span>
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3 text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="font-medium text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                
                <a 
                  href={`https://wa.me/55${zapClean}?text=${encodeURIComponent(`Olá! Gostaria de assinar o plano ${plan.name} de ${plan.mb} Mega por R$ ${plan.price}/mês na ${nomeProvedor}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-4 rounded-xl font-bold transition-all text-center block ${plan.highlight ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                >
                  Quero este plano
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} {nomeProvedor}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
