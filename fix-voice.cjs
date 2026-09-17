const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldVoiceRouteStart = '  // --- Processamento de Voz & Análise em Tempo Real (Asterisk/FreePBX) com Gemini API ---';
const oldVoiceRouteEnd = '  // Buscar Métricas do Dashboard';

const startIndex = code.indexOf(oldVoiceRouteStart);
const endIndex = code.indexOf(oldVoiceRouteEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find block");
  process.exit(1);
}

const newVoiceRoute = `  // --- Processamento de Voz & Análise em Tempo Real (Asterisk/FreePBX) com Gemini API ---
  app.post("/api/gemini/voice/analyze", async (req, res) => {
    const { 
      audioBase64, 
      mimeType = "audio/webm", 
      transcriptText, 
      speaker = "cliente", 
      callContext 
    } = req.body;

    const startTime = Date.now();

    try {
      if (!process.env.GEMINI_API_KEY) {
        // Fallback inteligente
        const textSample = transcriptText || "Olá, estou ligando porque minha internet fibra está sem sinal.";
        return res.json({
          transcricao: textSample,
          sentimento: "frustrado",
          score_sentimento: -0.7,
          urgencia: "alta",
          topico_principal: "Queda de Conexão",
          pilar_sugerido: "suporte",
          insights_operador: ["Cliente sem acesso"],
          sugestao_resposta: "Compreendo a urgência. Estou verificando seu sinal.",
          modelo: "Simulação Fallback",
          tempo_ms: Date.now() - startTime
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const systemInstruction = \`Você é um analista de qualidade (QA) e copiloto de voz para operadores de telecom.
Analise a transcrição (ou áudio) da fala do cliente em uma ligação telefônica.
Retorne um JSON estrito, sem markdown:
{
  "transcricao": "O texto exato falado",
  "sentimento": "positivo", "neutro", "frustrado", "irritado" ou "satisfeito",
  "score_sentimento": número de -1.0 a 1.0,
  "urgencia": "baixa", "media", "alta" ou "critica",
  "topico_principal": "Descrição curta do assunto (ex: Segunda via, Lentidão)",
  "pilar_sugerido": "suporte", "cobranca" ou "vendas",
  "insights_operador": ["Dica 1 para o atendente", "Dica 2"],
  "sugestao_resposta": "Uma sugestão de script pronto (curta) para o operador ler e responder ao cliente."
}
A fala foi enviada por: \${speaker}
\`;
      
      let promptParts = [];
      if (audioBase64) {
        promptParts.push({ inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } });
      }
      if (transcriptText) {
        promptParts.push({ text: \`Transcrição do \${speaker}: "\${transcriptText}"\` });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: promptParts }],
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      let jsonResult;
      try {
         jsonResult = JSON.parse(response.text);
      } catch (e) {
         jsonResult = { transcricao: transcriptText || "Erro no parse", sentimento: "neutro", score_sentimento: 0, urgencia: "media", topico_principal: "Erro", pilar_sugerido: "suporte" };
      }
      
      jsonResult.tempo_ms = Date.now() - startTime;
      jsonResult.modelo = "gemini-2.5-flash";

      apiMetrics.total_tokens += response.usageMetadata?.totalTokenCount || 0;

      res.json(jsonResult);
    } catch (error) {
      console.error("Erro Voice Gemini:", error);
      res.status(500).json({ erro: error.message });
    }
  });

`;

code = code.substring(0, startIndex) + newVoiceRoute + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
