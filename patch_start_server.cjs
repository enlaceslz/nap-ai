const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

const regex = /  const app = express\(\);\n  const PORT = 3000;/;
const replacement = `const app = express();
const PORT = 3000;`;

if (regex.test(text)) {
  text = text.replace(regex, replacement);
  fs.writeFileSync('server.ts', text);
  console.log("Fixed indentation");
}
