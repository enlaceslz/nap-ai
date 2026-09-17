const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hook = `app.post("/api/portal/wifi/reboot", async (req, res) => {`;

const inject = `
  const activeSessions = {}; // cpf -> { sessionId, lastActivity }

  app.post("/api/portal/session/heartbeat", (req, res) => {
    const { cpf, sessionId } = req.body;
    if (!cpf || !sessionId) return res.status(400).json({ error: "Missing parameters" });

    const currentSession = activeSessions[cpf];

    // If another session is active
    if (currentSession && currentSession.sessionId !== sessionId) {
      // Check if the other session is expired (e.g. 60 min inactivity)
      const isExpired = Date.now() - currentSession.lastActivity > 60 * 60 * 1000;
      if (!isExpired) {
         return res.json({ status: "conflict", message: "Você foi desconectado porque foi feito login por outro dispositivo." });
      }
    }

    // Register or update session
    activeSessions[cpf] = {
      sessionId,
      lastActivity: Date.now()
    };

    res.json({ status: "ok" });
  });

  app.post("/api/portal/wifi/reboot", async (req, res) => {`;

code = code.replace(hook, inject);

fs.writeFileSync('server.ts', code);
console.log("Session manager added");
