const fs = require('fs');
let text = fs.readFileSync('deploy.sh', 'utf8');

text = text.replace(
  'GEMINI_API_KEY=',
  'TELEGRAM_BOT_TOKEN=\nGEMINI_API_KEY='
);

fs.writeFileSync('deploy.sh', text, 'utf8');
console.log('deploy.sh updated.');
