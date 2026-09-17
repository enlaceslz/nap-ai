const fs = require('fs');
let text = fs.readFileSync('src/components/OperatorPwaControls.tsx', 'utf8');

const regex = /Disparo de teste "([^"]+)" emitido com sucesso!/g;
text = text.replace(regex, 'Disparo de teste "{typeof testSent === \'string\' ? testSent.toUpperCase() : \'\'}" emitido com sucesso!');

fs.writeFileSync('src/components/OperatorPwaControls.tsx', text, 'utf8');
