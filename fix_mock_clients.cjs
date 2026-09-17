const fs = require('fs');

const file = 'src/data/portalMockClients.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/"600 Mega Fibra Turbo \+ Wi-Fi 6 Mesh"/g, '"DJD Fibra 500 Mega + Wi-Fi 6"');
content = content.replace(/valor_plano: 119\.90/g, 'valor_plano: 119.90');

content = content.replace(/"Fibra 700MB Gamer Pro"/g, '"DJD Fibra 300 Mega"');
content = content.replace(/valor_plano: 139\.90/g, 'valor_plano: 99.90');

content = content.replace(/"Fibra 300MB - Cancelado"/g, '"DJD Fibra 100 Mega"');
content = content.replace(/valor_plano: 89\.90/g, 'valor_plano: 84.90');

content = content.replace(/São Paulo/g, 'São Luís');
content = content.replace(/SP/g, 'MA');
content = content.replace(/Jardins/g, 'Renascença');
content = content.replace(/Pinheiros/g, 'Turu');
content = content.replace(/Vila Madalena/g, 'Calhau');
content = content.replace(/Av. Paulista/g, 'Av. dos Holandeses');

fs.writeFileSync(file, content);
console.log('Updated mock clients in', file);
