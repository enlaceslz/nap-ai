const fs = require('fs');
let text = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// Define mockOrdens array before usage if it doesn't exist
const mockArrayStr = `const mockOrdens: OSItem[] = [
  { id: '1', numero: 'OS-000182', tipo: 'Reparo', cliente_nome: 'João Silva', cliente_cpf: '111', endereco: 'Rua A', bairro: 'Cohab', cidade: 'São Luís', lat: -2.529, lng: -44.302, status: 'pendente' }
];
  const carregarOrdens = async () => {`;

if (!text.includes('const mockOrdens: OSItem[] = [')) {
  text = text.replace(
    '  const carregarOrdens = async () => {',
    mockArrayStr
  );
  fs.writeFileSync('src/pages/TecnicoCampo.tsx', text, 'utf8');
  console.log('Injected mockOrdens fallback in TecnicoCampo.tsx');
}
