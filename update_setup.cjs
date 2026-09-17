const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/SetupWizard.tsx');

let content = fs.readFileSync(file, 'utf8');

// Replace states
content = content.replace(
  /sgpToken: '',\n    geminiApiKey: '',/g,
  `sgpToken: '',\n    geminiApiKey: '',\n    amiUser: 'admin',\n    amiPassword: '',`
);

// Update steps
content = content.replace(
  /\{ num: 4, title: 'TR-069 \(GenieACS\)', icon: Server \},/g,
  `{ num: 4, title: 'Telefonia (Asterisk)', icon: MessageSquare },\n    { num: 5, title: 'TR-069 (GenieACS)', icon: Server },`
);

// Change Math.min and max for steps
content = content.replace(/Math\.min\(s \+ 1, 5\)/g, 'Math.min(s + 1, 6)');
content = content.replace(/step < 4/g, 'step < 5');
content = content.replace(/step === 4/g, 'step === 5');
content = content.replace(/step === 5/g, 'step === 6');

// Insert Step 4 component and shift Step 4 -> 5, 5 -> 6
const asteriskStep = `
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-bold text-white mb-2">Motor de Telefonia (Asterisk 20+)</h3>
              <p className="text-slate-400 mb-6">Integre o NAP ao Asterisk para controle do CTI, URA Inteligente e filas via AMI.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Usuário AMI (Manager)</label>
                  <input 
                    type="text" 
                    value={formData.amiUser}
                    onChange={e => setFormData({...formData, amiUser: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Senha AMI</label>
                  <input 
                    type="password" 
                    value={formData.amiPassword}
                    onChange={e => setFormData({...formData, amiPassword: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
`;

content = content.replace(
  /\{step === 5 && \(/g, 
  asteriskStep.trim() + '\n\n          {step === 5 && ('
);

content = content.replace(
  /\{step === 6 && \(/g, 
  '{step === 6 && ('
);

content = content.replace(/step < 5 \? \(/g, 'step < 6 ? ('); // fix footer navigation

fs.writeFileSync(file, content);
console.log('SetupWizard updated');
