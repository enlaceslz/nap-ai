const fs = require('fs');
let text = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

if (!text.includes('filteredTickets =')) {
  // Add search term state
  text = text.replace(
    "const [activeTab, setActiveTab] = useState('tickets');",
    "const [activeTab, setActiveTab] = useState('tickets');\n  const [searchTerm, setSearchTerm] = useState('');"
  );

  // Wire search input
  text = text.replace(
    /<input \s*type="text" \s*placeholder="Buscar ticket ou OS\.\.\." \s*className=/g,
    `<input type="text" placeholder="Buscar ticket ou OS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className=`
  );

  // Apply filtering
  text = text.replace(
    /tickets\.map\(\(t: any\) => \(/,
    `tickets.filter((t: any) => {
                const matchesTab = activeTab === 'os' ? t.source === 'sgp' : t.source !== 'sgp';
                const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesTab && matchesSearch;
              }).map((t: any) => (`
  );

  fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', text, 'utf8');
  console.log('Added search and tab filters to Help Desk.');
}
