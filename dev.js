// Remove tsx-injected relative __dirname/__filename so packages like vite-plugin-pwa resolve correctly
delete globalThis.__dirname;
delete globalThis.__filename;

await import("./server.ts");


