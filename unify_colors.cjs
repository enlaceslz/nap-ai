const fs = require('fs');
const glob = require('glob');

const replacements = [
  { regex: /bg-\[\#0b111e\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#06080e\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#0b0f19\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#060b14\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#070b12\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#090014\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#0b1120\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#0b1220\]/g, replacement: 'bg-slate-950' },
  { regex: /bg-\[\#0d1628\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#101c33\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#0e172a\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#0e1422\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#101d36\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#0c1424\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#120524\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#1a2133\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#151f33\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#202c33\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#2a3942\]/g, replacement: 'bg-slate-900' },
  { regex: /bg-\[\#152544\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#13223f\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#142340\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#14223d\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#0a1324\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#162747\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#1b2f54\]/g, replacement: 'bg-slate-800' },
  { regex: /bg-\[\#1c325c\]/g, replacement: 'bg-slate-800' },
  { regex: /border-\[\#1b2c4c\]/g, replacement: 'border-slate-800' },
  { regex: /border-\[\#1b2a47\]/g, replacement: 'border-slate-800' },
  { regex: /border-\[\#1b2b48\]/g, replacement: 'border-slate-800' },
  { regex: /border-\[\#1e3052\]/g, replacement: 'border-slate-700' },
  { regex: /border-\[\#1e345e\]/g, replacement: 'border-slate-700' },
  { regex: /border-\[\#16233b\]/g, replacement: 'border-slate-800' },
  { regex: /border-\[\#101c33\]/g, replacement: 'border-slate-900' },
  { regex: /divide-\[\#1b2c4c\]/g, replacement: 'divide-slate-800' },
  { regex: /divide-\[\#1e3052\]/g, replacement: 'divide-slate-700' },
  { regex: /divide-\[\#1b2a47\]/g, replacement: 'divide-slate-800' }
];

const files = glob.sync('src/**/*.{tsx,ts,css}');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(r => {
    newContent = newContent.replace(r.regex, r.replacement);
  });
  
  // also handle HelpDesk specific hardcoded light/dark combinations
  // e.g. dark:bg-[#151c2f]
  newContent = newContent.replace(/dark:bg-\[\#[0-9a-fA-F]+\]/g, 'dark:bg-slate-900');
  newContent = newContent.replace(/dark:border-\[\#[0-9a-fA-F]+\]/g, 'dark:border-slate-800');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedCount++;
  }
});

console.log(`Replaced hex colors in ${modifiedCount} files.`);
