const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

const hook1 = `<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de OSs */}
        <div className="lg:col-span-5 space-y-3">`;

const inject1 = `<div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de OSs */}
        <div className={\`lg:col-span-5 space-y-3 \${selectedOS ? 'hidden lg:block' : 'block'}\`}>`;

const hook2 = `{/* Coluna Direita: Painel de Atendimento da OS Selecionada */}
        <div className="lg:col-span-7">
          {selectedOS ? (
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 md:p-6 space-y-6">
              {/* Header da OS */}`;

const inject2 = `{/* Coluna Direita: Painel de Atendimento da OS Selecionada */}
        <div className={\`lg:col-span-7 \${!selectedOS ? 'hidden lg:block' : 'block'}\`}>
          {selectedOS ? (
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 md:p-6 space-y-6">
              {/* Header da OS */}
              <button 
                onClick={() => setSelectedOS(null)} 
                className="lg:hidden flex items-center gap-1.5 text-slate-300 font-bold bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 rounded-xl transition-colors mb-2 w-fit"
              >
                <ArrowLeft size={16} /> Voltar para lista de OS
              </button>`;

code = code.replace(hook1, inject1);
code = code.replace(hook2, inject2);

// Add ArrowLeft import if not present
if (!code.includes('ArrowLeft')) {
  code = code.replace('from \'lucide-react\';', 'ArrowLeft, from \'lucide-react\';');
}

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
console.log("Mobile layout patched");
