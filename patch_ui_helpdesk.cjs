const fs = require('fs');

let uiText = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');
uiText = uiText.replace(
  /const \[tickets, setTickets\] = useState\(\[\]\);/g,
  "const [tickets, setTickets] = useState<any[]>([]);"
);

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', uiText, 'utf8');
console.log('Fixed type on HelpDeskDashboard.tsx');
