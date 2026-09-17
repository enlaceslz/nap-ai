const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const aiStart = code.indexOf('// --- CÉREBRO DE IA: ENGINE GEMINI COM DYNAMIC TOOL REGISTRY (TELECOM & CALL CENTER) ---');
const aiEnd = code.indexOf('  // Catch-all API 404 handler');

if (aiStart > -1 && aiEnd > -1) {
    const aiCode = code.substring(aiStart, aiEnd);
    
    // Create server/gemini_routes.ts
    const aiFile = `import { agentToolRegistry } from "./agent/toolRegistry.js";
import { processGeminiAgentRun } from "./gemini.js";

export function setupGeminiRoutes(app: any) {
${aiCode}
}
`;
    fs.writeFileSync('server/gemini_routes.ts', aiFile);
    
    // Remove it from server.ts and add setup call
    const newCode = code.substring(0, aiStart) + `
// Gemini AI Routes Setup
import { setupGeminiRoutes } from "./server/gemini_routes.js";
setupGeminiRoutes(app);

` + code.substring(aiEnd);
    
    fs.writeFileSync('server.ts', newCode);
    console.log("Gemini AI refactored successfully.");
} else {
    console.log("Could not find Gemini sections.");
}
