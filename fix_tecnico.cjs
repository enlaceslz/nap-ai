const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// Undo the mess
code = code.replace(
  /<div className=\\{\`lg:col-span-4 space-y-4 \\\$\\{selectedOS && window\\.innerWidth < 1024 \\? 'hidden' : 'block'\\}\\`\\}>\n        <div className=\\{\`lg:col-span-5 space-y-3 \\\$\\{selectedOS \\? 'hidden lg:block' : 'block'\\}\\`\\}>/g,
  '<div className={`lg:col-span-4 lg:col-span-5 space-y-3 ${selectedOS && window.innerWidth < 1024 ? \'hidden\' : \'block\'}`}>'
);

code = code.replace(/<div className=\\{\`lg:col-span-4 space-y-4/g, '<!-- ');

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
