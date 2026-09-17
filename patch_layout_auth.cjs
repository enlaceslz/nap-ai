const fs = require('fs');
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!layoutCode.includes('useAuth')) {
  layoutCode = layoutCode.replace(
    "import { NavLink, Outlet } from 'react-router-dom';",
    "import { NavLink, Outlet } from 'react-router-dom';\nimport { useAuth } from '../contexts/AuthContext';"
  );
  
  layoutCode = layoutCode.replace(
    "import { MessageSquare, LayoutDashboard, Settings, Users, Trello, PieChart, ShieldUser, Megaphone, Workflow, Server } from 'lucide-react';",
    "import { MessageSquare, LayoutDashboard, Settings, Users, Trello, PieChart, ShieldUser, Megaphone, Workflow, Server, LogOut } from 'lucide-react';"
  );
  
  layoutCode = layoutCode.replace(
    "export default function Layout() {",
    "export default function Layout() {\n  const { logout, user } = useAuth();"
  );
  
  // Add logout button at the bottom of sidebar
  layoutCode = layoutCode.replace(
    '</nav>\n        </div>\n      </aside>',
    '</nav>\n        </div>\n\n        <div className="mt-auto p-4 border-t border-slate-200">\n          <button onClick={logout} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 rounded-xl transition-colors font-bold text-sm">\n            Sair\n            <LogOut size={16} />\n          </button>\n        </div>\n      </aside>'
  );

  fs.writeFileSync('src/components/Layout.tsx', layoutCode);
}
console.log('Layout updated with logout');
