import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Remove dynamic import of vite
code = code.replace(/\/\/ We import createViteServer dynamically if not in production[\s\S]*?let createViteServer: any;\s*if \(!process\.env\.VERCEL && process\.env\.NODE_ENV !== "production"\) \{\s*import\("vite"\)\.then\(\(vite\) => \{\s*createViteServer = vite\.createServer;\s*\}\);\s*\}/, "");

// Replace bottom block
code = code.replace(/if \(!process\.env\.VERCEL\) \{\s*if \(!process\.env\.VERCEL && process\.env\.NODE_ENV !== "production"\) \{\s*import\("vite"\)\.then\(async \(vite\) => \{\s*const viteServer = await vite\.createServer\(\{\s*server: \{ middlewareMode: true \},\s*appType: "spa",\s*\}\);\s*app\.use\(viteServer\.middlewares\);\s*app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\s*console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\s*\}\);\s*\}\);\s*\} else \{\s*const distPath = path\.join\(process\.cwd\(\), "dist"\);\s*app\.use\(express\.static\(distPath\)\);\s*app\.get\("\*", \(req, res\) => \{\s*res\.sendFile\(path\.join\(distPath, "index\.html"\)\);\s*\}\);\s*app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\s*console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\s*\}\);\s*\}\s*\}/, 
`if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Production server running on http://localhost:\${PORT}\`);
  });
}`);

fs.writeFileSync('server.ts', code);
