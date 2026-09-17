const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const regex = /export default app;/;

const replacement = `// export default app;`;

if(regex.test(text)) {
  fs.writeFileSync('server.ts', text.replace(regex, replacement));
  console.log("Success: Commented out export in server.ts");
} else {
  console.log("Regex failed to match export");
}
