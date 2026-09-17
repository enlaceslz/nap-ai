const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hookStart = `  const sessionRateLimiter = (req, res, next) => {`;
const hookEnd = `    next();
  };`;

// Extraindo a substring
const regex = new RegExp(hookStart.replace(/[.*+?^$\{key}()[\]\\]/g, '\\$&') + '[\\s\\S]*?' + hookEnd.replace(/[.*+?^$\{key}()[\]\\]/g, '\\$&'));

const inject = `  const sessionRateLimiter = (req, res, next) => {
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
      
      // Lógica de Identificação de Origem Interna (Equipamento vs Assinante)
      let origemDetalhada = '';
      if (internal) {
        // Tentativa de identificar o IP interno
        if (ip.startsWith('10.0.')) {
          origemDetalhada = ' (Origem: Equipamento Core / OLT)';
        } else if (ip.startsWith('10.2.') || ip.startsWith('10.3.')) {
          origemDetalhada = ' (Origem: Servidor de Borda / BNG)';
        } else {
          const attemptedCpf = req.body?.cpf || 'Desconhecido';
          // Para IPs locais comuns ou CGNAT
          // Vamos mockar um nome de assinante baseado no CPF tentado, ou gerar um genérico
          let assinanteNome = "Desconhecido";
          if (attemptedCpf.includes('384.921.750-42') || attemptedCpf === '38492175042') {
             assinanteNome = "Rafael Medeiros de Albuquerque (CTR-2026-8894)";
          } else if (attemptedCpf !== 'Desconhecido') {
             assinanteNome = \`Assinante alvo: \${attemptedCpf}\`;
          }
          origemDetalhada = \` (Origem CPE Assinante: \${assinanteNome})\`;
        }
      }

      // Gera Alerta para o NOC
      const novoAlerta = {
        id: alertIdCounter++,
        host: \`WAF / Firewall (\${internal ? 'LAN' : 'WAN'})\`,
        severity: 'critical',
        message: \`Bloqueio de IP (\${ip})\${origemDetalhada}. Excesso de requisições de sessão (\${cache.count} reqs/min). Possível ataque de força bruta.\`,
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
  };`;

code = code.replace(regex, inject);
fs.writeFileSync('server.ts', code);
console.log("WAF Identity patched");
