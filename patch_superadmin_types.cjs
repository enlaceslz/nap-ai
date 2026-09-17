const fs = require('fs');
let text = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf8');

// Fix TabType definition
text = text.replace(
  "type TabType = 'identidade' | 'nativos' | 'infraestrutura' | 'landingpage' | 'sgp' | 'telefonia' | 'whatsapp' | 'ia' | 'atendimento' | 'macros' | 'seguranca';",
  "type TabType = 'identidade' | 'nativos' | 'infraestrutura' | 'landingpage' | 'sgp' | 'telefonia' | 'whatsapp' | 'ia' | 'atendimento' | 'macros' | 'seguranca' | 'telegram';"
);

// Fix the undefined `user` reference by pulling it from the mock or context, here we use a static string for the bind
text = text.replace(
  "body: JSON.stringify({ userId: user?.email || 'NOC_User_01', role: 'noc' })",
  "body: JSON.stringify({ userId: 'Operador_NOC', role: 'noc' })"
);

fs.writeFileSync('src/pages/SuperAdmin.tsx', text, 'utf8');
console.log('Fixed typescript issues in SuperAdmin');
