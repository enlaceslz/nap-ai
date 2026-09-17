const fs = require('fs');
let text = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf8');

const newValidTabs = "const validTabs: TabType[] = ['identidade', 'nativos', 'infraestrutura', 'landingpage', 'sgp', 'telefonia', 'whatsapp', 'ia', 'atendimento', 'macros', 'seguranca', 'telegram'];";

text = text.replace(/const validTabs: TabType\[\] = \['identidade', 'nativos', 'infraestrutura', 'landingpage', 'sgp', 'telefonia', 'whatsapp', 'ia', 'atendimento', 'macros', 'seguranca'\];/g, newValidTabs);

fs.writeFileSync('src/pages/SuperAdmin.tsx', text, 'utf8');
console.log('Fixed validTabs in SuperAdmin.tsx');
