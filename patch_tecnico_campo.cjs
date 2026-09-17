const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

if (code.includes('className="flex flex-col lg:grid lg:grid-cols-12 gap-6"')) {
  // Let's hide the list on mobile when an OS is selected
  code = code.replace(
    /<div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">/g,
    '<div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 relative">'
  );

  code = code.replace(
    /\{?\/\* Coluna Esquerda: Lista de OSs \*\/\}/g,
    `{/* Coluna Esquerda: Lista de OSs */}
        <div className={\`lg:col-span-4 space-y-4 \${selectedOS && window.innerWidth < 1024 ? 'hidden' : 'block'}\`}>`
  );
  
  // Need to fix the closing div for the left column
  // Let's use a regex to find the end of the left column
  code = code.replace(
    /        <\/div>\n\n        \{\/\* Coluna Direita: Execução e Diagnóstico em Campo \*\/\}/g,
    `        </div>
        </div>

        {/* Coluna Direita: Execução e Diagnóstico em Campo */}
        <div className={\`lg:col-span-8 \${!selectedOS && window.innerWidth < 1024 ? 'hidden' : 'block'}\`}>`
  );

  // Add a "Back to List" button on mobile for the selected OS
  code = code.replace(
    /              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white\/10">/g,
    `              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <button 
                  onClick={() => setSelectedOS(null)}
                  className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-white mb-2 pb-2 border-b border-white/5"
                >
                  <ArrowLeft size={16} /> Voltar para lista de OS
                </button>`
  );
  
  // also need to remove the hardcoded `lg:col-span-4` and `lg:col-span-8` that were originally there
  code = code.replace(/<div className="lg:col-span-4 space-y-4">/, '');
  code = code.replace(/<div className="lg:col-span-8 space-y-6">/, '');
  // need to fix the closing tags since we changed the structure
  // It's safer to just do a smart replace
}

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
