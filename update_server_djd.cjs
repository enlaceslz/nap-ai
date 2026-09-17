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
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./server');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/NAP Telecom Fibra/g, 'DJD Telecom');
  content = content.replace(/NAP Telecom/g, 'DJD Telecom');
  content = content.replace(/naptelecom/g, 'djdtelecom');
  content = content.replace(/Provedor Exemplo/gi, 'DJD Telecom');
  content = content.replace(/Seu Provedor/gi, 'DJD Telecom');
  content = content.replace(/provedor NAP/g, 'provedor DJD Telecom');
  content = content.replace(/provedor NAP/gi, 'provedor DJD Telecom');
  content = content.replace(/meuprovedor\.com\.br/g, 'djdtelecom.com.br');
  content = content.replace(/MaIA/g, 'Lia'); // "Lia" is a good generic name, or let's use "Assistente da DJD"
  content = content.replace(/a MaIa/g, 'a Assistente da DJD');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
