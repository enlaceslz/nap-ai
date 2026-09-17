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

  content = content.replace(/IA do NAP/g, 'IA da DJD Telecom');
  content = content.replace(/NAP Fibra/g, 'DJD Telecom');
  content = content.replace(/ecossistema NAP/g, 'ecossistema DJD Telecom');
  content = content.replace(/NAP-/g, 'DJD-');
  content = content.replace(/NAP Omni/g, 'DJD Omni');
  content = content.replace(/NAP WACRM/g, 'DJD Telecom');
  content = content.replace(/NAP/g, 'DJD');
  
  // Revert back local storage keys to not break functionality
  content = content.replace(/DJD_theme/g, 'nap_theme');
  content = content.replace(/@DJD_client_auth/g, '@nap_client_auth');
  content = content.replace(/DJD_desbloqueio_/g, 'nap_desbloqueio_');
  content = content.replace(/DJD_auth/g, 'nap_auth');
  content = content.replace(/DJD_sidebar_collapsed/g, 'nap_sidebar_collapsed');
  content = content.replace(/DJD_op_push_categories/g, 'nap_op_push_categories');
  content = content.replace(/DJD_session_id/g, 'nap_session_id');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
