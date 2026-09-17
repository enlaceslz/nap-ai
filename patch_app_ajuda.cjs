const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import Ajuda from')) {
  // Add import
  code = code.replace(
    /import Auditoria from '\.\/pages\/Auditoria';/g,
    "import Auditoria from './pages/Auditoria';\nimport Ajuda from './pages/Ajuda';"
  );
  
  // Add route
  code = code.replace(
    /<Route path="auditoria" element=\{<Auditoria \/>\} \/>/g,
    `<Route path="auditoria" element={<Auditoria />} />\n          <Route path="ajuda" element={<Ajuda />} />`
  );
  
  fs.writeFileSync('src/App.tsx', code);
}
