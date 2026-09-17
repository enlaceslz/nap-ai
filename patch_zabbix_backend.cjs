const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const injectZabbix = `
  // --- MOTOR ZABBIX NATIVO (ZABBIX ENGINE MOCK) ---
  const zabbixEngine = {
    hosts: [
      { id: 1001, name: 'OLT-HUAWEI-01 (Centro)', ip: '10.0.0.10', cpu: 45, ram: 60, temp: 42, uptime: '45d 12h', status: 'online' },
      { id: 1002, name: 'OLT-ZTE-02 (Norte)', ip: '10.0.0.11', cpu: 78, ram: 55, temp: 64, uptime: '12d 03h', status: 'online' },
      { id: 1003, name: 'OLT-DATACOM-03 (Sul)', ip: '10.0.0.12', cpu: 20, ram: 30, temp: 38, uptime: '110d 09h', status: 'online' },
      { id: 1004, name: 'CORE-MIKROTIK-CCR', ip: '10.0.0.1', cpu: 80, ram: 40, temp: 45, uptime: '200d 14h', status: 'warning' },
      { id: 1005, name: 'EDGE-JUNIPER', ip: '172.16.0.1', cpu: 30, ram: 30, temp: 35, uptime: '30d 01h', status: 'online' }
    ],
    problems: [
      { id: 101, host: 'OLT-HUAWEI-01 (Centro)', severity: 'critical', message: 'PON 0/1/3 LOS (Loss of Signal)', time: 'Agora', ack: false, timestamp: Date.now() - 600000 },
      { id: 103, host: 'EDGE-JUNIPER', severity: 'info', message: 'BGP Peer Flapping (AS65000)', time: 'Agora', ack: false, timestamp: Date.now() - 3600000 }
    ],
    generateMetrics() {
       this.hosts.forEach(h => {
           // Variação simulada (jitter)
           if (h.status !== 'offline') {
               h.cpu = Math.max(5, Math.min(99, Math.round(h.cpu + (Math.random() * 10 - 5))));
               h.temp = Math.max(30, Math.min(80, Math.round(h.temp + (Math.random() * 4 - 2))));
               h.ram = Math.max(20, Math.min(95, Math.round(h.ram + (Math.random() * 2 - 1))));
           }
           
           // Avaliação de Triggers (Gatilhos Zabbix)
           // Trigger 1: Temperatura
           if (h.temp > 65) {
               const exists = this.problems.find(p => p.host === h.name && p.message.includes('Temperature'));
               if (!exists) {
                   this.problems.push({
                       id: Date.now() + Math.floor(Math.random() * 1000),
                       host: h.name,
                       severity: 'critical',
                       message: \`Module Temperature Critical (> 65°C) [\${h.temp}°C]\`,
                       time: 'Agora',
                       ack: false,
                       timestamp: Date.now()
                   });
                   h.status = 'critical';
               } else {
                   exists.message = \`Module Temperature Critical (> 65°C) [\${h.temp}°C]\`;
               }
           } else if (h.temp < 62) {
               // Resolve
               const idx = this.problems.findIndex(p => p.host === h.name && p.message.includes('Temperature'));
               if (idx !== -1) {
                   this.problems.splice(idx, 1);
                   if (h.cpu < 85) h.status = 'online';
               }
           }

           // Trigger 2: CPU
           if (h.cpu > 85) {
               const exists = this.problems.find(p => p.host === h.name && p.message.includes('CPU'));
               if (!exists) {
                   this.problems.push({
                       id: Date.now() + Math.floor(Math.random() * 1000),
                       host: h.name,
                       severity: 'warning',
                       message: \`CPU Utilization High (> 85%) [\${h.cpu}%]\`,
                       time: 'Agora',
                       ack: false,
                       timestamp: Date.now()
                   });
                   if (h.status !== 'critical') h.status = 'warning';
               } else {
                   exists.message = \`CPU Utilization High (> 85%) [\${h.cpu}%]\`;
               }
           } else if (h.cpu < 80) {
               const idx = this.problems.findIndex(p => p.host === h.name && p.message.includes('CPU'));
               if (idx !== -1) {
                   this.problems.splice(idx, 1);
                   if (h.temp <= 65) h.status = 'online';
               }
           }
       });
    }
  };

  // Zabbix Polling Loop (Natty/Embedded)
  setInterval(() => zabbixEngine.generateMetrics(), 5000);

  // APIs do Zabbix Engine
  app.get("/api/zabbix/status", (req, res) => {
     res.json({
         hosts: zabbixEngine.hosts,
         problems: zabbixEngine.problems.map(p => {
             const mins = Math.floor((Date.now() - p.timestamp) / 60000);
             const timeStr = mins < 1 ? 'Agora' : mins < 60 ? \`\${mins} min\` : \`\${Math.floor(mins/60)} hr\`;
             return { ...p, time: timeStr };
         })
     });
  });

  app.post("/api/zabbix/ack", express.json(), (req, res) => {
      const { id } = req.body;
      const problem = zabbixEngine.problems.find(p => p.id === id);
      if (problem) {
         problem.ack = true;
         return res.json({ success: true });
      }
      res.status(404).json({ error: "Problem not found" });
  });

  // --- MÓDULO DE SEGURANÇA E RATE LIMITING (WAF / IPS MOCK) ---`;

code = code.replace(`  // --- MÓDULO DE SEGURANÇA E RATE LIMITING (WAF / IPS MOCK) ---`, injectZabbix);

fs.writeFileSync('server.ts', code);
console.log("Zabbix Engine injected into server.ts");
