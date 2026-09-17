import React from 'react';
import { Network, ArrowLeft, ShieldCheck, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERPIntegrationsHub from '../components/ERPIntegrationsHub';

export default function ErpIntegracoes() {
 const navigate = useNavigate();

 return (
 <div className="p-6 max-w-7xl mx-auto space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <button 
 onClick={() => navigate('/admin/configuracoes')}
 className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2 text-sm"
 >
 <ArrowLeft size={16} />
 Voltar para Configurações
 </button>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
 <Network size={22} className="text-indigo-400" />
 Multi-ERP Hub & Integradores
 </h1>
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
 API Gateways
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-1">
 Adaptadores de integração nativa para SGP, MikWeb, IXC Soft, Hubsoft e RadiusNet.
 </p>
 </div>
 </div>

 <div className="bg-card border border-border rounded-xl overflow-hidden">
 <ERPIntegrationsHub />
 </div>
 </div>
 );
}
