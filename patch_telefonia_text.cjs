const fs = require('fs');
let code = fs.readFileSync('src/pages/Telefonia.tsx', 'utf8');

const oldText = "Configure ramais administrativos nativos do Asterisk. Estes ramais podem ser configurados em aparelhos IP, Softphones (Zoiper/MicroSIP) e se comunicar internamente ou realizar transferências, sem necessariamente estar em uma URA pública.";
const newText = "Configure ramais administrativos (PJSIP) nativos do Asterisk. Estes ramais podem ser registrados no Webphone embutido (WebRTC), aparelhos IP ou Softphones (Zoiper), permitindo comunicação interna e transferências diretas pelo CRM.";

code = code.replace(oldText, newText);
fs.writeFileSync('src/pages/Telefonia.tsx', code);
console.log("Patched Telefonia instructions");
