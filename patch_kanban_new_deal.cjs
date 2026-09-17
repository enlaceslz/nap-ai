const fs = require('fs');
let code = fs.readFileSync('src/pages/Kanban.tsx', 'utf8');

const hook = `  const [newDealData, setNewDealData] = useState({
    titulo: '',
    contato: '',
    telefone: '',
    endereco: '',
    plano: 'Fibra 500MB',
    valor: 99.90,
    dias_atraso: 0,
    prioridade: 2,
    contexto_ia: ''
  });`;

const inject = `  const [newDealData, setNewDealData] = useState({
    titulo: '',
    contato: '',
    telefone: '',
    endereco: '',
    plano: 'Fibra 500MB',
    valor: 99.90,
    dias_atraso: 0,
    prioridade: 2,
    contexto_ia: ''
  });

  useEffect(() => {
    // Ajusta os placeholders padrão ao mudar o tipo
    if (type === 'Vendas') {
      setNewDealData(prev => ({
        ...prev,
        plano: 'Fibra 1GB + Wi-Fi 6 Mesh',
        valor: 149.90
      }));
    } else if (type === 'Cobranca') {
      setNewDealData(prev => ({
        ...prev,
        dias_atraso: 3,
        valor: 99.90
      }));
    }
  }, [type]);`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Kanban.tsx', code);
console.log("Kanban default form values patched");
