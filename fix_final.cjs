const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// The original issue was I added a relative wrapper in <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 relative">
// and that messed up the closing divs.
code = code.replace(
  /<div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 relative">/g,
  '<div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">'
);

// We had two extra closing divs at the end or missing one.
// Let's just remove the button I added since it might have broken JSX
code = code.replace(
  /<button \n                  onClick=\{[^\}]+\}\n                  className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-white mb-2 pb-2 border-b border-white\/5"\n                >\n                  <ArrowLeft size=\{16\} \/> Voltar para lista de OS\n                <\/button>/g,
  ''
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
