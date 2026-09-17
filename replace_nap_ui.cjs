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
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.html')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./src').concat(['./index.html']);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/NAP Telecom Fibra/g, 'DJD Telecom');
  content = content.replace(/NAP Telecom/g, 'DJD Telecom');
  content = content.replace(/naptelecom/g, 'djdtelecom');
  content = content.replace(/Provedor NAP/g, 'DJD Telecom');
  content = content.replace(/PROVEDOR NAP/g, 'DJD TELECOM');
  content = content.replace(/Portal NAP/g, 'Portal DJD');
  content = content.replace(/NAP Omni/g, 'DJD Omni');
  content = content.replace(/NAP GIS/g, 'DJD GIS');
  content = content.replace(/<title>NAP WACRM - Núcleo de Atendimento ao Provedor<\/title>/g, '<title>DJD Telecom - CRM Omnichannel</title>');
  content = content.replace(/<meta property="og:title" content="NAP WACRM - Núcleo de Atendimento ao Provedor" \/>/g, '<meta property="og:title" content="DJD Telecom - CRM Omnichannel" />');
  content = content.replace(/NAP Provedor Telecom/g, 'DJD Telecom');
  content = content.replace(/NAP WACRM/g, 'DJD Telecom');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
