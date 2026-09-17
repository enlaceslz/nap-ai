const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

const routeGet = `
  app.get("/api/configuracoes", (req, res) => {
    res.json(systemConfig);
  });
`;

const routePut = `
  app.put("/api/configuracoes", (req, res) => {
    systemConfig = { ...systemConfig, ...req.body };
    res.json({ success: true, config: systemConfig });
  });
`;

if (!text.includes('app.get("/api/configuracoes"')) {
  text = text.replace(
    /app\.post\("\/api\/configuracoes\/restaurar-nativos"/,
    routeGet + '\n' + routePut + '\n  app.post("/api/configuracoes/restaurar-nativos"'
  );
  fs.writeFileSync('server.ts', text, 'utf8');
  console.log('Added /api/configuracoes GET/PUT routes.');
} else {
  console.log('Routes already exist.');
}
