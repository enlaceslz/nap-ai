const fs = require('fs');
let code = fs.readFileSync('DEPLOY.md', 'utf8');

if (!code.includes('esbuild server.ts --bundle')) {
  // Let's add the node.js build instruction properly if missing
  code = code.replace(
    /## Compilação e Build da Aplicação\n\n```bash\nnpm run build\n```/,
    `## Compilação e Build da Aplicação (Full-Stack Node.js)\n\nO NAP roda em um formato Express + Vite PWA isolado, o que requer o build do frontend seguido do bundling (esbuild) do backend.\n\n\`\`\`bash\n# 1. Instalar pacotes de produção e desenvolvimento necessários para compilação\nnpm install\n\n# 2. Executar compilação\n# Isso irá compilar o frontend para /dist e empacotar o backend via esbuild para /dist/server.cjs\nnpm run build\n\n# 3. Executar servidor em modo de produção (Daemon)\nnohup node dist/server.cjs > nap.log 2>&1 &\n\`\`\``
  );
  fs.writeFileSync('DEPLOY.md', code);
}
