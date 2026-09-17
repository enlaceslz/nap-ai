const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const regex = /res\.json\(\{\s*sucesso: true,\s*total: usuariosProvedor\.length,\s*resumo_hierarquia: \{[\s\S]*?\}\s*\}\);/m;

const replacement = `res.json({
      sucesso: true,
      total: usuariosProvedor.length,
      usuarios: usuariosProvedor,
      resumo_hierarquia: {
        admin: usuariosProvedor.filter(u => u.cargo === 'admin').length,
        operador: usuariosProvedor.filter(u => u.cargo === 'operador').length,
        tecnico: usuariosProvedor.filter(u => u.cargo === 'tecnico_campo').length,
        com_geolocalizacao: usuariosProvedor.filter(u => u.geolocalizacao?.ativo).length,
        pwa_ativo: usuariosProvedor.filter(u => u.pwa?.push_ativo).length
      }
    });`;

if(regex.test(text)) {
  fs.writeFileSync('server.ts', text.replace(regex, replacement));
  console.log("Success: Replaced API response in server.ts");
} else {
  console.log("Regex failed to match API response in server.ts");
}
