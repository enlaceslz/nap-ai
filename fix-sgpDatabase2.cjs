const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Move sgpDatabase_mock declaration to the global scope
const toRemove = `    const sgpDatabase_mock = [
  { id: 1, nome: 'João', cpf_cnpj: '111', telefone: '11', email: 'j@j.com', plano: '500MB', valor_plano: 99.9, endereco: 'Rua A', status: 'ativo', vcto_fatura: '10' },
  { id: 101, nome: "João Silva", status: "ativo" },
  { id: 102, nome: "Carlos Eduardo Santos", status: "ativo" }
];`;

code = code.replace(toRemove, "");

const toInsert = `
const sgpDatabase_mock: any[] = [
  { id: 101, nome: "João Silva", status: "ativo", cpf_cnpj: "111.222.333-44", contato: { telefone: "(11) 98765-4321" }, financeiro: { valor: 99.9, status: "em_atraso" } },
  { id: 102, nome: "Carlos Eduardo Santos", status: "ativo", cpf_cnpj: "555.666.777-88", contato: { telefone: "(11) 97123-8899" }, financeiro: { valor: 119.9, status: "em_dia" } }
];
`;

code = code.replace("let kanbanDeals = [", toInsert + "\nlet kanbanDeals = [");

fs.writeFileSync('server.ts', code);
