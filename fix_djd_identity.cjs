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

const files = walk('./src').concat(walk('./server'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Revert AI Name to MaIA
  content = content.replace(/a Lia/g, 'a MaIA');
  content = content.replace(/Você é a Lia/g, 'Você é a MaIA');
  content = content.replace(/Lia, a inteligência/g, 'MaIA, a inteligência');
  content = content.replace(/Sou a Lia/g, 'Sou a MaIA');
  content = content.replace(/Sou a Assistente da DJD/g, 'Sou a MaIA');
  content = content.replace(/a Assistente da DJD/g, 'a MaIA');
  content = content.replace(/assistente virtual do seu provedor/g, 'assistente virtual do seu provedor');

  // 2. Fix ConfigContext defaults
  if (file.includes('ConfigContext.tsx')) {
    content = content.replace(/DJD Telecomunicações e Conectividade Ltda/g, 'D.J.D. TELECOM LTDA');
    content = content.replace(/18\.345\.678\/0001-90/g, '36.954.827/0001-81');
    content = content.replace(/112\.456\.789\.001/g, 'ISENTO');
    content = content.replace(/São Paulo - SP/g, 'São Luís - MA');
    content = content.replace(/DJD Telecom Fibra/g, 'D.J.D. TELECOM');
  }

  // 3. Fix PortalContratoModal CNPJ
  if (file.includes('PortalContratoModal.tsx')) {
    content = content.replace(/18\.293\.401\/0001-99/g, '36.954.827/0001-81');
    // Also append the real address here if we can find it
    content = content.replace(/Ato de Autorização ANATEL/g, 'Avenida Mal. Castelo Branco, 148, Sala 207, São Francisco, São Luís - MA. Ato de Autorização ANATEL');
  }

  // 4. Inject company context into promptRaiz
  if (file.includes('gemini.ts') || file.includes('gemini_routes.ts')) {
    const contextStr = ' Os dados oficiais da empresa são: Razão Social: D.J.D. TELECOM LTDA, CNPJ: 36.954.827/0001-81, Endereço: Av. Mal. Castelo Branco, 148, Sala 207, São Francisco, São Luís - MA, CEP: 65076-090.';
    // avoid double injection
    if (!content.includes('36.954.827/0001-81')) {
      content = content.replace(/(Fale como um ser humano super simpático e empático, nunca como um robô\.)/g, `$1${contextStr}`);
    }
  }

  // 5. Landing Page
  if (file.includes('Template1.tsx')) {
    content = content.replace(/Rua Fictícia, 123 - Centro/g, 'Av. Mal. Castelo Branco, 148, Sala 207 - São Francisco, São Luís - MA');
    content = content.replace(/São Paulo, SP - 01000-000/g, 'CEP: 65076-090');
    content = content.replace(/18\.345\.678\/0001-90/g, '36.954.827/0001-81');
    content = content.replace(/DJD Telecomunicações e Conectividade Ltda/g, 'D.J.D. TELECOM LTDA');
  }

  // 6. SuperAdmin
  if (file.includes('SuperAdmin.tsx')) {
     content = content.replace(/18\.345\.678\/0001-90/g, '36.954.827/0001-81');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated file:', file);
  }
});
