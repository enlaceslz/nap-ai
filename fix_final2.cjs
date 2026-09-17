const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// Just append a closing div to the file.
code = code.replace(
  /  \);\n\}/,
  '    </div>\n  );\n}'
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
