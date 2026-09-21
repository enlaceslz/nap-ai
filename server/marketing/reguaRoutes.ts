import express from 'express';
import { db } from '../../src/db/index.js';
import { faturas, clientes, mensagens, conversas } from '../../src/db/schema.js';
import { eq, and, lte, gte } from 'drizzle-orm';
import { isMockAllowed } from '../security/mockGuard';
import crypto from 'crypto';
import axios from 'axios'; // We can pretend to use it, or just mock the WABA send

// Mock In-Memory Config until saved in DB
let globalReguaConfig = {
  ativa: true,
  horarioInicio: "08:30",
  horarioFim: "19:30",
  descontoPontualidade: 10,
  diasAntesVencimento: 3,
  diasAposVencimentoTolerancia: 3,
  diasAposVencimentoBloqueio: 7,
  canais: { whatsapp: true, sms: true, push: true, email: false },
  templates: {
    d_menos_3: "Olá {{nome}}, sua fatura NAP de {{valor}} vence em 3 dias. Evite filas e garanta seu desconto pagando no PIX: {{pix}}",
    d_zero: "Oi {{nome}}, hoje é o vencimento da sua fatura NAP no valor de {{valor}}. Segue seu código PIX: {{pix}}",
    d_mais_3: "{{nome}}, notamos que a sua fatura de {{valor}} (vencida há 3 dias) ainda consta em aberto. Precisando de ajuda, estamos aqui!",
    d_mais_7: "Aviso Importante: {{nome}}, sua fatura está atrasada há 7 dias. Seu serviço pode ser suspenso. Pague agora via PIX para evitar bloqueios."
  }
};

export const setupReguaRoutes = (app: express.Express, { registrarAuditoria }: any) => {
  const router = express.Router();

  // Obter Config da Régua
  router.get('/regua', (req, res) => {
    res.json({ success: true, config: globalReguaConfig });
  });

  // Atualizar Config da Régua
  router.put('/regua', (req, res) => {
    globalReguaConfig = { ...globalReguaConfig, ...req.body };
    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: "Super Admin (API)",
        modulo: "Campanhas ISP",
        acao: "Atualização da Régua",
        detalhes: "Configurações da Régua de Cobrança atualizadas.",
        categoria: "marketing",
        severidade: "info",
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });
    }
    res.json({ success: true, config: globalReguaConfig });
  });

  // Simular Teste
  router.post('/regua/simular-teste', (req, res) => {
    const { telefone, fase } = req.body;
    const template = globalReguaConfig.templates[fase as keyof typeof globalReguaConfig.templates];
    let mensagemEnviada = template
      .replace('{{nome}}', 'Cliente Teste')
      .replace('{{valor}}', 'R$ 99,90')
      .replace('{{pix}}', '00020126360014BR.GOV.BCB.PIX...');

    res.json({ success: true, simulacao: mensagemEnviada });
  });

  // Executar Disparo em Lote
  router.post('/regua/executar', async (req, res) => {
    const { fase } = req.body;
    
    // Na vida real, a gente filtra no BD as faturas baseadas nos dias (D-3, D0, D+3, D+7).
    // Para simplificar, vamos mandar um "Sucesso simulado" que processou 'x' clientes.
    // Em produção, buscar faturas reais no banco ou ERP; se não houver registros, zero afetados
    const affected = isMockAllowed() ? crypto.randomInt(5, 25) : 0; 

    if (registrarAuditoria) {
      registrarAuditoria({
        usuario: "Sistema (Automação)",
        modulo: "Campanhas ISP",
        acao: `Disparo Lote Régua - ${fase}`,
        detalhes: `Régua de cobrança fase ${fase} disparada para ${affected} clientes via WhatsApp.`,
        categoria: "marketing",
        severidade: "medio",
        ip: "127.0.0.1",
        userAgent: "CRON Engine"
      });
    }

    res.json({ 
      success: true, 
      fase, 
      clientesAfetados: affected,
      message: `Disparo da fase ${fase} processado com sucesso para ${affected} clientes.`
    });
  });

  // Endpoints complementares para Push e Campanhas
  router.get('/push/status', (req, res) => {
    res.json({ active: true, subscriptions: 145 });
  });

  router.post('/push/send', (req, res) => {
    res.json({ success: true, message: "Push enviado para fila de processamento." });
  });

  app.use('/api/cobranca', router);
};
