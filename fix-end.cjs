const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The end of the file looks like:
//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }
// startServer();

code = code.replace(/if \(process\.env\.NODE_ENV !== "production"\) \{\s*\/\/ Wait until vite is imported\s*while \(!createViteServer\) \{\s*await new Promise\(\(resolve\) => setTimeout\(resolve, 100\)\);\s*\}\s*const vite = await createViteServer\(\{\s*server: \{ middlewareMode: true \},\s*appType: "spa",\s*\}\);\s*app\.use\(vite\.middlewares\);\s*\} else \{\s*\/\/ Production: serve static files from dist\/\s*const distPath = path\.join\(process\.cwd\(\), "dist"\);\s*app\.use\(express\.static\(distPath\)\);\s*\/\/ SPA Fallback\s*app\.get\("\*", \(req, res\) => \{\s*res\.sendFile\(path\.join\(distPath, "index\.html"\)\);\s*\}\);\s*\}\s*app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\s*console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\s*\}\);\s*\}\s*startServer\(\);/,
`if (!process.env.VERCEL) {
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(async (vite) => {
      const viteServer = await vite.createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(viteServer.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(\`Server running on http://localhost:\${PORT}\`);
      });
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Server running on http://localhost:\${PORT}\`);
    });
  }
}

export default app;`);

fs.writeFileSync('server.ts', code);
