const fs = require('fs');
const text = fs.readFileSync('server.ts', 'utf8');

const replacement = text.replace(/  if \(!process\.env\.VERCEL && process\.env\.NODE_ENV === "production"\) \{\n  const distPath = path\.join\(process\.cwd\(\), "dist"\);\n  app\.use\(express\.static\(distPath\)\);\n  app\.get\("\*", \(req, res\) => \{\n    res\.sendFile\(path\.join\(distPath, "index\.html"\)\);\n  \}\);\n  app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\n    console\.log\(\`Production server running on http:\/\/localhost:\$\{PORT\}\`\);\n  \}\);\n\}/, 
`  if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Production server running on http://localhost:\${PORT}\`);
    });
  }`);

fs.writeFileSync('server.ts', replacement);
console.log("Fixed brace structure");
