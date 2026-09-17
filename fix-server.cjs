const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const console\.log\("Chamando Gemini API \(2\)\.\.\."\);\s*response = await ai\.models\.generateContent\(\{/g, 'const response = await ai.models.generateContent({');
code = code.replace(/console\.log\("Chamando Gemini API \(1\)\.\.\."\); /g, '');

fs.writeFileSync('server.ts', code);
