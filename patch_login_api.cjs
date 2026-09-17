const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const loginHook = `  app.post("/api/portal/session/heartbeat", sessionRateLimiter, (req, res) => {`;

const loginInject = `
  app.post("/api/portal/login", sessionRateLimiter, (req, res) => {
    // Apenas um dummy endpoint para aplicar Rate Limiting. O Frontend continuará validando
    // via mocks, mas essa chamada passa pela segurança WAF.
    res.json({ status: "ok" });
  });

  app.post("/api/portal/session/heartbeat", sessionRateLimiter, (req, res) => {`;

code = code.replace(loginHook, loginInject);
fs.writeFileSync('server.ts', code);
console.log("Login API patched");
