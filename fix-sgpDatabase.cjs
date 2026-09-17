const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("res.json(sgpDatabase.map", "res.json(sgpDatabase_mock.map");
code = code.replace("const sgpDatabase_mock = [", "const sgpDatabase_mock = [\n  { id: 1, nome: 'João', cpf_cnpj: '111', telefone: '11', email: 'j@j.com', plano: '500MB', valor_plano: 99.9, endereco: 'Rua A', status: 'ativo', vcto_fatura: '10' },");

fs.writeFileSync('server.ts', code);
