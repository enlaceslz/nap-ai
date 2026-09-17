const fs = require('fs');

function injectToast(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if toast is already there
    if (content.includes('const [toastMsg, setToastMsg]')) return;

    // Inject state
    content = content.replace(
        /(const \[activeTab, setActiveTab\] = useState[^;]+;)/,
        "$1\n  const [toastMsg, setToastMsg] = useState<string | null>(null);\n  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };"
    );

    // If activeTab is not found, try to inject after the first useState
    if (!content.includes('const [toastMsg, setToastMsg]')) {
         content = content.replace(
            /(const \[.*\] = useState.*;)/,
            "$1\n  const [toastMsg, setToastMsg] = useState<string | null>(null);\n  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };"
        );
    }
    
    // Inject the toast UI at the end of the root div
    // Find the last </div> before the end of the file
    content = content.replace(
        /(<\/div>\s*)$/m,
        `  {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl font-bold animate-in slide-in-from-bottom-5">
          {toastMsg}
        </div>
      )}\n$1`
    );

    // Now, add onClick to the cards
    // 1. In Campanhas.tsx
    if (file.includes('Campanhas.tsx')) {
        content = content.replace(/className="bg-slate-950 border border-white\/5 hover:border-[^"]* rounded-2xl p-5 flex flex-col justify-between transition-all group"/g, `onClick={() => showToast('Abrindo detalhes do card')} className="bg-slate-950 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer"`);
        content = content.replace(/className="bg-slate-950 p-5 rounded-2xl border border-white\/5 flex flex-col justify-between hover:border-fuchsia-500\/30 transition-all group"/g, `onClick={() => showToast('Editando template HSM')} className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-fuchsia-500/30 transition-all group cursor-pointer"`);
        content = content.replace(/<button className="([^"]*)"([^>]*)><Eye/g, `<button onClick={(e) => { e.stopPropagation(); showToast('Visualizando ativo...'); }} className="$1"$2><Eye`);
        content = content.replace(/<button className="([^"]*)"([^>]*)><Copy/g, `<button onClick={(e) => { e.stopPropagation(); showToast('Ativo copiado para a área de transferência!'); }} className="$1"$2><Copy`);
        content = content.replace(/<button className="([^"]*)"([^>]*)><Play/g, `<button onClick={(e) => { e.stopPropagation(); showToast('Reproduzindo áudio...'); }} className="$1"$2><Play`);
        content = content.replace(/<button className="([^"]*)"([^>]*)><RefreshCw/g, `<button onClick={(e) => { e.stopPropagation(); showToast('Trocar arquivo de áudio...'); }} className="$1"$2><RefreshCw`);
    }

    // 2. In Automacoes.tsx
    if (file.includes('Automacoes.tsx')) {
        content = content.replace(/className="bg-slate-900 border border-white\/5 rounded-2xl p-5 hover:border-indigo-500\/30 transition-all group "/g, `onClick={() => showToast('Abrindo configuração de automação')} className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group cursor-pointer"`);
        content = content.replace(/className="bg-slate-900 border border-([^"]*) rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-([^"]*) transition-all([^"]*)"/g, `onClick={() => showToast('Acessando integração...')} className="bg-slate-900 border border-$1 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center hover:border-$2 transition-all$3 cursor-pointer"`);
    }

    // 3. In Analytics.tsx
    if (file.includes('Analytics.tsx')) {
         content = content.replace(/className="p-4 rounded-xl bg-slate-950 border border-white\/5 hover:border-white\/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"/g, `onClick={() => showToast('Detalhes do feedback do cliente')} className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"`);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
}

injectToast('src/pages/Campanhas.tsx');
injectToast('src/pages/Automacoes.tsx');
injectToast('src/pages/Analytics.tsx');
