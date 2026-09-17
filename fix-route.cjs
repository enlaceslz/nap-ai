const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBlock = `      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: { systemInstruction, tools, temperature: 0.2 }
        });
        responseText = response.text || "";
        tokens += response.usageMetadata?.totalTokenCount || 50;
      }
      const endTime = Date.now();
      apiMetrics.total_tokens += tokens;

      res.json({
        resposta: responseText,
        tool_executada: executedTool,
        modelo: "gemini-2.5-flash (Integração SGP Tool Calling)",
        tokens_consumidos: tokens,
        tempo_execucao_ms: endTime - startTime
      });
    } catch (error) {
      console.error("Erro no Agente Gemini:", error);
      res.status(500).json({ erro: "Erro ao executar o Agente Gemini", detalhes: error.message });
    }
  });`;

const correctBlock = `      const response = await ai.models.generateContent({
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
  });`;

code = code.replace(oldBlock, correctBlock);
fs.writeFileSync('server.ts', code);
