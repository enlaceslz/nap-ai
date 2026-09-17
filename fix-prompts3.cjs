const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const systemInstruction = `Você é o Agente Autônomo Oficial[\s\S]*?sem enrolação.`;/, "const basePrompt = systemConfig.ia?.promptSuporte || 'Você é o Agente Autônomo Oficial de um Provedor de Internet (ISP) com fibra óptica.';\n      const systemInstruction = `${basePrompt}\\n\\nSeu objetivo é resolver a solicitação do assinante com respostas claras, empáticas e objetivas.\\nVocê possui acesso às seguintes ferramentas de sistema:\\n1. \\'consultar_sgp\\': busca faturas, plano e status do cliente.\\n2. \\'verificar_sinal_onu\\': mede o sinal óptico (-18 a -24 dBm é normal; abaixo de -27 dBm é atenuado).\\n3. \\'gerar_pix_fatura\\': gera o código PIX Copia e Cola para pagamento imediato.\\n4. \\'desbloqueio_48h\\': ativa o desbloqueio temporário em confiança.\\n\\nContexto do cliente atual: ${JSON.stringify(clientContext || { plano: 'Fibra 500MB', status: 'ativo' })}.`;");

fs.writeFileSync('server.ts', code);
