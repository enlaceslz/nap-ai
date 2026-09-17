const fs = require('fs');
let code = fs.readFileSync('src/components/WebchatWidget.tsx', 'utf8');

const hook = `onClick={() => setIsOpen(true)}
          className="bg-blue-600`;

const inject = `onClick={() => setIsOpen(true)}
          className="webchat-toggle-btn bg-blue-600`;

code = code.replace(hook, inject);
fs.writeFileSync('src/components/WebchatWidget.tsx', code);
console.log("WebchatWidget patched");
