const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

const hook = `<aside className="absolute right-0 top-16 bottom-0 z-40 lg:relative lg:top-0 lg:z-auto w-80 lg:w-96 border-l border-white/10 bg-slate-900 overflow-y-auto p-4 space-y-4 shrink-0 animate-in slide-in-from-right-3 duration-200 shadow-2xl lg:shadow-none">`;
const inject = `<aside className="absolute right-0 top-0 bottom-0 z-40 lg:relative lg:top-0 lg:z-auto w-80 lg:w-96 border-l border-white/10 bg-slate-900 overflow-y-auto p-4 space-y-4 shrink-0 animate-in slide-in-from-right-3 duration-200 shadow-2xl lg:shadow-none">`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log("Inbox drawer top-0 patched");
