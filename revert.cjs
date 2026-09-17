const fs = require('fs');

// Fetch original from cache or simple replacement
// Since we don't have git, let's just fix the div tags manually

let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

code = code.replace(
  /\{?\/\* Coluna Esquerda: Lista de OSs \*\/\}\n        <!-- className=\{\`lg:col-span-4 space-y-4 \$\{selectedOS && window.innerWidth < 1024 \? 'hidden' : 'block'\}\`\}>\n        <div className=\{\`lg:col-span-5 space-y-3 \$\{selectedOS \? 'hidden lg:block' : 'block'\}\`\}>/g,
  `{/* Coluna Esquerda: Lista de OSs */}
        <div className={\`lg:col-span-5 space-y-3 \${selectedOS ? 'hidden lg:block' : 'block'}\`}>`
);

code = code.replace(
  /        <\/div>\n        <\/div>\n\n        \{\/\* Coluna Direita: Execução e Diagnóstico em Campo \*\/\}\n        <div className=\{\`lg:col-span-8 \$\{\!selectedOS && window.innerWidth < 1024 \? 'hidden' : 'block'\}\`\}>\n        <div className=\{\`lg:col-span-7 space-y-6 \$\{\!selectedOS \? 'hidden lg:block' : 'block'\}\`\}>/g,
  `        </div>

        {/* Coluna Direita: Execução e Diagnóstico em Campo */}
        <div className={\`lg:col-span-7 space-y-6 \${!selectedOS ? 'hidden lg:block' : 'block'}\`}>`
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
