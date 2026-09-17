const fs = require('fs');
let code = fs.readFileSync('src/pages/ConsultaSGP.tsx', 'utf8');

code = code.replace(/border-slate-100/g, 'border-white/5');
code = code.replace(/bg-emerald-500 rounded-full border-4 border-white/g, 'bg-emerald-500 rounded-full border-4 border-slate-900');
code = code.replace(/bg-blue-600 text-white text-\[10px\] font-bold uppercase tracking-wider px-2\.5 py-1 rounded-md mb-4/g, 'bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-4 inline-block');

fs.writeFileSync('src/pages/ConsultaSGP.tsx', code);
console.log("Patched Consulta SGP Timeline");
