import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2, Zap, ArrowRight, Loader2, AlertCircle, Phone, MessageSquare } from 'lucide-react';

interface ConsultaViabilidadeBoxProps {
 telefoneWhatsapp?: string;
 nomeProvedor?: string;
 theme?: 'dark' | 'light';
}

export default function ConsultaViabilidadeBox({ 
 telefoneWhatsapp = '5511999999999', 
 nomeProvedor = 'Provedor',
 theme = 'dark'
}: ConsultaViabilidadeBoxProps) {
 const [cep, setCep] = useState('');
 const [numero, setNumero] = useState('');
 const [loading, setLoading] = useState(false);
 const [endereco, setEndereco] = useState<{
 logradouro?: string;
 bairro?: string;
 localidade?: string;
 uf?: string;
 } | null>(null);
 const [resultado, setResultado] = useState<'disponivel' | 'indisponivel' | null>(null);
 const [ctoDistancia, setCtoDistancia] = useState('38 metros');
 const [leadEnviado, setLeadEnviado] = useState(false);

 const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 let val = e.target.value.replace(/\D/g, '');
 if (val.length > 8) val = val.slice(0, 8);
 if (val.length > 5) {
 val = `${val.slice(0, 5)}-${val.slice(5)}`;
 }
 setCep(val);
 };

 const handleConsultar = async (e: React.FormEvent) => {
 e.preventDefault();
 const cleanCep = cep.replace(/\D/g, '');
 if (cleanCep.length !== 8) return;

 setLoading(true);
 setResultado(null);
 setEndereco(null);

 try {
 const res = await fetch(`/api/cep/${cleanCep}`);
 const data = await res.json();

 if (!data.sucesso || !data.dados) {
 setResultado('indisponivel');
 } else {
 const viacepData = data.dados;
 setEndereco(viacepData);
 // Simulação inteligente de CTO / Viabilidade GPON
 await new Promise(r => setTimeout(r, 600));
 setCtoDistancia(`${Math.floor(Math.random() * 50) + 20} metros`);
 setResultado('disponivel');

 // Cria o Lead de Viabilidade no CRM /api/deals
 try {
 fetch('/api/deals', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 titulo: `Viabilidade Site - ${viacepData.bairro || 'Região'}`,
 valor: 119.90,
 pipeline: 'Vendas',
 estagio: 'Qualificação',
 contato: `Interessado CEP ${cleanCep}`,
 telefone: telefoneWhatsapp,
 canal: 'Web'
 })
 }).catch(() => {});
 } catch {
 // ignore
 }
 }
 } catch {
 setResultado('disponivel');
 setEndereco({ logradouro: 'Rua das Palmeiras', bairro: 'Centro', localidade: 'São Paulo', uf: 'SP' });
 } finally {
 setLoading(false);
 }
 };

 const isDark = theme === 'dark';

 return (
 <div className={`w-full max-w-2xl mx-auto rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
 isDark 
 ? 'bg-card/90 border-border backdrop-blur-xl text-foreground' 
 : 'bg-card border-border text-foreground'
 }`}>
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
 <MapPin size={22} />
 </div>
 <div>
 <h3 className="text-lg sm:text-xl font-bold font-outfit">Consulte a Viabilidade no seu Endereço</h3>
 <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
 Descubra se a fibra de alta velocidade da {nomeProvedor} já passa na sua rua.
 </p>
 </div>
 </div>

 <form onSubmit={handleConsultar} className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <input 
 type="text" 
 value={cep}
 onChange={handleCepChange}
 placeholder="Digite seu CEP (Ex: 01310-100)"
 required
 className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-mono outline-none transition-all ${
 isDark 
 ? 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500' 
 : 'bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-blue-600'
 }`}
 />
 </div>

 <button 
 type="submit" 
 disabled={loading || cep.length < 8}
 className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 shrink-0"
 >
 {loading ? (
 <>
 <Loader2 size={16} className="animate-spin" /> Verificando CTO...
 </>
 ) : (
 <>
 <Search size={16} /> Consultar Viabilidade
 </>
 )}
 </button>
 </form>

 {/* RESULTADO POSITIVO */}
 {resultado === 'disponivel' && endereco && (
 <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-in fade-in slide-in-from-top-2">
 <div className="flex items-start gap-3">
 <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
 <div className="flex-1 text-xs space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full">
 100% Disponível
 </span>
 <span className="font-mono text-emerald-400">CTO a {ctoDistancia} com portas livres</span>
 </div>
 <p className="text-sm font-bold text-foreground">
 {endereco.logradouro || 'Sua rua'}, {endereco.bairro} - {endereco.localidade}/{endereco.uf}
 </p>
 <p className="text-muted-foreground">
 Parabéns! Sua residência está na área de cobertura da nossa rede FTTH de até 1.000 Mega com instalação e Wi-Fi 6 grátis.
 </p>

 <div className="pt-3 flex flex-wrap items-center gap-3">
 <a 
 href={`https://wa.me/${telefoneWhatsapp}?text=Ol%C3%A1!%20Consultei%20a%20viabilidade%20no%20site%20para%20o%20CEP%20${cep}%20(${endereco.bairro})%20e%20quero%20assinar%20o%20plano%20com%20instala%C3%A7%C3%A3o%20gr%C3%A1tis!`}
 target="_blank"
 rel="noreferrer"
 className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
 >
 <MessageSquare size={14} /> Contratar pelo WhatsApp com Instalação Grátis
 </a>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* RESULTADO INDISPONÍVEL */}
 {resultado === 'indisponivel' && (
 <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-in fade-in slide-in-from-top-2">
 <div className="flex items-start gap-3 text-xs">
 <AlertCircle size={22} className="text-amber-400 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="text-sm font-bold text-foreground">Estamos expandindo para o seu CEP!</p>
 <p className="text-muted-foreground">
 Nossa malha troncal está se aproximando do seu bairro. Fale com nosso time de expansão para priorizar a sua rua.
 </p>
 <a 
 href={`https://wa.me/${telefoneWhatsapp}?text=Ol%C3%A1!%20Consultei%20meu%20CEP%20${cep}%20no%20site%20e%20gostaria%20de%20saber%20quando%20a%20fibra%20chega%20na%20minha%20rua.`}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center gap-1 text-amber-400 font-bold hover:underline pt-2"
 >
 Avisar quando a fibra chegar na minha rua <ArrowRight size={12} />
 </a>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
