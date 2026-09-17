const fs = require('fs');

const getBadgeClasses = `
const getVendorBadgeClasses = (vendor: string) => {
  switch (vendor) {
    case 'ZTE': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'HUAWEI': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'VSOL': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'DATACOM': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
};
`;

function replaceColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('getVendorBadgeClasses')) return;

  const importRegex = /import React, {[^}]+} from 'react';/;
  // Actually let's just insert it before the default export or main function
  content = content.replace(/(export default function)/, getBadgeClasses + "\n$1");
  content = content.replace(/(export function)/, getBadgeClasses + "\n$1");
  content = content.replace(/(export const \w+ =)/, getBadgeClasses + "\n$1");

  // Fix OltDashboardTab.tsx
  content = content.replace(
    /olt\.fabricante === 'ZTE'[\s\n\r]*\? 'text-blue-400 bg-blue-500\/10 border-blue-500\/20'[\s\n\r]*: 'text-red-400 bg-red-500\/10 border-red-500\/20'/g,
    "getVendorBadgeClasses(olt.fabricante)"
  );
  
  // Fix OltDevicesTab.tsx
  content = content.replace(
    /olt\.fabricante === 'ZTE'[\s\n\r]*\? 'text-blue-400 bg-blue-500\/10 border-blue-500\/20'[\s\n\r]*: 'text-red-400 bg-red-500\/10 border-red-500\/20'/g,
    "getVendorBadgeClasses(olt.fabricante)"
  );
  
  fs.writeFileSync(file, content, 'utf8');
}

replaceColors('src/components/olt/OltDashboardTab.tsx');
replaceColors('src/components/olt/OltDevicesTab.tsx');

let main = fs.readFileSync('src/pages/OltManagement.tsx', 'utf8');
if (!main.includes('getVendorBadgeClasses')) {
  main = main.replace(/(export default function OltManagement)/, getBadgeClasses + "\n$1");
  main = main.replace(
    /u\.fabricante_olt === 'ZTE'[\s\n\r]*\? 'bg-blue-500\/10 text-blue-400 border border-blue-500\/20'[\s\n\r]*: 'bg-red-500\/10 text-red-400 border border-red-500\/20'/g,
    "getVendorBadgeClasses(u.fabricante_olt || '')"
  );
  fs.writeFileSync('src/pages/OltManagement.tsx', main, 'utf8');
}

console.log('patched UI colors');
