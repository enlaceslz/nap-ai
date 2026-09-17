const fs = require('fs');

// 1. Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('import ConsultaSGP')) {
  appCode = appCode.replace(
    "import PortalConta from './pages/PortalConta';",
    "import PortalConta from './pages/PortalConta';\nimport ConsultaSGP from './pages/ConsultaSGP';"
  );
  
  appCode = appCode.replace(
    '<Route path="crm" element={<CRM />} />',
    '<Route path="crm" element={<CRM />} />\n          <Route path="sgp" element={<ConsultaSGP />} />'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

// 2. Patch Layout.tsx
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layoutCode.includes('to="/sgp"')) {
  layoutCode = layoutCode.replace(
    "import { MessageSquare, LayoutDashboard, Settings, Users, Trello, PieChart, ShieldUser, Megaphone, Workflow } from 'lucide-react';",
    "import { MessageSquare, LayoutDashboard, Settings, Users, Trello, PieChart, ShieldUser, Megaphone, Workflow, Server } from 'lucide-react';"
  );

  layoutCode = layoutCode.replace(
    '<NavItem to="/crm" icon={<Users size={18} />} label="CRM Clientes" />',
    '<NavItem to="/crm" icon={<Users size={18} />} label="CRM Clientes" />\n            <NavItem to="/sgp" icon={<Server size={18} />} label="Consulta SGP" />'
  );
  fs.writeFileSync('src/components/Layout.tsx', layoutCode);
}

console.log('Routes and Layout updated with ConsultaSGP');
