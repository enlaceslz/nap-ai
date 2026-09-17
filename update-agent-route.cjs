const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let response = await ai.models.generateContent/, `console.log("Chamando Gemini API (1)..."); let response = await ai.models.generateContent`);
code = code.replace(/response = await ai.models.generateContent\(\{[\s\S]*?temperature: 0.2 \}\n        \}\);/, 
`console.log("Chamando Gemini API (2)...");
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: { systemInstruction, tools, temperature: 0.2 }
        });`);

fs.writeFileSync('server.ts', code);
