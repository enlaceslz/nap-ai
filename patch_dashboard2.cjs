const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

code = code.replace(
  /const matchesSearch = t.title.toLowerCase\(\).includes\(searchTerm.toLowerCase\(\)\) \|\| t.id.toLowerCase\(\).includes\(searchTerm.toLowerCase\(\)\);/g,
  "const titleStr = t.title ? t.title.toString() : '';\n                const idStr = t.id ? t.id.toString() : '';\n                const matchesSearch = titleStr.toLowerCase().includes(searchTerm.toLowerCase()) || idStr.toLowerCase().includes(searchTerm.toLowerCase());"
);

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', code, 'utf8');
console.log('Patched matchesSearch');
