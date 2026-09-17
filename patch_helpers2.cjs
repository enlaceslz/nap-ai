const fs = require('fs');
const text = fs.readFileSync('src/pages/Helpers.tsx', 'utf8');

const regex = /\{[\s\n]*\/\* Handoff Humano-IA \*\/[\s\n]*<div className="p-4 bg-blue-500\/10 border border-blue-500\/20 rounded-2xl space-y-2">[\s\S]*?<\/div>/m;

const replacement = `{/* Handoff Humano-IA (WABA ↔ ERP Kanban) */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-blue-300 flex items-center gap-2">
              <Users size={16} /> Regra de Handoff (Transferência Humana Inteligente)
            </h3>
            <p className="text-xs text-blue-100/70 leading-relaxed mb-2">
              Se o cliente solicitar falar com um atendente, ou o operador assumir a conversa na Caixa de Entrada, o <strong>Handoff instantâneo</strong> ocorre:
            </p>
            <ul className="text-xs text-blue-100/70 space-y-1.5 ml-1">
              <li>• <strong>Pausa da IA:</strong> A MaIA interrompe as respostas automáticas.</li>
              <li>• <strong>WABA API:</strong> O cliente recebe notificação de transferência imediata no WhatsApp.</li>
              <li>• <strong>Kanban SGP:</strong> O endpoint <code>/api/waba/handoff</code> gera/atualiza um Card (Deal) no módulo ERP (Em Atendimento).</li>
              <li>• <strong>Contexto 360:</strong> A gaveta lateral direita da Caixa de Entrada se abre revelando o status da ONU (TR-069) e faturas pendentes.</li>
            </ul>
          </div>`;

if(regex.test(text)) {
  fs.writeFileSync('src/pages/Helpers.tsx', text.replace(regex, replacement));
  console.log("Success: Replaced handoff section in Helpers");
} else {
  console.log("Regex failed to match handoff section in Helpers");
}
