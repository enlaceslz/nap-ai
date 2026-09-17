const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const securityModule = `
  // --- MÓDULO DE SEGURANÇA E RATE LIMITING (WAF / IPS MOCK) ---
  const nocAlerts = [];
  let alertIdCounter = 1;

  const getClientIp = (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  };

  const isInternalNetwork = (ip) => {
    return ip.startsWith('10.') || 
           ip.startsWith('192.168.') || 
           ip.startsWith('127.0.0.1') || 
           ip.includes('::1');
  };

  const rateLimitCache = {}; // ip -> { count, startTime, blockedUntil }

  const sessionRateLimiter = (req, res, next) => {
    const ip = getClientIp(req);
    const internal = isInternalNetwork(ip);
    
    // Configurações de limite (Rede Interna é mais tolerante)
    const MAX_REQUESTS = internal ? 60 : 15; 
    const WINDOW_MS = 60 * 1000; // 1 minuto
    const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio

    if (!rateLimitCache[ip]) {
      rateLimitCache[ip] = { count: 0, startTime: Date.now(), blockedUntil: 0 };
    }

    const cache = rateLimitCache[ip];

    // Verifica se está bloqueado
    if (cache.blockedUntil > Date.now()) {
      return res.status(429).json({ 
        error: "Too Many Requests", 
        message: \`Seu IP (\${ip}) foi temporariamente bloqueado por excesso de requisições de sessão. Rede: \${internal ? 'Interna' : 'Externa'}\`
      });
    } else if (cache.blockedUntil !== 0) {
      cache.blockedUntil = 0; // Desbloqueia após o tempo
      cache.count = 0;
      cache.startTime = Date.now();
    }

    // Reseta janela de tempo
    if (Date.now() - cache.startTime > WINDOW_MS) {
      cache.count = 0;
      cache.startTime = Date.now();
    }

    cache.count++;

    if (cache.count > MAX_REQUESTS) {
      cache.blockedUntil = Date.now() + BLOCK_DURATION_MS;
      
      // Gera Alerta para o NOC
      const novoAlerta = {
        id: alertIdCounter++,
        host: \`WAF / Firewall (\${internal ? 'LAN' : 'WAN'})\`,
        severity: 'critical',
        message: \`Bloqueio de IP (\${ip}). Excesso de requisições de sessão (\${cache.count} reqs/min). Possível ataque de força bruta ou DDoS originado da rede \${internal ? 'Interna' : 'Externa'}.\`,
        time: 'Agora',
        ack: false,
        timestamp: Date.now()
      };
      
      nocAlerts.unshift(novoAlerta);
      // Limita a 50 alertas na memória
      if (nocAlerts.length > 50) nocAlerts.pop();

      return res.status(429).json({ 
        error: "Too Many Requests", 
        message: "Bloqueio de segurança ativado. Alerta enviado ao NOC." 
      });
    }

    next();
  };

  // Endpoint para o NOC buscar alertas de segurança
  app.get("/api/noc/security-alerts", (req, res) => {
    res.json(nocAlerts);
  });
`;

const hook = `const activeSessions = {}; // cpf -> { sessionId, lastActivity }`;

code = code.replace(hook, securityModule + '\n  ' + hook);

// Now apply the middleware to the heartbeat
code = code.replace(`app.post("/api/portal/session/heartbeat", (req, res) => {`, `app.post("/api/portal/session/heartbeat", sessionRateLimiter, (req, res) => {`);

fs.writeFileSync('server.ts', code);
console.log("Server security patched");
