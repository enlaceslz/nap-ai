const fs = require('fs');
const text = fs.readFileSync('src/pages/UsuariosHierarquia.tsx', 'utf8');

const regex = /<span className=\{\`px-2 py-0\.5 rounded text-\[10px\] font-bold uppercase \$\{[\s\n]*usuario\.status === 'online'[\s\n]*\? 'bg-emerald-500\/20 text-emerald-400'[\s\n]*: usuario\.status === 'pausa'[\s\n]*\? 'bg-amber-500\/20 text-amber-400'[\s\n]*: usuario\.status === 'em_rota'[\s\n]*\? 'bg-blue-500\/20 text-blue-400'[\s\n]*: usuario\.status === 'no_cliente'[\s\n]*\? 'bg-purple-500\/20 text-purple-400'[\s\n]*: 'bg-slate-800 text-slate-500'[\s\n]*\}\`\}>/m;

if(regex.test(text)) {
  console.log("Regex matches status badge in team view");
} else {
  console.log("Regex failed to match status badge");
}
