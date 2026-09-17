const fs = require('fs');
let text = fs.readFileSync('src/components/OperatorPwaControls.tsx', 'utf8');

// The line is: Disparo de teste "{typeof testSent === \'string\' ? testSent.toUpperCase() : \'\'}" emitido com sucesso!
// It should be: Disparo de teste "{typeof testSent === 'string' ? testSent.toUpperCase() : ''}" emitido com sucesso!

text = text.replace(
  /\"\{typeof testSent === \\'string\\' \? testSent\.toUpperCase\(\) : \\'\\'\}\"/g,
  '"{typeof testSent === \\'string\\' ? testSent.toUpperCase() : \\'\\'}"'
);

// Actually, I'll just restore and rewrite cleanly.
text = text.replace(/Disparo de teste "{typeof testSent === .* emitido com sucesso!/g, 'Disparo de teste "{typeof testSent === \\'string\\' ? testSent.toUpperCase() : \\'\\'}" emitido com sucesso!');

fs.writeFileSync('src/components/OperatorPwaControls.tsx', text, 'utf8');
