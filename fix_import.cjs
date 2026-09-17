const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

code = code.replace(
  "  Plus\n} from 'lucide-react';",
  "  Plus,\n  X\n} from 'lucide-react';"
);

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', code, 'utf8');
console.log('Fixed import');
