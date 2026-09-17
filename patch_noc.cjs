const fs = require('fs');
let code = fs.readFileSync('src/pages/NocMonitoramento.tsx', 'utf8');

const hook = `  useEffect(() => {
    // Simula carregamento do Zabbix/API
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);`;

const inject = `
  const fetchSecurityAlerts = async () => {
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

code = code.replace(hook, inject);

fs.writeFileSync('src/pages/NocMonitoramento.tsx', code);
console.log("NOC Monitoramento patched");
