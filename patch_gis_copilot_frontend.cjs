const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

if (!text.includes('isCopilotOpen')) {
  // Imports
  text = text.replace(
    "import { Search, Layers, Server, MapPin, Wifi, X } from 'lucide-react';",
    "import { Search, Layers, Server, MapPin, Wifi, X, Bot, Send, Loader2 } from 'lucide-react';"
  );
  
  // State
  text = text.replace(
    "const [impactReport, setImpactReport] = useState<any>(null);",
    "const [impactReport, setImpactReport] = useState<any>(null);\n  const [isCopilotOpen, setIsCopilotOpen] = useState(false);\n  const [copilotQuery, setCopilotQuery] = useState('');\n  const [copilotHistory, setCopilotHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);\n  const [isCopilotLoading, setIsCopilotLoading] = useState(false);"
  );

  // Send Logic
  const copilotLogic = `
  const handleSendCopilot = () => {
    if(!copilotQuery.trim()) return;
    const prompt = copilotQuery;
    setCopilotQuery('');
    setCopilotHistory(prev => [...prev, {role: 'user', text: prompt}]);
    setIsCopilotLoading(true);

    fetch('/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    .then(res => res.json())
    .then(data => {
      setCopilotHistory(prev => [...prev, {role: 'ai', text: data.text}]);
      setIsCopilotLoading(false);
    })
    .catch(() => {
      setCopilotHistory(prev => [...prev, {role: 'ai', text: '❌ Erro de comunicação com a Inteligência do NAP.'}]);
      setIsCopilotLoading(false);
    });
  };
  `;
  text = text.replace(
    "const handleSimulateImpact = (featureId: string) => {",
    copilotLogic + "\n  const handleSimulateImpact = (featureId: string) => {"
  );

  // Render UI
  const copilotUi = `
        {/* NOC Copilot FAB & Window */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end">
          {isCopilotOpen && (
            <div className="bg-slate-900 border border-slate-700 w-[350px] h-[450px] rounded-xl shadow-2xl mb-4 flex flex-col overflow-hidden">
              <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Bot size={18} /> NOC Copilot (IA)
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-900/50">
                {copilotHistory.length === 0 && (
                  <p className="text-xs text-slate-500 text-center mt-4">Faça uma pergunta operacional.<br/>Ex: "Quantos clientes serão afetados se o cabo Dist SUL romper?"</p>
                )}
                {copilotHistory.map((msg, i) => (
                  <div key={i} className={\`p-2 text-xs rounded-lg max-w-[85%] \${msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-100 ml-auto border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}\`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}
                {isCopilotLoading && (
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 p-2 text-xs rounded-lg max-w-[85%] flex items-center gap-2">
                     <Loader2 size={12} className="animate-spin" /> Analisando a topologia...
                  </div>
                )}
              </div>
              
              <div className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
                <input 
                  type="text" 
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCopilot()}
                  placeholder="Pergunte ao Copilot..."
                  className="flex-1 bg-slate-900 text-white text-xs px-3 py-2 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handleSendCopilot}
                  disabled={isCopilotLoading}
                  className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
          
          {!isCopilotOpen && (
            <button 
              onClick={() => setIsCopilotOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
            >
              <Bot size={24} />
            </button>
          )}
        </div>
  `;

  text = text.replace(
    "          </div>\n        )}\n      </div>\n    </div>\n  );\n}",
    "          </div>\n        )}\n\n" + copilotUi + "\n      </div>\n    </div>\n  );\n}"
  );

  fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
  console.log('GisDashboard Copilot UI added');
} else {
  console.log('Already patched');
}
