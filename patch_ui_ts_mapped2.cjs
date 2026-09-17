const fs = require('fs');

let uiText = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');
uiText = uiText.replace(
  /const mappedOrders = orders\.map\(\(o: any\) => \(\{/g,
  "const mappedOrders: OSItem[] = orders.map((o: any) => ({"
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', uiText, 'utf8');
console.log('Fixed enum typing on TecnicoCampo.tsx');
