const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The WABA logic is between lines 1219 and 1705 roughly.
// We'll search for the headers.
const wabaStart = code.indexOf('// --- WhatsApp Cloud API (WABA) Webhook & Endpoints ---');
const wabaEnd = code.indexOf('// --- GESTÃO DE ESTOQUE, ALMOXARIFADO E FROTA ---');

if (wabaStart > -1 && wabaEnd > -1) {
    const wabaCode = code.substring(wabaStart, wabaEnd);
    
    // Create server/waba.ts
    const wabaFile = `import { db } from "../src/db/index";
import { conversas, mensagens } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

export function setupWabaRoutes(app: any, mockWabaChats: any[], mockWabaMessages: any[]) {
${wabaCode}
}
`;
    fs.writeFileSync('server/waba.ts', wabaFile);
    
    // Remove it from server.ts and add setup call
    const newCode = code.substring(0, wabaStart) + `
// WABA Routes Setup
import { setupWabaRoutes } from "./server/waba";
setupWabaRoutes(app, mockWabaChats, mockWabaMessages);
` + code.substring(wabaEnd);
    
    fs.writeFileSync('server.ts', newCode);
    console.log("WABA refactored successfully.");
} else {
    console.log("Could not find WABA sections.");
}
