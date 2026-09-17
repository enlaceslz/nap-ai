const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// I just messed up the open tag in <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6"> by closing it immediately.
code = code.replace(
  /      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">\n        <\/div>\{\/\* Coluna Esquerda: Lista de OSs \*\/\}/g,
  `      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">\n        {/* Coluna Esquerda: Lista de OSs */}`
);

// We need to also fix the bottom of the file which I appended many divs to.
code = code.replace(
  /          \}\)\}\n        <\/div>\n      \}\)\}\n    <\/div>\n  \);\n\}\n    <\/div>\n  \);\n\}\n    <\/div>\n  \);\n\}/,
  `          )}
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
