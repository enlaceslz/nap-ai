const fs = require('fs');
let code = fs.readFileSync('src/components/PortalLayout.tsx', 'utf8');

code = code.replace(
  "import { useConfig }\nimport { useTheme } from '../contexts/ThemeContext'; from '../contexts/ConfigContext';",
  "import { useConfig } from '../contexts/ConfigContext';\nimport { useTheme } from '../contexts/ThemeContext';"
);
// Also fixing if it was single line without \n
code = code.replace(
  "import { useConfig }import { useTheme } from '../contexts/ThemeContext'; from '../contexts/ConfigContext';",
  "import { useConfig } from '../contexts/ConfigContext';\nimport { useTheme } from '../contexts/ThemeContext';"
);

fs.writeFileSync('src/components/PortalLayout.tsx', code, 'utf8');
console.log('Portal fixed.');
