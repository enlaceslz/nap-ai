const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/**/*.tsx');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /className="[^"]*hover:[^"]*border[^"]*"[^>]*>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!match[0].includes('onClick') && !match[0].includes('href') && !match[0].includes('to=') && !match[0].includes('<button') && !match[0].includes('<a ') && !match[0].includes('<input')) {
      console.log(file + ' : ' + match[0]);
    }
  }
});
