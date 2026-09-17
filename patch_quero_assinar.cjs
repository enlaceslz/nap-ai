const fs = require('fs');
let text = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');
text = text.replace(
  /\.webchat-toggle-btn/g,
  '.webchat-widget-toggle'
);
fs.writeFileSync('src/pages/PortalLogin.tsx', text, 'utf8');
console.log('Fixed PortalLogin.tsx');
