const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

if (!code.endsWith('      )}\n    </div>\n  );\n}\n')) {
   // Maybe it's missing a div?
}

// Let's count the divs roughly
let lines = code.split('\n');
console.log("File length:", lines.length);
