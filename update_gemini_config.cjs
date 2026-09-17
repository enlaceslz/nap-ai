const fs = require('fs');

const file = 'server/gemini.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `// Suporte a múltiplas chaves ou gateways
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL || "https://9router.enlace.slz.br";`;

const replacement = `// Fetch system config to get dynamic API keys from the UI
  let dynamicApiKey = "";
  let dynamicBaseUrl = "";
  let dynamicProvedorGateway = "";

  try {
    const fetch = (await import('node-fetch')).default;
    const configRes = await fetch('http://127.0.0.1:3000/api/configuracoes');
    if (configRes.ok) {
      const config = await configRes.json();
      if (config.ia) {
        dynamicApiKey = config.ia.apiKey;
        dynamicBaseUrl = config.ia.baseUrl;
        dynamicProvedorGateway = config.ia.provedorGateway;
      }
    }
  } catch (e) {
    console.error("Failed to fetch system config in gemini", e.message);
  }

  // Fallback to process.env if UI is not configured
  const apiKey = dynamicApiKey || process.env.GEMINI_API_KEY;
  const baseUrl = dynamicBaseUrl || process.env.GEMINI_BASE_URL || "https://9router.enlace.slz.br";
  const use9Router = dynamicProvedorGateway === "9router" || process.env.GEMINI_USE_9ROUTER === 'true' || process.env.GEMINI_BASE_URL;`;

content = content.replace(target, replacement);

// Also need to replace the if condition
content = content.replace(/if \(process\.env\.GEMINI_USE_9ROUTER === 'true' \|\| process\.env\.GEMINI_BASE_URL\)/g, "if (use9Router)");

fs.writeFileSync(file, content);
console.log('Updated gemini.ts');
