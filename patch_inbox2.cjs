const fs = require('fs');

let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

code = code.replace(
  /if \(data\.sucesso\) \{/g,
  'if (data.success || data.sucesso) {'
);

fs.writeFileSync('src/pages/Inbox.tsx', code, 'utf8');
console.log('Inbox.tsx handoff response check patched');
