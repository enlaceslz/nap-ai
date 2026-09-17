const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

if(!text.endsWith('export default app;\n') && !text.endsWith('export default app;')) {
  text += '\nexport default app;\n';
  fs.writeFileSync('server.ts', text);
  console.log("Added export default app;");
}
