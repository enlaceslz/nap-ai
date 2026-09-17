const fs = require('fs');
let code = fs.readFileSync('server/agent/toolRegistry.ts', 'utf8');

if (!code.includes("import { ErpFactory }")) {
  code = "import { ErpFactory } from '../integrations/erp/ErpFactory';\n" + code;
  fs.writeFileSync('server/agent/toolRegistry.ts', code);
}

// Now replace the inside of sgp_gerar_pix
const startIdx = code.indexOf('name: "sgp_gerar_pix"');
if (startIdx !== -1) {
  const executeIdx = code.indexOf('execute: async', startIdx);
  const nextToolIdx = code.indexOf('// 2. Tool', executeIdx);
  
  if (executeIdx !== -1 && nextToolIdx !== -1) {
    const originalExecute = code.substring(executeIdx, nextToolIdx);
    const newExecute = `execute: async ({ cpf_cnpj }) => {
    try {
      const erp = ErpFactory.getInstance();
      const cpf = cpf_cnpj || "123.456.789-00";
      const cliente = await erp.buscarClientePorCpf(cpf);
      
      let dados: any = { status: 'cliente_nao_encontrado' };
      let resposta = "Infelizmente não consegui localizar um cliente com este CPF no nosso sistema.";
      
      if (cliente) {
        const faturas = await erp.buscarFaturasEmAberto(cliente.id);
        if (faturas.length > 0) {
          const pix = await erp.gerarPixCopiaECola(faturas[0].id);
          dados = {
            cliente: cliente.nome,
            cpf: cliente.documento,
            fatura_id: faturas[0].id,
            valor: faturas[0].valor,
            vencimento: faturas[0].vencimento,
            status: faturas[0].status,
            pix_copia_cola: pix
          };
          resposta = \`Fatura encontrada no valor de R$ \${dados.valor} com vencimento em \${dados.vencimento}. Código PIX Copia e Cola gerado: \${dados.pix_copia_cola}\`;
        } else {
          dados = { cliente: cliente.nome, faturas_abertas: 0 };
          resposta = \`Verifiquei no sistema e não encontrei nenhuma fatura em aberto para \${cliente.nome}.\`;
        }
      }

      return {
        toolExecutada: "sgp_gerar_pix",
        toolDados: dados,
        respostaGerada: resposta
      };
    } catch (e) {
      return { toolExecutada: "sgp_gerar_pix", toolDados: { error: true }, respostaGerada: "Ocorreu um erro ao consultar o sistema financeiro." };
    }
  }
});\n\n`;
    
    code = code.replace(originalExecute, newExecute);
    fs.writeFileSync('server/agent/toolRegistry.ts', code);
  }
}
