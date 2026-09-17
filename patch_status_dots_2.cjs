const fs = require('fs');
const text = fs.readFileSync('src/pages/UsuariosHierarquia.tsx', 'utf8');

const regex1 = /<span className=\{\`h-2\.5 w-2\.5 rounded-full \$\{admin \? \(admin\.status === 'online' \? 'bg-emerald-500' : 'bg-slate-500'\) : \(op && op\.status === 'online' \? 'bg-emerald-500' : 'bg-slate-500'\)\}\`\}><\/span>/;
const rep1 = `<div className="flex items-center gap-1.5"><span className={\`h-2.5 w-2.5 rounded-full \${admin.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}\`}></span><span className="text-[10px] text-slate-400">{admin.status_label}</span></div>`;

const regex2 = /<span className=\{\`h-2\.5 w-2\.5 rounded-full \$\{admin \? \(admin\.status === 'online' \? 'bg-emerald-500' : 'bg-slate-500'\) : \(op && op\.status === 'online' \? 'bg-emerald-500' : 'bg-slate-500'\)\}\`\}><\/span>/;
const rep2 = `<div className="flex items-center gap-1.5"><span className={\`h-2.5 w-2.5 rounded-full \${op.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}\`}></span><span className="text-[10px] text-slate-400">{op.status_label}</span></div>`;

let newText = text;
if (regex1.test(newText)) {
  newText = newText.replace(regex1, rep1);
  newText = newText.replace(regex2, rep2);
  fs.writeFileSync('src/pages/UsuariosHierarquia.tsx', newText);
  console.log("Success");
} else {
  console.log("Failed");
}
