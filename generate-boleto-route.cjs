const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBoletoFallback = "url_pdf: \\`https://sgp.provedormock.com.br/boletos/v2/\\${id}_emitido.pdf\\`";
const newBoletoFallback = "url_pdf: \\`/api/sgp/boleto/mock/\\${id}\\`";

code = code.replace(oldBoletoFallback, newBoletoFallback);

const mockHtmlRoute = `
  app.get("/api/sgp/boleto/mock/:id", (req, res) => {
    const { id } = req.params;
    const html = \`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boleto - \${id}</title>
        <style>
          body { font-family: monospace; background: #e2e8f0; padding: 2rem; display: flex; justify-content: center; }
          .boleto { background: white; padding: 2rem; width: 800px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .header { border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; }
          .bank-code { font-size: 1.5rem; font-weight: bold; border-left: 2px solid #000; border-right: 2px solid #000; padding: 0 1rem; }
          .linha-digitavel { font-size: 1.25rem; font-weight: bold; }
          .row { display: flex; border-bottom: 1px solid #000; }
          .col { flex: 1; padding: 0.5rem; border-right: 1px solid #000; }
          .col:last-child { border-right: none; }
          .label { font-size: 0.65rem; font-weight: bold; margin-bottom: 0.25rem; }
          .value { font-size: 0.85rem; }
          @media print { body { background: white; padding: 0; } .boleto { box-shadow: none; border: none; width: 100%; } }
        </style>
      </head>
      <body>
        <div class="boleto">
          <div class="header">
            <div style="font-weight: bold; font-size: 1.5rem; display: flex; gap: 10px;">
              <span>033-7</span> <!-- Banco -->
            </div>
            <div class="linha-digitavel">03399.87654 32100.000000 12345.678901 1 99990000009990</div>
          </div>
          <div class="row">
            <div class="col" style="flex: 3"><div class="label">Local de Pagamento</div><div class="value">Pagável em qualquer banco até o vencimento</div></div>
            <div class="col"><div class="label">Vencimento</div><div class="value">20/09/2026</div></div>
          </div>
          <div class="row">
            <div class="col" style="flex: 3"><div class="label">Beneficiário</div><div class="value">\${systemConfig?.provedor?.nomeFantasia || 'NAP Telecom'} - \${systemConfig?.provedor?.cnpj || '00.000.000/0001-00'}</div></div>
            <div class="col"><div class="label">Agência / Código Beneficiário</div><div class="value">1234 / 56789-0</div></div>
          </div>
          <div class="row">
            <div class="col"><div class="label">Data do Documento</div><div class="value">10/09/2026</div></div>
            <div class="col"><div class="label">Nº Documento</div><div class="value">\${id}</div></div>
            <div class="col"><div class="label">Espécie Doc.</div><div class="value">RC</div></div>
            <div class="col"><div class="label">Aceite</div><div class="value">N</div></div>
            <div class="col"><div class="label">Data Processamento</div><div class="value">10/09/2026</div></div>
            <div class="col"><div class="label">Nosso Número</div><div class="value">00000000\${id}</div></div>
          </div>
          <div class="row">
            <div class="col" style="flex: 3"><div class="label">Uso do Banco</div><div class="value"></div></div>
            <div class="col"><div class="label">Carteira</div><div class="value">101</div></div>
            <div class="col"><div class="label">Espécie Moeda</div><div class="value">R$</div></div>
            <div class="col"><div class="label">Quantidade Moeda</div><div class="value"></div></div>
            <div class="col"><div class="label">Valor Moeda</div><div class="value"></div></div>
            <div class="col"><div class="label">(=) Valor do Documento</div><div class="value">99,90</div></div>
          </div>
          <div class="row" style="height: 120px;">
            <div class="col" style="flex: 3">
              <div class="label">Instruções (Texto de responsabilidade do beneficiário)</div>
              <div class="value">
                Não receber após o vencimento.<br>
                Após vencimento cobrar multa de 2% e juros de 1% ao mês.<br>
                Sujeito a suspensão dos serviços 15 dias após o vencimento.
              </div>
            </div>
            <div class="col">
              <div style="border-bottom: 1px solid #000; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                <div class="label">(-) Desconto / Abatimento</div>
                <div class="value">&nbsp;</div>
              </div>
              <div style="border-bottom: 1px solid #000; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                <div class="label">(+) Mora / Multa</div>
                <div class="value">&nbsp;</div>
              </div>
              <div>
                <div class="label">(=) Valor Cobrado</div>
                <div class="value">&nbsp;</div>
              </div>
            </div>
          </div>
          <div class="row" style="border-bottom: none; align-items: center; padding-top: 1rem;">
            <div class="col" style="flex: 3; border-right: none;">
              <div class="label">Pagador</div>
              <div class="value">Cliente Demonstrativo NAP - CPF: 000.000.000-00</div>
              <div class="value">Rua Exemplo, 123 - Centro, São Paulo - SP</div>
            </div>
          </div>
          <div style="margin-top: 2rem; border-top: 2px dashed #cbd5e1; padding-top: 2rem; text-align: center;">
            <div style="display: inline-block; width: 100%; max-width: 500px; height: 50px; background: repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 6px, #000 6px, #000 8px, #fff 8px, #fff 11px);"></div>
          </div>
        </div>
        <script>
          // window.print();
        </script>
      </body>
      </html>
    \`;
    res.send(html);
  });
`;

if (!code.includes('/api/sgp/boleto/mock/:id')) {
  code = code.replace('// Generate Boleto PDF (Real ou Mock)', mockHtmlRoute + '\\n  // Generate Boleto PDF (Real ou Mock)');
}

fs.writeFileSync('server.ts', code);
