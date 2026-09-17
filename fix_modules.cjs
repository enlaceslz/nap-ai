const fs = require('fs');
const files = [
  'src/pages/admin/ipam/IpamDashboard.tsx',
  'src/pages/admin/helpdesk/HelpDeskDashboard.tsx',
  'src/pages/admin/relatorios/HistoricoConversas.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Semantic cleanup (removing redundant dark variants since variables are semantic)
  content = content.replace(/bg-white dark:bg-card/g, 'bg-card');
  content = content.replace(/bg-slate-50 dark:bg-card/g, 'bg-background');
  content = content.replace(/bg-slate-50 dark:bg-background/g, 'bg-background');
  content = content.replace(/bg-slate-50 dark:bg-muted\/50/g, 'bg-muted/50');
  content = content.replace(/bg-slate-100 dark:bg-muted/g, 'bg-muted');
  content = content.replace(/bg-slate-200 dark:bg-accent/g, 'bg-accent');
  
  content = content.replace(/text-slate-900 dark:text-foreground/g, 'text-foreground');
  content = content.replace(/text-slate-700 dark:text-muted-foreground/g, 'text-muted-foreground');
  content = content.replace(/text-slate-700 dark:text-card-foreground/g, 'text-card-foreground');
  content = content.replace(/text-slate-500 dark:text-muted-foreground/g, 'text-muted-foreground');
  
  content = content.replace(/border-slate-200 dark:border-border/g, 'border-border');
  
  // Fix standalone bad contrast colors that lack dark mode variants
  content = content.replace(/\btext-slate-500\b(?! dark:)/g, 'text-muted-foreground');
  content = content.replace(/\btext-slate-900\b(?! dark:)/g, 'text-foreground');
  content = content.replace(/\btext-slate-700\b(?! dark:)/g, 'text-muted-foreground');
  content = content.replace(/\bbg-slate-50\b(?! dark:)/g, 'bg-background');
  content = content.replace(/\bbg-white\b(?! dark:)/g, 'bg-card'); // Be careful, but in these main components it's fine
  content = content.replace(/\bborder-slate-200\b(?! dark:)/g, 'border-border');

  // Any left over dark: variants that we just made semantic
  content = content.replace(/dark:bg-card/g, '');
  content = content.replace(/dark:bg-background/g, '');
  content = content.replace(/dark:bg-muted/g, '');
  content = content.replace(/dark:text-foreground/g, '');
  content = content.replace(/dark:text-muted-foreground/g, '');
  content = content.replace(/dark:border-border/g, '');

  // Cleanup double spaces created by removing dark variants
  content = content.replace(/  +/g, ' ');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
