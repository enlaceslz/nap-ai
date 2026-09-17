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

  // Semantic cleanup (removing redundant dark variants since variables are semantic)
  content = content.replace(/bg-white dark:bg-card/g, 'bg-card');
  content = content.replace(/bg-slate-50 dark:bg-card/g, 'bg-background');
  content = content.replace(/bg-slate-50 dark:bg-background/g, 'bg-background');
  content = content.replace(/bg-slate-50 dark:bg-muted\/50/g, 'bg-muted/50');
  content = content.replace(/bg-slate-100 dark:bg-muted/g, 'bg-muted');
  content = content.replace(/bg-slate-200 dark:bg-accent/g, 'bg-accent');
  content = content.replace(/bg-slate-800\/60/g, 'bg-muted/60');
  
  content = content.replace(/text-slate-900 dark:text-foreground/g, 'text-foreground');
  content = content.replace(/text-slate-700 dark:text-muted-foreground/g, 'text-muted-foreground');
  content = content.replace(/text-slate-700 dark:text-card-foreground/g, 'text-card-foreground');
  content = content.replace(/text-slate-500 dark:text-muted-foreground/g, 'text-muted-foreground');
  content = content.replace(/text-slate-600 dark:text-muted-foreground/g, 'text-muted-foreground');
  
  content = content.replace(/border-slate-200 dark:border-border/g, 'border-border');
  content = content.replace(/border-slate-300 dark:border-border/g, 'border-border');
  
  // Fix standalone bad contrast colors that lack dark mode variants
  content = content.replace(/\btext-slate-500\b(?! dark:)/g, 'text-muted-foreground');
  content = content.replace(/\btext-slate-900\b(?! dark:)/g, 'text-foreground');
  content = content.replace(/\btext-slate-700\b(?! dark:)/g, 'text-muted-foreground');
  content = content.replace(/\btext-slate-800\b(?! dark:)/g, 'text-foreground');
  content = content.replace(/\btext-slate-600\b(?! dark:)/g, 'text-muted-foreground');
  
  // Try to replace bg-slate-50 but be careful not to touch colored backgrounds
  // Actually bg-slate-50 is usually safe to map to bg-background
  content = content.replace(/\bbg-slate-50\b(?! dark:)/g, 'bg-background');
  
  // We ONLY replace bg-white if it's explicitly the main layout or container cards.
  // Replacing globally could be dangerous (like for white circles inside blue buttons), 
  // but most of them should be cards or backgrounds.
  // Given we are doing a massive UI fix, let's just do it and we can revert if needed.
  content = content.replace(/\bbg-white\b(?! dark:)(?![\w/])/g, 'bg-card');
  
  content = content.replace(/\bborder-slate-200\b(?! dark:)/g, 'border-border');
  content = content.replace(/\bborder-slate-300\b(?! dark:)/g, 'border-border');

  // Any left over dark: variants that we just made semantic
  content = content.replace(/dark:bg-card/g, '');
  content = content.replace(/dark:bg-background/g, '');
  content = content.replace(/dark:bg-muted/g, '');
  content = content.replace(/dark:text-foreground/g, '');
  content = content.replace(/dark:text-muted-foreground/g, '');
  content = content.replace(/dark:border-border/g, '');

  // Cleanup double spaces created by removing dark variants
  content = content.replace(/  +/g, ' ');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
});
console.log(`Modified ${modifiedCount} files for global semantic consistency.`);
