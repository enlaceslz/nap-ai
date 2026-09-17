const fs = require('fs');
let text = fs.readFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', 'utf8');

text = text.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { fetchHelpDeskDashboardData } from '../../../../services/helpdeskApi';"
);

text = text.replace(
  /useEffect\(\(\) => {[\s\S]*?}, \[\]\);/,
  `const [metrics, setMetrics] = useState<any>(null);
  const [nocStatus, setNocStatus] = useState<any>(null);

  useEffect(() => {
    fetchHelpDeskDashboardData().then(res => {
      setTickets(res.tickets);
      setMetrics(res.metrics);
      setNocStatus(res.nocStatus);
      setLoading(false);
    });
  }, []);`
);

// Inject Metrics
text = text.replace(
  /<div className="text-3xl font-bold text-slate-900 dark:text-white">124<\/div>/,
  '<div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "-" : metrics?.openTickets}</div>'
);
text = text.replace(
  /<div className="text-3xl font-bold text-slate-900 dark:text-white">18<\/div>/,
  '<div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "-" : metrics?.criticalIncidents}</div>'
);
text = text.replace(
  /<div className="text-3xl font-bold text-slate-900 dark:text-white">45<\/div>/,
  '<div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "-" : metrics?.fieldOrders}</div>'
);
text = text.replace(
  /<div className="text-3xl font-bold text-slate-900 dark:text-white">98%<\/div>/,
  '<div className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? "-" : metrics?.slaCompliance}%</div>'
);

// Inject NOC Status
text = text.replace(
  /<span className="font-mono font-bold text-emerald-400">12 \/ 12<\/span>/,
  '<span className="font-mono font-bold text-emerald-400">{loading ? "-" : `${nocStatus?.oltsUp} / ${nocStatus?.oltsTotal}`}</span>'
);
text = text.replace(
  /<span className="font-mono font-bold text-emerald-400">4 \/ 4 UP<\/span>/,
  '<span className="font-mono font-bold text-emerald-400">{loading ? "-" : `${nocStatus?.bgpUp} / ${nocStatus?.bgpTotal} UP`}</span>'
);
text = text.replace(
  /<span className="text-xs font-medium bg-red-500\/20 text-red-400 px-2 py-1 rounded">\s*Queda de Energia \(POP-02\)\s*<\/span>/,
  '<span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-1 rounded">{loading ? "-" : nocStatus?.recentAlarm}</span>'
);

fs.writeFileSync('src/pages/admin/helpdesk/HelpDeskDashboard.tsx', text, 'utf8');
console.log('HelpDesk Dashboard wired to API service');
