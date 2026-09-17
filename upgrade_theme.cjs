const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./src');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to match className="..." or className={'...'} or className={`...`}
  // We need to handle nested quotes carefully, but a simpler split-and-replace by classes is easier.
  // Actually, we can just replace the specific words as whole words (\b), 
  // BUT only inside strings that look like classNames.
  // Since it's React, we can just do global replace of words, because these specific words (bg-slate-950) only appear in classNames.
  
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line has colored bg
    let isColoredBg = /bg-(blue|red|green|emerald|rose|amber|yellow|indigo|purple|digify|\[#)/.test(line);

    line = line.replace(/\bbg-slate-950\b/g, 'bg-background');
    line = line.replace(/\bbg-slate-900\b/g, 'bg-card');
    line = line.replace(/\bbg-slate-800\b/g, 'bg-muted');
    line = line.replace(/\bbg-slate-700\b/g, 'bg-accent');
    
    line = line.replace(/\bborder-slate-800\b/g, 'border-border');
    line = line.replace(/\bborder-slate-700\b/g, 'border-border');
    line = line.replace(/\bborder-white\/5\b/g, 'border-border');
    line = line.replace(/\bborder-white\/10\b/g, 'border-border');
    line = line.replace(/\bborder-white\/20\b/g, 'border-border');
    
    line = line.replace(/\btext-slate-400\b/g, 'text-muted-foreground');
    line = line.replace(/\btext-slate-300\b/g, 'text-muted-foreground');
    line = line.replace(/\btext-slate-200\b/g, 'text-card-foreground');
    line = line.replace(/\btext-slate-100\b/g, 'text-foreground');
    
    line = line.replace(/\bhover:bg-slate-800\b/g, 'hover:bg-accent');
    line = line.replace(/\bhover:bg-white\/5\b/g, 'hover:bg-accent');
    line = line.replace(/\bhover:bg-white\/10\b/g, 'hover:bg-accent');
    line = line.replace(/\bhover:text-slate-200\b/g, 'hover:text-accent-foreground');
    
    if (!isColoredBg) {
      line = line.replace(/\btext-white\b/g, 'text-foreground');
      line = line.replace(/\bhover:text-white\b/g, 'hover:text-foreground');
    }

    lines[i] = line;
  }
  
  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
});

console.log(`Modified ${modifiedCount} files.`);
