const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// I will just add another div
code = code.replace(
  /  \);\n\}/,
  '    </div>\n  );\n}'
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
