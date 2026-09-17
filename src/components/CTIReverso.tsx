import React, { useEffect, useState } from 'react';
import { PhoneIncoming, X, PhoneForwarded } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CTIReverso() {
  const [call, setCall] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const eventSource = new EventSource('/api/events/calls');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCall(data);
    };

    eventSource.onerror = (error) => {
      // Silenciar log de erro para não poluir o console quando houver reconexão ou encerramento
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!call) return null;

  return (
    <div className="fixed top-6 right-6 w-80 bg-slate-900 text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-top-10 z-[100]">
      <div className="bg-slate-950/60 border-b border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center animate-pulse">
          <PhoneIncoming size={22} className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white font-outfit">Chamada Entrante</h3>
          <p className="text-blue-400 text-xs font-semibold tracking-wide uppercase">{call.fila}</p>
        </div>
      </div>
      <div className="p-6">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Contato Identificado</p>
        <p className="font-bold text-2xl text-white font-outfit mb-1">{call.contato}</p>
        <p className="text-slate-300 font-mono text-sm mb-6 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg inline-block">{call.telefone}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => {
              navigate('/crm');
              setCall(null);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <PhoneForwarded size={18} /> Abrir Ficha
          </button>
          <button 
            onClick={() => setCall(null)}
            className="w-12 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
