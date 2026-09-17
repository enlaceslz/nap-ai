const fs = require('fs');
let text = fs.readFileSync('src/components/OperatorPwaControls.tsx', 'utf8');

text = text.replace(
  '"{testSent.toUpperCase()}"',
  '"{typeof testSent === \\\'string\\\' ? testSent.toUpperCase() : \\\'\\\'}"'
);

fs.writeFileSync('src/components/OperatorPwaControls.tsx', text, 'utf8');
console.log('Fixed OperatorPwaControls.tsx toUpperCase');
