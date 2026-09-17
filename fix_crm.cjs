const fs = require('fs');

function injectToast(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if toast is already there
    if (content.includes('const [toastMsg, setToastMsg]')) return;

    // Inject state
    content = content.replace(
        /(const \[.*\] = useState.*;)/,
        "$1\n  const [toastMsg, setToastMsg] = useState<string | null>(null);\n  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };"
    );
    
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
    // 1. In CRM.tsx
    if (file.includes('CRM.tsx')) {
        content = content.replace(/<button([^>]*)Anterior<\/button>/g, `<button onClick={() => showToast('Página anterior...')} $1Anterior</button>`);
        content = content.replace(/<button([^>]*)Próxima<\/button>/g, `<button onClick={() => showToast('Próxima página...')} $1Próxima</button>`);
        content = content.replace(/<button className="flex-1 bg-indigo-500([^>]*)>([^<]*)<\/button>/g, `<button onClick={() => showToast('Iniciando chamada Asterisk/WebRTC...')} className="flex-1 bg-indigo-500$1>$2</button>`);
        content = content.replace(/<button className="flex-1 bg-emerald-500([^>]*)>([^<]*)<\/button>/g, `<button onClick={() => showToast('Abrindo WhatsApp Web/WABA...')} className="flex-1 bg-emerald-500$1>$2</button>`);
        content = content.replace(/<button className="px-2 py-1 bg-slate-900([^>]*)>([^<]*)<\/button>/g, `<button onClick={(e) => { e.stopPropagation(); showToast('Redirecionando para a ficha 360 avançada...'); }} className="px-2 py-1 bg-slate-900$1>$2</button>`);
        content = content.replace(/<button className="flex items-center gap-2 bg-slate-900([^>]*)>([^<]*)<\/button>/g, `<button onClick={() => showToast('Processando filtros...')} className="flex items-center gap-2 bg-slate-900$1>$2</button>`);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
}

injectToast('src/pages/CRM.tsx');
