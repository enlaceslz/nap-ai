const fs = require('fs');
const text = fs.readFileSync('src/pages/UsuariosHierarquia.tsx', 'utf8');

const regex = /<p className="text-xs text-slate-400">[\s\S]*?1 Administrador • 1 Operador de Atendimento • 2 Técnicos de Campo • Geolocalização Ativa por Padrão[\s\S]*?<\/p>/m;

const replacement = `<p className="text-xs text-slate-400">
                {usuarios.filter(u => u.cargo === 'admin').length} Admin(s) • {usuarios.filter(u => u.cargo === 'operador').length} Operador(es) • {usuarios.filter(u => u.cargo === 'tecnico_campo').length} Técnico(s) de Campo
              </p>`;

if(regex.test(text)) {
  fs.writeFileSync('src/pages/UsuariosHierarquia.tsx', text.replace(regex, replacement));
  console.log("Success: Replaced header counts in UsuariosHierarquia.tsx");
} else {
  console.log("Regex failed to match header counts");
}
