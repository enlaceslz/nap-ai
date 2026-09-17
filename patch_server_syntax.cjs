const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const regex = /import \{ setupGeminiRoutes \} from "\.\/server\/gemini_routes\.js";/;

const replacement = `// import { setupGeminiRoutes } from "./server/gemini_routes.js";`;

if(regex.test(text)) {
  fs.writeFileSync('server.ts', text.replace(regex, replacement));
  console.log("Success: Commented out import in middle of file");
} else {
  console.log("Regex failed to match syntax error");
}
