const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

// Colors replacement
code = code.replace(/bg-\[\#0b0f19\]/g, 'bg-slate-50');
code = code.replace(/bg-\[\#0d1321\]/g, 'bg-white');
code = code.replace(/bg-\[\#101726\]/g, 'bg-white');
code = code.replace(/bg-\[\#1a2333\]/g, 'bg-slate-50');
code = code.replace(/bg-\[\#1a1c33\]/g, 'bg-white'); // DynamicAISuggestion bg

code = code.replace(/border-slate-800\/60|border-slate-800\/40|border-slate-700\/50/g, 'border-slate-200');
code = code.replace(/border-indigo-500\/30|border-indigo-500\/20/g, 'border-blue-200');

code = code.replace(/text-slate-200/g, 'text-slate-900');
code = code.replace(/text-slate-300|text-slate-400|text-white/g, 'text-slate-600');
code = code.replace(/font-bold text-white|font-bold text-slate-200/g, 'font-bold text-slate-900');

// Primary colors
code = code.replace(/indigo-400/g, 'blue-600');
code = code.replace(/indigo-500/g, 'blue-600');
code = code.replace(/indigo-600/g, 'blue-700');
code = code.replace(/indigo-900/g, 'blue-100');
code = code.replace(/indigo-100/g, 'blue-800');
code = code.replace(/indigo-200/g, 'blue-700');
code = code.replace(/indigo-300/g, 'blue-600');

// Semantic overrides
code = code.replace(/bg-red-500\/10 text-red-400 border border-red-500\/20/g, 'bg-red-50 text-red-700 border border-red-200');
code = code.replace(/bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/20/g, 'bg-emerald-50 text-emerald-700 border border-emerald-200');
code = code.replace(/bg-emerald-500\/10 hover:bg-emerald-500\/20/g, 'bg-emerald-50 hover:bg-emerald-100');
code = code.replace(/bg-amber-500\/10 hover:bg-amber-500\/20/g, 'bg-amber-50 hover:bg-amber-100');
code = code.replace(/text-amber-400/g, 'text-amber-700');
code = code.replace(/border-amber-500\/20/g, 'border-amber-200');

code = code.replace(/bg-slate-800\/50 hover:bg-slate-800/g, 'bg-slate-100 hover:bg-slate-200');
code = code.replace(/text-emerald-400/g, 'text-emerald-600');
code = code.replace(/text-emerald-500/g, 'text-emerald-600');

code = code.replace(/text-white/g, 'text-white'); // some text-white inside buttons need to stay white

// Chat bubble specific
code = code.replace(/msg\.autor_tipo === 'cliente' \? 'bg-slate-50 border border-slate-200 text-slate-900/g, "msg.autor_tipo === 'cliente' ? 'bg-white border border-slate-200 text-slate-700");
code = code.replace(/bg-gradient-to-br from-blue-100\/40 to-purple-900\/40/g, 'bg-blue-50');
code = code.replace(/from-\[\#101726\]/g, 'from-white');

fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log('done');
