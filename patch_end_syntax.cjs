const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

text = text.replace(/export default app;[\s\n]*$/, '');

// Add missing braces based on typical express file endings if needed. Let's just output the end block
console.log(text.slice(-500));
