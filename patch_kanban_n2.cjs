const fs = require('fs');
let code = fs.readFileSync('src/pages/Kanban.tsx', 'utf8');

const hook = `    if (type === 'Suporte') {
      return ['Novo Chamado', 'Em Análise', 'Técnico em Rota', 'Resolvido'];
    }`;

const inject = `    if (type === 'Suporte') {
      return ['Novo Chamado', 'Em Análise N1', 'Escalonado N2 / NOC', 'Técnico em Rota', 'Resolvido'];
    }`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Kanban.tsx', code);
console.log("Kanban N2 patched");
