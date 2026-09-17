const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/SgpAdvancedSearch.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { from: /bg-white/g, to: 'bg-slate-900' },
  { from: /bg-slate-50/g, to: 'bg-slate-950' },
  { from: /border-slate-200/g, to: 'border-white/10' },
  { from: /border-slate-100/g, to: 'border-white/5' },
  { from: /text-slate-800/g, to: 'text-slate-200' },
  { from: /text-slate-900/g, to: 'text-white' },
  { from: /text-slate-700/g, to: 'text-slate-300' },
  { from: /text-slate-600/g, to: 'text-slate-400' },
  { from: /divide-slate-100/g, to: 'divide-white/5' },
  { from: /hover:bg-slate-100/g, to: 'hover:bg-slate-800' },
  { from: /bg-slate-100/g, to: 'bg-slate-800' },
  { from: /hover:border-slate-300/g, to: 'hover:border-white/20' }
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(filePath, content);
console.log('Theme updated successfully.');
