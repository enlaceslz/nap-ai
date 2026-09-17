const fs = require('fs');
let text = fs.readFileSync('src/pages/admin/ipam/IpamDashboard.tsx', 'utf8');

// Add import and state logic
text = text.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { fetchIpamPrefixes } from '../../../../services/ipamApi';"
);

text = text.replace(
  "const [activeTab, setActiveTab] = useState('ipv4');",
  "const [activeTab, setActiveTab] = useState('ipv4');\n  const [data, setData] = useState<any>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetchIpamPrefixes().then(res => {\n      setData(res);\n      setLoading(false);\n    });\n  }, []);"
);

// Map global prefixes
text = text.replace(
  /<div className="space-y-1">\s*<button className="w-full text-left[\s\S]*?<\/div>/,
  `<div className="space-y-1">
            {loading ? <div className="text-slate-500 text-sm p-2">Carregando...</div> : data?.global.map((pref: any) => (
              <button key={pref.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {pref.type === 'IPv6' ? <Globe size={16} /> : <Network size={16} />} 
                  {pref.prefix}
                </span>
                <span className={\`text-[10px] px-2 py-0.5 rounded \${pref.type === 'IPv6' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'}\`}>{pref.type}</span>
              </button>
            ))}
          </div>`
);

// Map VRFs
text = text.replace(
  /<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3 px-2">Data Center & VRFs<\/h3>\s*<div className="space-y-1">[\s\S]*?<\/div>/,
  `<h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3 px-2">Data Center & VRFs</h3>
          <div className="space-y-1">
            {loading ? <div className="text-slate-500 text-sm p-2">Carregando...</div> : data?.vrfs.map((vrf: any) => (
               <button key={vrf.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Server size={16} /> {vrf.name}</span>
                <span className="text-xs text-slate-400 font-mono">{vrf.rd}</span>
              </button>
            ))}
          </div>`
);


// Map Audits
text = text.replace(
  /<tbody className="divide-y divide-slate-100 dark:divide-slate-800\/50 text-slate-700 dark:text-slate-300">[\s\S]*?<\/tbody>/,
  `<tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {loading ? (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-500">Buscando auditoria...</td></tr>
                  ) : data?.audits.map((audit: any) => (
                    <tr key={audit.id}>
                      <td className={\`py-3 font-mono font-medium \${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}\`}>{audit.resource}</td>
                      <td className={\`py-3 \${audit.isConflict ? 'text-red-500 dark:text-red-400' : ''}\`}>{audit.context}</td>
                      <td className="py-3">
                        <span className={\`text-[10px] uppercase font-bold px-2 py-1 rounded \${audit.isConflict ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}\`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400">{audit.date}</td>
                    </tr>
                  ))}
                </tbody>`
);

fs.writeFileSync('src/pages/admin/ipam/IpamDashboard.tsx', text, 'utf8');
console.log('IPAM Dashboard wired to API service');
