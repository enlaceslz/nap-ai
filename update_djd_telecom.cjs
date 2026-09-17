const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace default lat/lng from generic (-23.5505, -46.6333 or similar) to São Luís (-2.5297, -44.3028)
  content = content.replace(/-23\.5505/g, '-2.5297');
  content = content.replace(/-46\.6333/g, '-44.3028');

  // Replace generic names
  content = content.replace(/Provedor Exemplo/gi, 'DJD Telecom');
  content = content.replace(/NAP Telecom/gi, 'DJD Telecom');
  content = content.replace(/Meu Provedor/gi, 'DJD Telecom');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
