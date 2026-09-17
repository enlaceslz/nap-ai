import express from 'express';

export const setupPortalRoutes = (app: express.Express) => {
  const router = express.Router();

  // ERP Faturas Mock for Portal PWA
  router.get('/erp/faturas', (req, res) => {
    res.json([
      { id: "101", valor: 99.90, vencimento: "2026-10-15", status: "pendente" },
      { id: "100", valor: 99.90, vencimento: "2026-09-15", status: "pago" }
    ]);
  });

  // ERP Pix Generation
  router.post('/erp/pix/:id', (req, res) => {
    res.json({
      sucesso: true,
      codigo_pix: "00020126360014BR.GOV.BCB.PIX011412345678901234520400005303986540510.005802BR5912DJD Telecom6009Sao Paulo62070503***63041D3D"
    });
  });

  // ERP Boleto Generation
  router.post('/erp/boleto/:id', (req, res) => {
    res.json({ sucesso: true, url_pdf: "https://example.com/boleto.pdf" });
  });

  // GenieACS Wifi Configuration status
  router.get('/portal/wifi', (req, res) => {
    res.json({
      sucesso: true,
      config: {
        ssid24: "WIFI_CASA",
        ssid5: "WIFI_CASA_5G",
        status: "online"
      }
    });
  });

  // Zabbix Incident Checker for Bairro (Proactive NOC)
  router.get('/incidentes/verificar-cliente', (req, res) => {
    res.json({
      afetado: false,
      incidente: null
    });
  });

  // Mount API paths under /api directly as requested by Portal
  app.use('/api', router);
};
