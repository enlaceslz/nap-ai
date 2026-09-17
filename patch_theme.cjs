const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const themeBlock = `
@theme {
  --color-slate-950: #0b0f19;
  --color-slate-900: #101726;
  --color-slate-800: #131c2d;
  --color-slate-700: #1c283f;
}
`;

if (!css.includes('--color-slate-950: #0b0f19')) {
    css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + themeBlock);
    fs.writeFileSync('src/index.css', css, 'utf8');
    console.log('Theme patched.');
} else {
    console.log('Theme already patched.');
}
