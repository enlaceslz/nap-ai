const fs = require('fs');
let code = fs.readFileSync('src/pages/NocMonitoramento.tsx', 'utf8');

// Remove mocks
const mockRegex = /const alarmsMock = \[(?:[\s\S]*?)\];\s*const oltNodesMock = \[(?:[\s\S]*?)\];/;
code = code.replace(mockRegex, '');

// Update state initialization
code = code.replace(`  const [alarms, setAlarms] = useState(alarmsMock);
  const [nodes, setNodes] = useState(oltNodesMock);`, `  const [alarms, setAlarms] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);`);


// Update fetch to consume native Zabbix + WAF
const fetchHook = `  const fetchSecurityAlerts = async () => {
    try {
      const res = await fetch('/api/noc/security-alerts');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Mescla alertas de segurança com os do Zabbix (mock)
        const combined = [...data, ...alarmsMock];
        setAlarms(combined);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    fetchSecurityAlerts();
    const interval = setInterval(fetchSecurityAlerts, 5000); // Polling a cada 5s

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);`;

const newFetch = `  const fetchNocData = async () => {
    try {
      const [wafRes, zabbixRes] = await Promise.all([
        fetch('/api/noc/security-alerts'),
        fetch('/api/zabbix/status')
      ]);
      
      const wafAlerts = await wafRes.json();
      const zabbixData = await zabbixRes.json();
      
      if (Array.isArray(wafAlerts) && zabbixData.problems) {
        // Mescla WAF com Problemas do Zabbix Engine
        const combinedAlerts = [...wafAlerts, ...zabbixData.problems];
        // Ordena por data (mais recentes primeiro)
        combinedAlerts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAlarms(combinedAlerts);
        setNodes(zabbixData.hosts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    fetchNocData();
    const interval = setInterval(fetchNocData, 5000); // Zabbix Polling 5s

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);`;

code = code.replace(fetchHook, newFetch);


// Update handleAck
const ackHook = `  const handleAck = (id: number) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
  };`;
const newAck = `  const handleAck = async (id: number) => {
    // Atualiza otimista local
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
    // Dispara pro Zabbix Engine
    try {
       await fetch('/api/zabbix/ack', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id })
       });
    } catch (e) { console.error(e); }
  };`;

code = code.replace(ackHook, newAck);

fs.writeFileSync('src/pages/NocMonitoramento.tsx', code);
console.log("NOC Monitoramento patched for Zabbix");
