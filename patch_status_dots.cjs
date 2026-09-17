const fs = require('fs');
const text = fs.readFileSync('src/pages/UsuariosHierarquia.tsx', 'utf8');

const replacement = text.replace(/<span className="h-2\.5 w-2\.5 rounded-full bg-emerald-500"><\/span>/g,
`<span className={\`h-2.5 w-2.5 rounded-full \${admin ? (admin.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500') : (op && op.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500')}\`}></span>`);

fs.writeFileSync('src/pages/UsuariosHierarquia.tsx', replacement);
console.log("Patched status dots");
