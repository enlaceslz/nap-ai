import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix /api/ia/chat syntax error
# Find the start of the block: `  // Mock 9router AI Gateway Abstraction using Gemini SDK`
# Find the end of the block: `  // --- Processamento de Voz & Análise em Tempo Real (Asterisk/FreePBX) com Gemini API ---`

start_marker = '  // Mock 9router AI Gateway Abstraction using Gemini SDK'
end_marker = '  // --- Processamento de Voz & Análise em Tempo Real (Asterisk/FreePBX) com Gemini API ---'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_chat_block = """  // Mock 9router AI Gateway Abstraction using Gemini SDK
  app.post("/api/ia/chat", async (req, res) => {
    const { mensagem, vertical } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ erro: "Chave da API Gemini não configurada no servidor." });
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      let systemInstruction = "";
      let bookstackContext = "";
      if (vertical === "suporte") {
        bookstackContext = "[RAG BookStack]: Artigo ID #401 - Resolução de ONU com LOS Vermelho: Instruir cliente a verificar se o cabo óptico está dobrado ou rompido.";
        systemInstruction = (systemConfig.ia?.promptSuporte || "Você é um assistente técnico do NAP.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;
      } else if (vertical === "vendas") {
        bookstackContext = "[RAG BookStack]: Planos atuais: 500MB por R$99,90, 700MB por R$119,90.";
        systemInstruction = (systemConfig.ia?.promptVendas || "Você é um consultor comercial.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;
      } else {
        bookstackContext = "[RAG BookStack]: Regras: Faturas atrasadas em 15 dias reduzem banda. PIX baixa na hora, boleto em 1 dia útil.";
        systemInstruction = (systemConfig.ia?.promptCobranca || "Você atua no setor financeiro.") + "\\n\\n[Base de Conhecimento]: " + bookstackContext;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: mensagem,
        config: { systemInstruction }
      });
      
      res.json({
        resposta: response.text,
        modelo: "gemini-2.5-flash (Integração Direta BookStack)",
        tokens: response.usageMetadata?.totalTokenCount || 0
      });
    } catch (error: any) {
      console.error("Erro no /api/ia/chat:", error);
      res.status(500).json({ erro: "Erro ao comunicar com a IA", detalhes: error.message });
    }
  });

"""
    content = content[:start_idx] + new_chat_block + content[end_idx:]
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Fixed syntax error")
else:
    print("Markers not found")

