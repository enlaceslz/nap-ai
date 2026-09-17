const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

code = code.replace(
  'const [isSgpDrawerOpen, setIsSgpDrawerOpen] = useState(true);',
  'const [isSgpDrawerOpen, setIsSgpDrawerOpen] = useState(window.innerWidth >= 1024);'
);

fs.writeFileSync('src/pages/Inbox.tsx', code);
console.log("Inbox drawer state patched");
