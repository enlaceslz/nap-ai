import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, don't show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white  -700/20 hover:bg-blue-600 transition-all active:scale-95"
      >
        <Download size={18} />
        Instalar App
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 transition-all active:scale-95"
        >
          <Download size={18} />
          Instalar App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6  border border-slate-200 relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold text-slate-900 font-outfit mb-3">Instalar no iPhone</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed mb-4">
                Para instalar o Portal NAP no seu dispositivo:
                <br /><br />
                1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.<br />
                2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-900 hover:bg-slate-200 transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
