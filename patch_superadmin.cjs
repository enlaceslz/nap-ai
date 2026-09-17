const fs = require('fs');

const file = 'src/pages/SuperAdmin.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Gateway de Roteamento</label>`;
const replacement = `<label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Gateway de Roteamento</label>
                  <select
                    value={config.ia.provedorGateway}
                    onChange={(e) => setConfig({ ...config, ia: { ...config.ia, provedorGateway: e.target.value } })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mb-3"
                  >
                    <option value="9router">9router (Failover Automático & Rate-Limit)</option>
                    <option value="direct">Google AI Studio Direto (Server-Side)</option>
                  </select>

                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">URL Base (Gateway)</label>
                  <input
                    type="text"
                    value={config.ia.baseUrl || ''}
                    placeholder="https://9router.enlace.slz.br"
                    onChange={(e) => setConfig({ ...config, ia: { ...config.ia, baseUrl: e.target.value } })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mb-3"
                  />
                  
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Chave API (9router / Gemini)</label>
                  <input
                    type="password"
                    value={config.ia.apiKey || ''}
                    placeholder="Sua chave de API..."
                    onChange={(e) => setConfig({ ...config, ia: { ...config.ia, apiKey: e.target.value } })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />`;

content = content.replace(/<label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1\.5">Gateway de Roteamento<\/label>[\s\S]*?<\/select>/, replacement);

fs.writeFileSync(file, content);
console.log('Updated SuperAdmin.tsx');
