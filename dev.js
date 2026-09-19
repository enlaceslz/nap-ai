// Remove tsx-injected relative __dirname/__filename so packages like vite-plugin-pwa resolve correctly
delete globalThis.__dirname;
delete globalThis.__filename;

async function startDevServer() {
  const { default: app } = await import("./server.ts");
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev Server running on http://localhost:${PORT}`);
  });
}
startDevServer();

