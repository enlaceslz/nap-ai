const fs = require('fs');
let text = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!text.includes('admin/ipam')) {
  // Add NavItem just below Zabbix/NOC 
  text = text.replace(
    '<NavItem to="/admin/infra" icon={<Activity size={18} />} label="NOC & Telemetria" isCollapsed={isCollapsed} />',
    '<NavItem to="/admin/infra" icon={<Activity size={18} />} label="NOC & Telemetria" isCollapsed={isCollapsed} />\n                <NavItem to="/admin/helpdesk" icon={<Ticket size={18} />} label="Help Desk & OS" isCollapsed={isCollapsed} />\n                <NavItem to="/admin/ipam" icon={<Globe size={18} />} label="Rede (IPAM & NSoT)" isCollapsed={isCollapsed} />'
  );

  // Add Lucide imports
  text = text.replace(
    'import {',
    'import { Ticket, Globe, '
  );
  
  fs.writeFileSync('src/components/Layout.tsx', text, 'utf8');
  console.log('Force patched Layout.tsx');
} else {
  console.log('Already patched.');
}
