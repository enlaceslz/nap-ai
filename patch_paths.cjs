const fs = require('fs');

// Fix IPAM imports
let textIpam = fs.readFileSync('src/pages/admin/ipam/IpamDashboard.tsx', 'utf8');
textIpam = textIpam.replace('../../../../services/ipamApi', '../../../services/ipamApi');
fs.writeFileSync('src/pages/admin/ipam/IpamDashboard.tsx', textIpam, 'utf8');

// Fix HelpDesk imports
let textHd = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');
textHd = textHd.replace('../../../../services/helpdeskApi', '../../../services/helpdeskApi');
fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', textHd, 'utf8');

console.log('Fixed relative paths');
