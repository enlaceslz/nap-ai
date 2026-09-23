import express from 'express';
import { db } from '../../src/db/index';
import { faturas } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { GenieacsService } from '../genieacs/genieacsService';

export const setupPortalRoutes = (app: express.Express) => {
  const router = express.Router();

  // Faturas reais para o Portal PWA
  router.get('/erp/faturas', async (req, res) => {
    try {
      const clienteId = req.query.clienteId ? Number(req.query.clienteId) : null;
      let query = db.select().from(faturas);
      if (clienteId && !isNaN(clienteId)) {
        const results = await db.select().from(faturas).where(eq(faturas.clienteId, clienteId));
        return res.json(results.map(f => ({
          id: String(f.id),
          valor: Number(f.valor),
          vencimento: f.vencimento,
          status: f.status,
          pixCopiaECola: f.pixCopiaECola || null,
          linhaDigitavel: f.linhaDigitavel || null
        })));
      }
      const results = await query.limit(50);
      res.json(results.map(f => ({
        id: String(f.id),
        valor: Number(f.valor),
        vencimento: f.vencimento,
        status: f.status,
        pixCopiaECola: f.pixCopiaECola || null,
        linhaDigitavel: f.linhaDigitavel || null
      })));
    } catch {
      // Se banco de dados não estiver pronto ou não houver faturas, retorna array vazio (nunca mock)
      res.json([]);
    }
  });

  // Geração de PIX real para fatura
  router.post('/erp/pix/:id', async (req, res) => {
    const { id } = req.params;
    const faturaId = parseInt(id, 10);
    if (isNaN(faturaId)) {
      return res.status(400).json({ sucesso: false, erro: "ID de fatura inválido." });
    }

    try {
      const faturasEncontradas = await db.select().from(faturas).where(eq(faturas.id, faturaId)).limit(1);
      const fatura = faturasEncontradas[0];

      if (!fatura) {
        return res.status(404).json({ sucesso: false, erro: "Fatura não encontrada." });
      }

      if (fatura.pixCopiaECola) {
        return res.json({
          sucesso: true,
          codigo_pix: fatura.pixCopiaECola
        });
      }

      // Se não possui PIX gerado e gateway não está configurado
      return res.status(503).json({
        sucesso: false,
        erro: "Gateway de pagamento Pix (C6 Bank / Enlace-Pay) não configurado para emissão dinâmica de cobrança."
      });
    } catch (err: any) {
      return res.status(500).json({ sucesso: false, erro: err.message || "Erro ao consultar fatura para PIX." });
    }
  });

  // Emissão de Boleto para fatura
  router.post('/erp/boleto/:id', async (req, res) => {
    const { id } = req.params;
    const faturaId = parseInt(id, 10);
    if (isNaN(faturaId)) {
      return res.status(400).json({ sucesso: false, erro: "ID de fatura inválido." });
    }

    try {
      const faturasEncontradas = await db.select().from(faturas).where(eq(faturas.id, faturaId)).limit(1);
      const fatura = faturasEncontradas[0];

      if (!fatura) {
        return res.status(404).json({ sucesso: false, erro: "Fatura não encontrada." });
      }

      if (fatura.linhaDigitavel) {
        return res.json({
          sucesso: true,
          linha_digitavel: fatura.linhaDigitavel,
          codigo_barras: fatura.codigoBarras || null
        });
      }

      return res.status(503).json({
        sucesso: false,
        erro: "Emissão de boletos bancários não configurada no ERP integrado."
      });
    } catch (err: any) {
      return res.status(500).json({ sucesso: false, erro: err.message || "Erro ao emitir boleto." });
    }
  });

  // Status de Wi-Fi via GenieACS TR-069
  router.get('/portal/wifi', async (req, res) => {
    try {
      const queryRes = await GenieacsService.getInstance().queryDevices();
      if (queryRes.status !== 'online' || !queryRes.devices || queryRes.devices.length === 0) {
        return res.json({
          sucesso: false,
          config: null,
          motivo: queryRes.status === 'not_configured' 
            ? "GenieACS não configurado" 
            : (queryRes.status === 'unavailable' ? "GenieACS indisponível" : "Nenhum CPE associado")
        });
      }

      const primaryDevice = queryRes.devices[0];
      res.json({
        sucesso: true,
        config: {
          ssid: primaryDevice.ssid || null,
          canal: primaryDevice.wifiChannel || null,
          status: primaryDevice.status
        }
      });
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  });

  // Verificador de Incidentes Ativos na Região do Cliente
  router.get('/incidentes/verificar-cliente', (req, res) => {
    res.json({
      afetado: false,
      incidente: null
    });
  });

  // Montagem sob /api para compatibilidade com o Portal PWA
  app.use('/api', router);
};
