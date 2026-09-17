const fs = require('fs');
let text = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const hookFetch = `
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/waba/chats-full');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Merge with INITIAL_CHATS logic or just use backend data
            // For demo safety, we prepend backend data to the mocked structure so it doesn't break the layout
            
            const merged = data.map((bChat: any) => {
               // find base mock chat if exists to preserve demo properties like 'status_conexao'
               const base = INITIAL_CHATS.find(c => c.telefone === bChat.telefone) || INITIAL_CHATS[0];
               return {
                 ...base,
                 id: bChat.id,
                 telefone: bChat.telefone || base.telefone,
                 nome_cliente: bChat.nome_cliente || base.nome_cliente,
                 fila: bChat.fila || 'triagem_ia',
                 mensagens: bChat.mensagens.length > 0 ? bChat.mensagens : base.mensagens
               };
            });
            
            // Add remaining INITIAL_CHATS that aren't in backend
            INITIAL_CHATS.forEach(ic => {
              if (!merged.find((m:any) => m.telefone === ic.telefone)) {
                merged.push(ic);
              }
            });
            
            setChats(merged);
          }
        }
      } catch (e) {
        console.error('Failed to fetch waba chats', e);
      }
    };
    
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, []);
`;

if (!text.includes('fetchChats')) {
  text = text.replace(
    "const [searchQuery, setSearchQuery] = useState('');",
    "const [searchQuery, setSearchQuery] = useState('');\n" + hookFetch
  );
  fs.writeFileSync('src/pages/Inbox.tsx', text, 'utf8');
  console.log('Patched Inbox.tsx with polling');
} else {
  console.log('Inbox.tsx already has polling');
}
