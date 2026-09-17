const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Declare process.env wrapper for SGP constants
const sgpVars = `
const SGP_URL = process.env.SGP_URL || "";
const SGP_APP = process.env.SGP_APP || "";
const SGP_TOKEN = process.env.SGP_TOKEN || "";

// Função mock para fetchSGP
async function fetchSGP(endpoint, method = "GET", body = null) {
  const url = \`\${SGP_URL}\${endpoint}\`;
  const options = {
    method,
    headers: {
      "app": SGP_APP,
      "token": SGP_TOKEN,
      "Content-Type": "application/json"
    }
  };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(\`Erro HTTP SGP: \${res.status}\`);
  return await res.json();
}
`;

// Inserir após "const PORT = 3000;"
code = code.replace("const PORT = 3000;", "const PORT = 3000;\n" + sgpVars);

// sgpDatabase error fix
code = code.replace("sgpDatabase.find", "sgpDatabase_mock.find");

const sgpMockFind = `const index = kanbanDeals.findIndex(d => d.id === id);`;
const sgpMockReplace = `const sgpDatabase_mock = [
  { id: 101, nome: "João Silva", status: "ativo" },
  { id: 102, nome: "Carlos Eduardo Santos", status: "ativo" }
];
    const index = kanbanDeals.findIndex(d => d.id === id);`;
code = code.replace(sgpMockFind, sgpMockReplace);

fs.writeFileSync('server.ts', code);
