const fs = require('fs');
let text = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Insert after Auditoria if the previous patch failed due to exact string matching
if (!text.includes('/admin/helpdesk')) {
  text = text.replace(
    '<NavItem to="/admin/auditoria" icon={<ShieldCheck size={18} />} label="Logs de Auditoria" isCollapsed={isCollapsed} />',
    '<NavItem to="/admin/auditoria" icon={<ShieldCheck size={18} />} label="Logs de Auditoria" isCollapsed={isCollapsed} />\n                <NavItem to="/admin/helpdesk" icon={<Ticket size={18} />} label="Help Desk & OS" isCollapsed={isCollapsed} />\n                <NavItem to="/admin/ipam" icon={<Globe size={18} />} label="Rede (IPAM & NSoT)" isCollapsed={isCollapsed} />'
  );
  fs.writeFileSync('src/components/Layout.tsx', text, 'utf8');
  console.log('Successfully patched Layout.tsx using Auditoria anchor.');
} else {
  console.log('Sidebar links are already present.');
}
