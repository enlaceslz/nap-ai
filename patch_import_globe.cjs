const fs = require('fs');
let code = fs.readFileSync('src/pages/MapaRede.tsx', 'utf8');

// The previous attempt failed because 'Search' might not be on the same line or in the expected format.
// Let's do a more robust replace for the lucide-react import.
const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/;
const match = code.match(importRegex);

if (match && !match[1].includes('Globe')) {
    const newImport = match[0].replace('}', ', Globe }');
    code = code.replace(match[0], newImport);
    fs.writeFileSync('src/pages/MapaRede.tsx', code, 'utf8');
    console.log('Globe import fixed robustly.');
} else {
    console.log('Globe might already be imported or lucide-react import not found.');
}
