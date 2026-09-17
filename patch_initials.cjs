const fs = require('fs');
const files = ['src/pages/CRM.tsx', 'src/pages/Kanban.tsx'];

files.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(
    "const clean = name.trim().replace(/[^a-zA-ZÀ-ÿ\\s]/g, '');",
    "if (typeof name !== 'string') return 'CL';\n    const clean = name.trim().replace(/[^a-zA-ZÀ-ÿ\\s]/g, '');"
  );
  
  // Extra safety on the parts
  text = text.replace(
    "if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();",
    "if (parts.length === 1) return (parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'CL');"
  );
  text = text.replace(
    "return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();",
    "return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || 'CL';"
  );
  fs.writeFileSync(file, text, 'utf8');
});

console.log('Fixed getInitials error in CRM and Kanban');
