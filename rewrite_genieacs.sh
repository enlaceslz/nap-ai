#!/bin/bash
cat << 'INNER_EOF' > src/pages/GenieACSDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Router, Search, AlertCircle, CheckCircle2, XCircle, Signal, RefreshCw, Smartphone, Wrench, BarChart3, Radio } from 'lucide-react';

interface DeviceInfo {
  _id: string;
  manufacturer: string;
  productClass: string;
  serialNumber: string;
  mac: string;
  ip: string;
  lastInform: string;
  status: 'online' | 'offline';
  rssi?: number;
  snr?: number;
}

export default function GenieACSDashboard() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Mocking real-time updates and initial fetch
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        // Simulating an API call to GenieACS NBI via our Node.js backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockDevices: DeviceInfo[] = [
          {
            _id: '123456-ZXHN-123456789',
            manufacturer: 'ZTE',
            productClass: 'F670L',
            serialNumber: 'ZTEGC1234567',
            mac: '00:11:22:33:44:55',
            ip: '10.10.1.55',
            lastInform: new Date(Date.now() - 60000).toISOString(),
            status: 'online',
            rssi: -19.5,
            snr: 40.2
          },
          {
            _id: '987654-HG8245-987654321',
            manufacturer: 'Huawei',
            productClass: 'HG8245H',
            serialNumber: '4857544321',
            mac: 'AA:BB:CC:DD:EE:FF',
            ip: '10.10.1.102',
            lastInform: new Date(Date.now() - 3600000).toISOString(),
            status: 'offline',
            rssi: -35.0, // Critical
            snr: 15.0
          },
           {
            _id: '456789-EG8145-456789123',
            manufacturer: 'Huawei',
            productClass: 'EG8145V5',
            serialNumber: '4857544388',
            mac: '11:22:33:AA:BB:CC',
            ip: '10.10.1.200',
            lastInform: new Date(Date.now() - 120000).toISOString(),
            status: 'online',
            rssi: -22.1,
            snr: 35.5
          }
        ];
        
        setDevices(mockDevices);
      } catch (err) {
        setError('Falha ao conectar com o servidor NBI do GenieACS.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const filteredDevices = devices.filter(d => 
    d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ip.includes(searchTerm)
  );

  const getRssiColor = (rssi?: number) => {
    if (rssi === undefined) return 'text-slate-500';
    if (rssi > -25) return 'text-emerald-400';
    if (rssi > -28) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRssiBg = (rssi?: number) => {
    if (rssi === undefined) return 'bg-slate-800 border-white/5';
    if (rssi > -25) return 'bg-emerald-500/10 border-emerald-500/20';
    if (rssi > -28) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-slate-300 overflow-hidden font-sans">
      {/* HEADER DA PÁGINA */}
      <div className="px-6 py-5 border-b border-white/5 bg-[#101726]/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <Router size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-outfit tracking-tight">GenieACS (TR-069)</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-400">Gerenciamento e Telemetria de CPEs</p>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> NBI CONECTADO
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar Serial, MAC ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-white/10 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64 transition-all bg-[#0b0f19] text-white placeholder:text-slate-500 shadow-inner outline-none"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0b0f19] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            title="Sincronizar Dispositivos"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="m-6 mb-0 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-500/20">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* MÉTRICAS TOP */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 z-10 shrink-0">
        <div className="bg-[#101726] p-4 rounded-2xl border border-white/5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total de CPEs</p>
            <p className="text-2xl font-bold text-white font-outfit leading-none">{devices.length}</p>
          </div>
        </div>
        
        <div className="bg-[#101726] p-4 rounded-2xl border border-white/5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">ONUs Online</p>
            <p className="text-2xl font-bold text-white font-outfit leading-none">{devices.filter(d => d.status === 'online').length}</p>
          </div>
        </div>
        
        <div className="bg-[#101726] p-4 rounded-2xl border border-white/5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center shrink-0">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">ONUs Offline</p>
            <p className="text-2xl font-bold text-white font-outfit leading-none">{devices.filter(d => d.status === 'offline').length}</p>
          </div>
        </div>

        <div className="bg-[#101726] p-4 rounded-2xl border border-white/5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Sinal Óptico Ruim</p>
            <p className="text-2xl font-bold text-white font-outfit leading-none">{devices.filter(d => d.rssi && d.rssi < -28).length}</p>
          </div>
        </div>
      </div>

      {/* TABELA DE DISPOSITIVOS */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
        <div className="flex-1 bg-[#101726] border border-white/5 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b0f19]/80 border-b border-white/5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-medium">Dispositivo / Modelo</th>
                  <th className="p-4 font-medium">Serial / MAC</th>
                  <th className="p-4 font-medium">Endereço IP</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium">Telemetria Óptica</th>
                  <th className="p-4 font-medium text-right">Ações TR-069</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="animate-spin text-blue-400" size={24} />
                        <span className="text-sm font-medium">Sincronizando base com GenieACS NBI...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum dispositivo encontrado com estes termos.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(device => (
                    <tr key={device._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${device.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                            {device.productClass.includes('F670') || device.productClass.includes('HG') ? <Wifi size={20} /> : <Router size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{device.manufacturer} {device.productClass}</p>
                            <p className="text-xs text-slate-500">Último Inform: {new Date(device.lastInform).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-300 font-mono">{device.serialNumber}</div>
                        <div className="text-xs text-slate-500 font-mono">{device.mac}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-[#0b0f19] border border-white/5 px-2.5 py-1 rounded-lg text-xs text-blue-400 font-mono font-bold shadow-inner">
                          {device.ip}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          device.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                          {device.status}
                        </div>
                      </td>
                      <td className="p-4">
                        {device.status === 'online' && device.rssi ? (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">RSSI (Rx)</span>
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${getRssiBg(device.rssi)}`}>
                                <Signal size={12} className={getRssiColor(device.rssi)} />
                                <span className={`text-xs font-mono font-bold ${getRssiColor(device.rssi)}`}>{device.rssi} dBm</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tx Power</span>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-[#0b0f19] border-white/5 text-slate-300">
                                <Radio size={12} />
                                <span className="text-xs font-mono font-bold">2.4 dBm</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Activity size={14} className="opacity-50" /> Telemetria Indisponível
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-[#0b0f19] border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 rounded-lg transition-colors" title="Visualizar Diagnóstico Completo">
                            <BarChart3 size={16} />
                          </button>
                          <button className="p-2 bg-[#0b0f19] border border-white/5 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 rounded-lg transition-colors" title="Reboot Remoto (TR-069)">
                            <RefreshCw size={16} />
                          </button>
                          <button className="p-2 bg-[#0b0f19] border border-white/5 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Configurações Wi-Fi">
                            <Wrench size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-white/5 bg-[#0b0f19]/50 flex items-center justify-between text-xs text-slate-500">
            <p>Mostrando {filteredDevices.length} de {devices.length} dispositivos</p>
            <p className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              TR-069 NBI WebSocket Conectado
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
INNER_EOF
