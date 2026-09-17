const fs = require('fs');
console.log('--- Final RTM Build Verification ---');
const requiredFiles = [
  'server.ts',
  'src/App.tsx',
  'package.json',
  'tsconfig.json',
  'vite.config.ts'
];

requiredFiles.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`[VERIFIED] ${f}`);
  } else {
    console.error(`[MISSING] ${f}`);
  }
});
