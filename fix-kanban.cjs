const fs = require('fs');
let code = fs.readFileSync('src/pages/Kanban.tsx', 'utf8');

// Adicionar Toast state e função
code = code.replace(
`  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high'>('all');`,
`  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high'>('all');
  
  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };`);

// Adicionar onDragEnd trigger
const onDragEndFind = `      if (selectedDeal && selectedDeal.id === movedDealId) {
        setSelectedDeal(prev => prev ? { ...prev, estagio: destStage } : null);
      }`;
      
const onDragEndReplace = `      if (selectedDeal && selectedDeal.id === movedDealId) {
        setSelectedDeal(prev => prev ? { ...prev, estagio: destStage } : null);
      }
      
      // Regras de Automação Visual Baseadas em Estágio
      if (destStage === 'Fechado/Ganho') {
        showToast('🚀 Parabéns! Contrato SGP gerado e Link de Assinatura enviado no WhatsApp.');
      } else if (destStage === 'Qualificado (IA)' && type === 'Vendas') {
        showToast('✅ Lead Ativado. Mensagem de apresentação enviada no WABA (WhatsApp).');
      } else if (destStage === 'Técnico em Rota') {
        showToast('📍 OS Atualizada! Cliente notificado com o Rastreador em Tempo Real.');
      } else if (destStage === 'Desbloqueio 48h') {
        showToast('🔓 Desbloqueio 48h acionado direto no NAS/MikroTik!');
      } else if (destStage === 'Recuperado (PIX)') {
        showToast('💸 Receita recuperada! Mensagem de agradecimento disparada.');
      }`;

code = code.replace(onDragEndFind, onDragEndReplace);

// Renderizar Toast UI
const renderFind = `      {/* Modais */}`;
const renderReplace = `      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#101726] border border-blue-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] shadow-blue-500/10 text-white px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-blue-400" />
            </div>
            <p className="text-sm font-medium">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modais */}`;

code = code.replace(renderFind, renderReplace);

// Adicionar um botão extra dentro do detalhe do deal para simular "Assumir no Chat" e "Disparar Automação"
const detailsFind = `<div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors border border-white/10"
                >
                  Fechar Detalhes
                </button>
              </div>`;

const detailsReplace = `<div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors border border-white/10"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    showToast('Conversa puxada para sua Caixa de Entrada (Inbox) com sucesso!');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Assumir Atendimento no Inbox
                </button>
              </div>`;

code = code.replace(detailsFind, detailsReplace);

fs.writeFileSync('src/pages/Kanban.tsx', code);
