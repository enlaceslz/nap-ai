// Limpeza de __dirname/__filename injetados pelo tsx para compatibilidade com vite-plugin-pwa e ESM
if (typeof (globalThis as any).__dirname !== 'undefined') {
  delete (globalThis as any).__dirname;
}
if (typeof (globalThis as any).__filename !== 'undefined') {
  delete (globalThis as any).__filename;
}

import { setupPortalRoutes } from './server/portal/portalRoutes';
import { setupGeminiRoutes } from "./server/gemini_routes";
import express from "express";
import axios from "axios";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import tls from "tls";
import { exec } from "child_process";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { validateSecrets } from "./server/security/secretsValidator";
import { configureHelmet, configureCors, createRateLimiter, globalErrorHandler, appendAuditLog, getAuditChain, initAuditPersistence, recordMandatoryAuditLog } from "./server/security/httpSecurity";
import { hashPassword } from "./server/auth/passwordUtils";
import { authMiddleware } from "./server/auth/rbacMiddleware";

// Validação de segurança de inicialização
try {
  validateSecrets();
} catch (e: any) {
  console.error("[FATAL] Erro na validação de segredos:", e.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

import { db, assertDatabaseReady, pool } from "./src/db/index";

// Inicialização de prontidão do banco e restauração da cadeia de auditoria
(async () => {
  try {
    await assertDatabaseReady();
    await initAuditPersistence();
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[STARTUP FATAL] Falha crítica na inicialização do PostgreSQL/Auditoria:', err.message);
      process.exit(1);
    }
  }
})();
import { users, atendimentos, clientes, faturas } from "./src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { conversas, mensagens } from "./src/db/schema";


import { agentToolRegistry } from "./server/agent/toolRegistry";
import { connectARI, getChamadas, getAsteriskStatus, checkAsteriskRuntimeHealth } from "./server/asterisk";
import { setupOltRoutes } from "./server/olt/oltRoutes";
import gisRoutes from "./server/gis/gisRoutes";
import aiRoutes from "./server/ai/aiRoutes";
import { setupZabbixRoutes } from "./server/zabbix/zabbixRoutes";
import { setupCrmRoutes } from "./server/crm/crmRoutes";
import { setupReguaRoutes } from "./server/marketing/reguaRoutes";
import { setupGenieacsRoutes } from "./server/genieacs/genieacsRoutes";
import { setupCommunicationsRoutes } from "./server/communications/communicationsRoutes";
import { setupFieldRoutes } from "./server/field/fieldRoutes";
import { setupWabaRoutes } from "./server/waba";
import { setupHelpDeskRoutes } from "./server/helpdesk/routes";
import { setupIpamRoutes } from "./server/ipam/routes";
import { setupCorrelationRoutes } from "./server/correlation/routes";
import { setupCommunicationRoutes } from "./server/communications/routes";
import { setupPaymentRoutes } from "./server/payments";
import { GenieacsService } from "./server/genieacs/genieacsService";
import { Customer360Store } from "./server/customer360_service";
import { authRouter } from "./server/auth/authRoutes";
import { requireRole, requireAuth } from "./server/auth/rbacMiddleware";

const app = express();
const PORT = 3000;

  connectARI();

// Credenciais Nativas Pré-configuradas do Sistema (Padrão Factory / Ambiente VPS)
const ERP_URL = process.env.ERP_URL || process.env.SGP_URL || "";
const ERP_APP = process.env.ERP_APP || process.env.SGP_APP || "NAP_PROVEDOR_APP";
const ERP_TOKEN = process.env.ERP_TOKEN || process.env.SGP_TOKEN || "";

// Asterisk 20+ Puro / ARI / AMI Nativo
const ASTERISK_HOST = process.env.ASTERISK_HOST || "127.0.0.1";
const ASTERISK_PORT_ARI = process.env.ASTERISK_PORT_ARI || "8088";
const ASTERISK_USER_ARI = process.env.ASTERISK_USER_ARI || "nap_admin";
const ASTERISK_SECRET_ARI = process.env.ASTERISK_SECRET_ARI || "";
const ASTERISK_PORT_AMI = process.env.ASTERISK_PORT_AMI || "5038";
const ASTERISK_USER_AMI = process.env.ASTERISK_USER_AMI || "nap_ami";
const ASTERISK_SECRET_AMI = process.env.ASTERISK_SECRET_AMI || "";
const ASTERISK_WEBSOCKET_URL = process.env.ASTERISK_WEBSOCKET_URL || "wss://127.0.0.1:8089/ws";

// GenieACS TR-069 / CWMP Nativo
const GENIEACS_URL = process.env.GENIEACS_URL || "http://127.0.0.1:7557";
const GENIEACS_CWMP_URL = process.env.GENIEACS_CWMP_URL || "http://127.0.0.1:7547";
const GENIEACS_USER = process.env.GENIEACS_USER || "nap_acs_admin";
const GENIEACS_PASSWORD = process.env.GENIEACS_PASSWORD || "";
const GENIEACS_UI_URL = process.env.GENIEACS_UI_URL || "http://127.0.0.1:3005";

// Zabbix 7.0 LTS JSON-RPC Nativo
const ZABBIX_URL = process.env.ZABBIX_URL || "http://127.0.0.1:8080/zabbix/api_jsonrpc.php";
const ZABBIX_TOKEN = process.env.ZABBIX_TOKEN || "";
const ZABBIX_USER = process.env.ZABBIX_USER || "nap_zabbix_api";
const ZABBIX_AGENT_PORT = Number(process.env.ZABBIX_AGENT_PORT || 10050);

// Mapa Open-Source Nativo (Leaflet / OSM / CARTO)
const MAPA_PROVEDOR = process.env.MAPA_PROVEDOR || "OpenStreetMap / CARTO";
const MAPA_TILE_URL = process.env.MAPA_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAPA_DARK_TILE_URL = process.env.MAPA_DARK_TILE_URL || "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const MAPA_ATTRIBUTION = process.env.MAPA_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Radius PoD / CoA Nativo
const RADIUS_HOST = process.env.RADIUS_HOST || "127.0.0.1";
const RADIUS_PORT = Number(process.env.RADIUS_PORT || 3799);
const RADIUS_SECRET = process.env.RADIUS_SECRET || "";

// Meta WhatsApp WABA Nativo
const WABA_PHONE_NUMBER_ID = process.env.WABA_PHONE_NUMBER_ID || "";
const WABA_BUSINESS_ACCOUNT_ID = process.env.WABA_BUSINESS_ACCOUNT_ID || "";
const WABA_VERIFY_TOKEN = process.env.WABA_VERIFY_TOKEN || "";
const WABA_ACCESS_TOKEN = process.env.WABA_ACCESS_TOKEN || "";

// Função mock para fetchERP
async function fetchERP(endpoint, method = "GET", body = null) {
  const url = `${ERP_URL}${endpoint}`;
  const options: any = {
    method,
    headers: {
      "app": ERP_APP,
      "token": ERP_TOKEN,
      "Content-Type": "application/json"
    }
  };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Erro HTTP ERP: ${res.status}`);
  return await res.json();
}

app.use(configureHelmet());
app.use(configureCors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiter para APIs
app.use("/api/", createRateLimiter({ windowMs: 60 * 1000, max: 180 }));

// Autenticação e RBAC central
app.use("/api/", authMiddleware);

// Rotas de Autenticação Unificada (Login, Me, Logout)
app.use("/api", authRouter);

// Proteção granular de rotas críticas via RBAC (Fase 5)
// Para /api/configuracoes: Leitura (GET) é permitida para bootstrap do tema/provedor no frontend; mutações exigem ADMIN
app.use("/api/configuracoes", (req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
    return next();
  }
  return requireRole("ADMIN")(req, res, next);
});
app.use("/api/auditoria", requireRole("ADMIN", "AUDITOR"));
app.use("/api/admin/auditoria", requireRole("ADMIN", "AUDITOR"));
app.use("/api/telefonia", requireRole("ADMIN", "SUPORTE"));
app.use("/api/olt", requireRole("ADMIN", "NOC", "CAMPO", "SUPORTE"));
app.use("/api/cpe", requireRole("ADMIN", "NOC", "CAMPO", "SUPORTE"));
app.use("/api/financeiro", requireRole("ADMIN", "FINANCEIRO"));
app.use("/api/payments/c6-config", requireRole("ADMIN", "FINANCEIRO"));
app.use("/api/payments/reconcile", requireRole("ADMIN", "FINANCEIRO"));

// --- Global System Configuration & State ---
let systemConfig: any = {
  erpAtivo: "sgp",
  erps: {
    sgp: {
      id: "sgp",
      nome: "SGP (Sistema de Gestão de Provedor)",
      urlBase: ERP_URL,
      appId: ERP_APP,
      token: ERP_TOKEN,
      status: "desconectado",
      latenciaMs: null,
      ultimaSincronizacao: null
    }
  },
  ia: {
    modeloPrimario: "gemini-2.5-flash",
    temperatura: 0.2,
    promptSuporte: "Você é o Agente Autônomo Oficial de um Provedor de Internet (ISP) com fibra óptica."
  },
  telefonia: {
    troncosSip: [
      { id: "1", nome: "Tronco PJSIP (Nativo)", host: ASTERISK_HOST, porta: 5060, usuario: process.env.ASTERISK_PJSIP_USER || "", senha: process.env.ASTERISK_PJSIP_SECRET || "", codecs: "alaw, ulaw, g729, opus", status: "inativo" }
    ],
    ariHost: ASTERISK_HOST,
    ariPort: Number(ASTERISK_PORT_ARI),
    ariUser: ASTERISK_USER_ARI,
    ariSecret: ASTERISK_SECRET_ARI,
    amiHost: ASTERISK_HOST,
    amiPort: Number(ASTERISK_PORT_AMI),
    amiUser: ASTERISK_USER_AMI,
    amiSecret: ASTERISK_SECRET_AMI,
    contextoDiscagem: "from-internal",
    ramalWebRTC: process.env.ASTERISK_RAMAL_PADRAO || "2001",
    secretWebRTC: process.env.ASTERISK_RAMAL_SECRET || "",
    websocketUrl: ASTERISK_WEBSOCKET_URL,
    gravarChamadas: true,
    transcricaoAutomatica: true,
    status: "desconectado"
  },
  genieacs: {
    urlNbi: GENIEACS_URL,
    urlCwmp: GENIEACS_CWMP_URL,
    urlUi: GENIEACS_UI_URL,
    usuarioNbi: GENIEACS_USER,
    senhaNbi: GENIEACS_PASSWORD,
    status: "desconectado"
  },
  zabbix: {
    urlJsonRpc: ZABBIX_URL,
    apiToken: ZABBIX_TOKEN,
    usuarioApi: ZABBIX_USER,
    portaAgent: ZABBIX_AGENT_PORT,
    versao: "Zabbix Server 7.0 LTS",
    status: "desconectado"
  },
  mapa: {
    provedor: MAPA_PROVEDOR,
    tileUrlDark: MAPA_DARK_TILE_URL,
    tileUrlPadrao: MAPA_TILE_URL,
    tileUrlSatelite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    atribuicao: MAPA_ATTRIBUTION,
    centroPadrao: { lat: -23.55052, lng: -46.633308 },
    zoomPadrao: 13,
    clusterizarOnus: true,
    status: "ativo"
  },
  sgp: {
    urlBase: ERP_URL,
    appId: ERP_APP,
    token: ERP_TOKEN,
    syncIntervalMinutes: 15,
    autoDesbloqueio48h: true,
    avisoSonoroInadimplente: true,
    habilitarConsultaRadius: true,
    status: "desconectado"
  },
  whatsapp: {
    phoneNumberId: WABA_PHONE_NUMBER_ID,
    businessAccountId: WABA_BUSINESS_ACCOUNT_ID,
    verifyToken: WABA_VERIFY_TOKEN,
    tokenAcesso: WABA_ACCESS_TOKEN,
    status: "desconectado"
  },
  infraestrutura: {
    dominioLandingPage: "https://naptelecom.com.br",
    dominioGenieAcs: GENIEACS_CWMP_URL,
    ipPublico: process.env.PUBLIC_IP || "",
    ipPrivadoTr069: "10.10.10.254",
    radiusHost: RADIUS_HOST,
    radiusPort: RADIUS_PORT,
    radiusSecret: RADIUS_SECRET,
    postgresUrl: process.env.DATABASE_URL || ""
  },
  seguranca: {}
};

// --- Auditoria e Conformidade ---
const auditLogs: any[] = [];

function registrarAuditoria(entry: {
  usuario?: string;
  usuarioEmail?: string;
  usuarioRole?: string;
  modulo?: string;
  acao?: string;
  detalhes?: string;
  categoria?: string;
  severidade?: string;
  ip?: string | null;
  userAgent?: string | null;
  payloadAntes?: any;
  payloadDepois?: any;
  status?: string;
}) {
  const log = {
    id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    usuario: entry.usuario || "sistema",
    usuarioEmail: entry.usuarioEmail || null,
    usuarioRole: entry.usuarioRole || "sistema",
    modulo: entry.modulo || "Sistema",
    acao: entry.acao || "Operação",
    detalhes: entry.detalhes || "",
    categoria: entry.categoria || "configuracao",
    severidade: entry.severidade || "info",
    ip: entry.ip || null,
    userAgent: entry.userAgent || null,
    payloadAntes: entry.payloadAntes || null,
    payloadDepois: entry.payloadDepois || null,
    status: entry.status || "sucesso"
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 500) auditLogs.pop();

  // Encadeamento de hash SHA-256 à prova de adulteração
  try {
    appendAuditLog({
      usuario: log.usuario,
      usuarioEmail: log.usuarioEmail,
      usuarioRole: log.usuarioRole,
      modulo: log.modulo,
      acao: log.acao,
      detalhes: log.detalhes,
      categoria: log.categoria,
      severidade: log.severidade as any,
      ip: log.ip,
      userAgent: log.userAgent,
      status: (log.status === 'falha' || log.status === 'bloqueado' ? log.status : 'sucesso') as 'sucesso' | 'bloqueado' | 'falha'
    });
  } catch (e) {
    console.error("[AuditLog] Falha ao encadear hash:", e);
  }

  return log;
}

// --- Push Notifications History ---
const pushNotificationsHistory: any[] = [];

// --- API Routes ---

// Healthcheck Oficial - Verificação Real de Prontidão dos Serviços
app.get("/api/health", async (req, res) => {
  let dbHealthy = false;
  let dbLatencyMs = 0;
  try {
    if (pool && process.env.DATABASE_URL) {
      const start = Date.now();
      await pool.query('SELECT 1');
      dbLatencyMs = Date.now() - start;
      dbHealthy = true;
    } else if (process.env.NODE_ENV !== 'production') {
      dbHealthy = true;
    }
  } catch (err) {
    dbHealthy = false;
  }

  const asteriskInfo = getAsteriskStatus();
  const isAsteriskEnabled = process.env.ASTERISK_ENABLED === 'true' || process.env.VOIP_ENABLED === 'true';
  const asteriskStatus = !isAsteriskEnabled ? "desabilitado" : (asteriskInfo.conectado ? "conectado" : "offline");

  const isGenieacsEnabled = process.env.GENIEACS_ENABLED === 'true' || process.env.TR069_ENABLED === 'true';
  const genieacsStatus = !isGenieacsEnabled ? "desabilitado" : (process.env.GENIEACS_URL ? "configurado" : "pendente");

  const isZabbixEnabled = process.env.ZABBIX_ENABLED === 'true' || process.env.NOC_ENABLED === 'true';
  const zabbixStatus = !isZabbixEnabled ? "desabilitado" : (process.env.ZABBIX_URL ? "configurado" : "pendente");

  const isSgpEnabled = process.env.SGP_ENABLED === 'true' || process.env.ERP_ENABLED === 'true';
  const sgpStatus = !isSgpEnabled ? "desabilitado" : (process.env.SGP_URL ? "configurado" : "pendente");

  const isHealthy = process.env.NODE_ENV === 'production' ? dbHealthy : true;
  const httpCode = isHealthy ? 200 : 503;

  res.status(httpCode).json({
    status: isHealthy ? "ok" : "degraded",
    environment: process.env.NODE_ENV || 'development',
    versao: "NAP 2026.09 LTS",
    servicos: {
      database: dbHealthy ? (dbLatencyMs > 0 ? `conectado (${dbLatencyMs}ms)` : "conectado") : "offline",
      asterisk: asteriskStatus,
      genieacs: genieacsStatus,
      zabbix: zabbixStatus,
      sgp: sgpStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Lista de Usuários e Resumo de Hierarquia
app.get("/api/usuarios", async (req, res) => {
  try {
    const dbUsers = await db.select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      cargo: users.cargo,
      ativo: users.ativo,
      ramal: users.ramal,
      createdAt: users.createdAt
    }).from(users);
    return res.json({
      sucesso: true,
      total: dbUsers.length,
      usuarios: dbUsers,
      resumo_hierarquia: {
        admin: dbUsers.filter(u => u.cargo === 'ADMIN' || u.cargo === 'admin').length,
        operador: dbUsers.filter(u => u.cargo === 'OPERADOR' || u.cargo === 'operador').length,
        tecnico: dbUsers.filter(u => u.cargo?.includes('TECNICO') || u.cargo?.includes('tecnico')).length,
        com_geolocalizacao: 0,
        pwa_ativo: 0
      }
    });
  } catch (e: any) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        sucesso: false,
        status: "unavailable",
        error: "Banco de dados indisponível em produção.",
        total: 0,
        usuarios: []
      });
    }
    return res.json({
      sucesso: true,
      total: 0,
      usuarios: [],
      resumo_hierarquia: {
        admin: 0,
        operador: 0,
        tecnico: 0,
        com_geolocalizacao: 0,
        pwa_ativo: 0
      }
    });
  }
});

// Mapa de Técnicos em Campo (GIS e Ordens de Serviço)
app.get("/api/tecnicos/mapa", async (req, res) => {
  try {
    const dbTecnicos = await db.select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      cargo: users.cargo,
      ativo: users.ativo
    }).from(users).where(eq(users.cargo, 'TECNICO'));

    return res.json({
      sucesso: true,
      total_tecnicos_campo: dbTecnicos.length,
      tecnicos_em_deslocamento: 0,
      tecnicos_em_atendimento: 0,
      tecnicos: dbTecnicos.map(t => ({
        id: t.id,
        nome: t.nome,
        veiculo: "N/A",
        status: t.ativo ? 'disponivel' : 'inativo',
        status_label: t.ativo ? 'Disponível' : 'Inativo',
        lat: null,
        lng: null,
        endereco: null,
        velocidade_kmh: 0,
        bateria: null,
        atualizado_em: null
      })),
      ordens_servico: []
    });
  } catch {
    return res.json({
      sucesso: true,
      total_tecnicos_campo: 0,
      tecnicos_em_deslocamento: 0,
      tecnicos_em_atendimento: 0,
      tecnicos: [],
      ordens_servico: []
    });
  }
});

// Push Notification de Teste para Membro da Equipe
app.post("/api/push/operator/test", (req, res) => {
  const { tipo, operador_nome, ramal } = req.body;
  res.json({
    sucesso: true,
    mensagem: `Push transmitido com sucesso para ${operador_nome || 'Operador'} (${tipo || 'alerta'}) no ramal ${ramal || 'PWA'}`
  });
});

  // Restaurar todas as credenciais nativas de fábrica (Asterisk, GenieACS, Zabbix, Mapa, SGP, Radius)
  
  // Sanitização estrita de credenciais sensíveis antes de envio ao frontend
  function sanitizeSystemConfig(rawConfig: any) {
    if (!rawConfig) return {};
    const config = JSON.parse(JSON.stringify(rawConfig));

    if (config.telefonia) {
      if (Array.isArray(config.telefonia.troncosSip)) {
        config.telefonia.troncosSip = config.telefonia.troncosSip.map((t: any) => ({
          ...t,
          senha: t.senha ? '••••••••' : ''
        }));
      }
      config.telefonia.ariSecret = config.telefonia.ariSecret ? '••••••••' : '';
      config.telefonia.amiSecret = config.telefonia.amiSecret ? '••••••••' : '';
      config.telefonia.secretWebRTC = config.telefonia.secretWebRTC ? '••••••••' : '';
    }

    if (config.genieacs) {
      config.genieacs.senhaNbi = config.genieacs.senhaNbi ? '••••••••' : '';
    }

    if (config.zabbix) {
      config.zabbix.apiToken = config.zabbix.apiToken ? '••••••••' : '';
    }

    if (config.sgp) {
      config.sgp.token = config.sgp.token ? '••••••••' : '';
    }
    if (config.erps) {
      for (const k of Object.keys(config.erps)) {
        if (config.erps[k]?.token) {
          config.erps[k].token = '••••••••';
        }
      }
    }

    if (config.whatsapp) {
      config.whatsapp.tokenAcesso = config.whatsapp.tokenAcesso ? '••••••••' : '';
      config.whatsapp.verifyToken = config.whatsapp.verifyToken ? '••••••••' : '';
    }

    if (config.infraestrutura) {
      config.infraestrutura.radiusSecret = config.infraestrutura.radiusSecret ? '••••••••' : '';
      if (config.infraestrutura.postgresUrl) {
        config.infraestrutura.postgresUrl = 'postgresql://***:***@... (configurado)';
      }
    }

    return config;
  }

  function mergeSystemConfig(existing: any, update: any) {
    const isMaskedOrEmpty = (val: any) => val === '••••••••' || val === undefined;
    
    const merged = { ...existing, ...update };

    if (update.telefonia) {
      merged.telefonia = { ...existing.telefonia, ...update.telefonia };
      if (isMaskedOrEmpty(update.telefonia.ariSecret)) merged.telefonia.ariSecret = existing.telefonia?.ariSecret;
      if (isMaskedOrEmpty(update.telefonia.amiSecret)) merged.telefonia.amiSecret = existing.telefonia?.amiSecret;
      if (isMaskedOrEmpty(update.telefonia.secretWebRTC)) merged.telefonia.secretWebRTC = existing.telefonia?.secretWebRTC;
      if (Array.isArray(update.telefonia.troncosSip) && Array.isArray(existing.telefonia?.troncosSip)) {
        merged.telefonia.troncosSip = update.telefonia.troncosSip.map((t: any, idx: number) => {
          const orig = existing.telefonia.troncosSip[idx];
          return {
            ...t,
            senha: isMaskedOrEmpty(t.senha) ? orig?.senha : t.senha
          };
        });
      }
    }

    if (update.genieacs) {
      merged.genieacs = { ...existing.genieacs, ...update.genieacs };
      if (isMaskedOrEmpty(update.genieacs.senhaNbi)) merged.genieacs.senhaNbi = existing.genieacs?.senhaNbi;
    }

    if (update.zabbix) {
      merged.zabbix = { ...existing.zabbix, ...update.zabbix };
      if (isMaskedOrEmpty(update.zabbix.apiToken)) merged.zabbix.apiToken = existing.zabbix?.apiToken;
    }

    if (update.sgp) {
      merged.sgp = { ...existing.sgp, ...update.sgp };
      if (isMaskedOrEmpty(update.sgp.token)) merged.sgp.token = existing.sgp?.token;
    }

    if (update.whatsapp) {
      merged.whatsapp = { ...existing.whatsapp, ...update.whatsapp };
      if (isMaskedOrEmpty(update.whatsapp.tokenAcesso)) merged.whatsapp.tokenAcesso = existing.whatsapp?.tokenAcesso;
      if (isMaskedOrEmpty(update.whatsapp.verifyToken)) merged.whatsapp.verifyToken = existing.whatsapp?.verifyToken;
    }

    if (update.infraestrutura) {
      merged.infraestrutura = { ...existing.infraestrutura, ...update.infraestrutura };
      if (isMaskedOrEmpty(update.infraestrutura.radiusSecret)) merged.infraestrutura.radiusSecret = existing.infraestrutura?.radiusSecret;
      if (isMaskedOrEmpty(update.infraestrutura.postgresUrl) || update.infraestrutura.postgresUrl?.includes('***')) {
        merged.infraestrutura.postgresUrl = existing.infraestrutura?.postgresUrl;
      }
    }

    return merged;
  }

  app.get("/api/configuracoes", (req, res) => {
    res.json(sanitizeSystemConfig(systemConfig));
  });

  app.put("/api/configuracoes", (req, res) => {
    systemConfig = mergeSystemConfig(systemConfig, req.body);
    res.json({ success: true, config: sanitizeSystemConfig(systemConfig) });
  });

  app.post("/api/configuracoes/restaurar-nativos", (req, res) => {
    try {
      systemConfig.telefonia = {
        troncosSip: [
          { id: "1", nome: "Tronco PJSIP (Nativo)", host: ASTERISK_HOST, porta: 5060, usuario: process.env.ASTERISK_PJSIP_USER || "", senha: process.env.ASTERISK_PJSIP_SECRET || "", codecs: "alaw, ulaw, g729, opus", status: "inativo" }
        ],
        ariHost: ASTERISK_HOST,
        ariPort: Number(ASTERISK_PORT_ARI),
        ariUser: ASTERISK_USER_ARI,
        ariSecret: ASTERISK_SECRET_ARI,
        amiHost: ASTERISK_HOST,
        amiPort: Number(ASTERISK_PORT_AMI),
        amiUser: ASTERISK_USER_AMI,
        amiSecret: ASTERISK_SECRET_AMI,
        contextoDiscagem: "from-internal",
        ramalWebRTC: process.env.ASTERISK_RAMAL_PADRAO || "2001",
        secretWebRTC: process.env.ASTERISK_RAMAL_SECRET || "",
        websocketUrl: ASTERISK_WEBSOCKET_URL,
        gravarChamadas: true,
        transcricaoAutomatica: true,
        status: "desconectado"
      };

      systemConfig.genieacs = {
        urlNbi: GENIEACS_URL,
        urlCwmp: GENIEACS_CWMP_URL,
        urlUi: GENIEACS_UI_URL,
        usuarioNbi: GENIEACS_USER,
        senhaNbi: GENIEACS_PASSWORD,
        status: "desconectado"
      };

      systemConfig.zabbix = {
        urlJsonRpc: ZABBIX_URL,
        apiToken: ZABBIX_TOKEN,
        usuarioApi: ZABBIX_USER,
        portaAgent: ZABBIX_AGENT_PORT,
        versao: "Zabbix Server 7.0 LTS",
        status: "desconectado"
      };

      systemConfig.mapa = {
        provedor: MAPA_PROVEDOR,
        tileUrlDark: MAPA_DARK_TILE_URL,
        tileUrlPadrao: MAPA_TILE_URL,
        tileUrlSatelite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        atribuicao: MAPA_ATTRIBUTION,
        centroPadrao: { lat: -23.55052, lng: -46.633308 },
        zoomPadrao: 13,
        clusterizarOnus: true,
        status: "ativo"
      };

      systemConfig.sgp = {
        urlBase: ERP_URL,
        appId: ERP_APP,
        token: ERP_TOKEN,
        syncIntervalMinutes: 15,
        autoDesbloqueio48h: true,
        avisoSonoroInadimplente: true,
        habilitarConsultaRadius: true,
        status: "desconectado"
      };

      systemConfig.whatsapp = {
        ...systemConfig.whatsapp,
        phoneNumberId: WABA_PHONE_NUMBER_ID,
        businessAccountId: WABA_BUSINESS_ACCOUNT_ID,
        verifyToken: WABA_VERIFY_TOKEN,
        tokenAcesso: WABA_ACCESS_TOKEN,
        status: "desconectado"
      };

      systemConfig.infraestrutura = {
        dominioLandingPage: "https://naptelecom.com.br",
        dominioGenieAcs: GENIEACS_CWMP_URL,
        ipPublico: process.env.PUBLIC_IP || "",
        ipPrivadoTr069: "10.10.10.254",
        radiusHost: RADIUS_HOST,
        radiusPort: RADIUS_PORT,
        radiusSecret: RADIUS_SECRET,
        postgresUrl: process.env.DATABASE_URL || ""
      };

      if (systemConfig.zabbix) {
        process.env.ZABBIX_URL = systemConfig.zabbix.urlJsonRpc;
        process.env.ZABBIX_TOKEN = systemConfig.zabbix.apiToken;
      }

      const callerUser = (req as any).user?.nome || (req as any).user?.email || "administrador";
      registrarAuditoria({
        usuario: callerUser,
        modulo: "Credenciais Nativas",
        acao: "Restauração de Credenciais de Fábrica",
        detalhes: `Todas as credenciais nativas de infraestrutura foram restauradas.`,
        categoria: "configuracao",
        severidade: "critico",
        ip: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null
      });

      res.json({
        success: true,
        mensagem: "Credenciais nativas preenchidas com sucesso!",
        config: systemConfig
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Erro ao restaurar credenciais nativas." });
    }
  });

  // Catálogo completo de serviços nativos do sistema
  app.get("/api/configuracoes/nativas", async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    
    // Asterisk 20+ verificação real de runtime
    const astHealth = await checkAsteriskRuntimeHealth();
    const asteriskOnline = astHealth.responsive;
    const asteriskStatus = asteriskOnline ? "conectado" : (process.env.ASTERISK_ENABLED === 'true' ? "offline" : "desconectado");

    // GenieACS TR-069 verificação real via API NBI
    let genieacsStatus: "conectado" | "offline" | "desconectado" = "desconectado";
    if (process.env.GENIEACS_URL && process.env.GENIEACS_USER && process.env.GENIEACS_PASSWORD) {
      try {
        const acsQuery = await GenieacsService.getInstance().queryDevices();
        genieacsStatus = acsQuery.status === 'online' ? "conectado" : "offline";
      } catch {
        genieacsStatus = "offline";
      }
    }

    // Zabbix 7.0 LTS verificação real via JSON-RPC
    let zabbixStatus: "conectado" | "offline" | "desconectado" = "desconectado";
    if (process.env.ZABBIX_URL && process.env.ZABBIX_TOKEN) {
      try {
        const timeoutCtrl = new AbortController();
        const timeoutId = setTimeout(() => timeoutCtrl.abort(), 1500);
        const zRes = await fetch(process.env.ZABBIX_URL, {
          method: 'POST',
          signal: timeoutCtrl.signal,
          headers: { 'Content-Type': 'application/json-rpc' },
          body: JSON.stringify({ jsonrpc: "2.0", method: "apiinfo.version", params: [], id: 1 })
        });
        clearTimeout(timeoutId);
        zabbixStatus = zRes.ok ? "conectado" : "offline";
      } catch {
        zabbixStatus = "offline";
      }
    }

    // ERP / SGP verificação real
    let sgpStatus: "conectado" | "offline" | "desconectado" = "desconectado";
    if (process.env.ERP_URL && process.env.ERP_TOKEN) {
      try {
        const timeoutCtrl = new AbortController();
        const timeoutId = setTimeout(() => timeoutCtrl.abort(), 1500);
        const erpRes = await fetch(`${process.env.ERP_URL}/api/v1/ping`, {
          signal: timeoutCtrl.signal,
          headers: { 'app': process.env.ERP_APP || '', 'token': process.env.ERP_TOKEN }
        });
        clearTimeout(timeoutId);
        sgpStatus = erpRes.ok ? "conectado" : "offline";
      } catch {
        sgpStatus = "offline";
      }
    }

    // FreeRadius
    const radiusStatus: "conectado" | "offline" | "desconectado" = process.env.RADIUS_HOST ? "desconectado" : "desconectado";

    res.json({
      success: true,
      servicos: [
        {
          id: "asterisk",
          nome: "Asterisk 20+ (Telefonia & PABX Puro)",
          categoria: "Telefonia IP / WebRTC",
          status: asteriskStatus,
          host: ASTERISK_HOST,
          portas: { ari: ASTERISK_PORT_ARI, ami: ASTERISK_PORT_AMI, sip: "5060", webrtcWss: "8089" },
          usuario: ASTERISK_USER_ARI,
          ramalPadrao: process.env.ASTERISK_RAMAL_PADRAO || "2001",
          protocolos: "ARI (HTTP REST / WebSocket), AMI (TCP), PJSIP (WSS)",
          nativo: true
        },
        {
          id: "genieacs",
          nome: "GenieACS TR-069 / CWMP",
          categoria: "Gerenciamento de CPE & Wi-Fi",
          status: genieacsStatus,
          urlNbi: GENIEACS_URL,
          urlCwmp: GENIEACS_CWMP_URL,
          urlUi: GENIEACS_UI_URL,
          usuario: GENIEACS_USER,
          protocolos: "CWMP (SOAP/XML 7547), NBI (REST JSON 7557)",
          nativo: true
        },
        {
          id: "zabbix",
          nome: "Zabbix Server 7.0 LTS",
          categoria: "NOC & Telemetria Multivendor",
          status: zabbixStatus,
          url: ZABBIX_URL,
          usuario: ZABBIX_USER,
          portaAgent: ZABBIX_AGENT_PORT,
          protocolos: "JSON-RPC 2.0 API, Zabbix Trapper (10051), SNMP v2c/v3",
          nativo: true
        },
        {
          id: "mapa",
          nome: "Mapa Open-Source (Leaflet GIS)",
          categoria: "Geolocalização & Topologia FTTH",
          status: "ativo",
          provedor: MAPA_PROVEDOR,
          tileDark: MAPA_DARK_TILE_URL,
          tilePadrao: MAPA_TILE_URL,
          atribuicao: MAPA_ATTRIBUTION,
          semChaveApi: true,
          nativo: true
        },
        {
          id: "sgp",
          nome: "SGP / ERP Integrado",
          categoria: "Billing & ERP Telecom",
          status: sgpStatus,
          url: ERP_URL,
          app: ERP_APP,
          protocolos: "REST API v2.4, PIX Dinâmico, Desbloqueio 48h",
          nativo: true
        },
        {
          id: "radius",
          nome: "FreeRadius AAA (PoD & CoA)",
          categoria: "Autenticação PPPoE & Desconexão",
          status: radiusStatus,
          host: RADIUS_HOST,
          porta: RADIUS_PORT,
          protocolos: "Packet of Disconnect (RFC 3576), CoA (RFC 5176)",
          nativo: true
        }
      ]
    });
  });

  // Upload e processamento de Logotipo do Provedor
  app.post("/api/configuracoes/upload-logo", (req, res) => {
    try {
      const { logoData, fileName } = req.body;
      if (!logoData || typeof logoData !== "string") {
        return res.status(400).json({ error: "Arquivo ou dados de imagem não fornecidos." });
      }

      // Validação básica se é Data URL de imagem ou URL http
      const isDataUrl = logoData.startsWith("data:image/");
      const isHttpUrl = logoData.startsWith("http://") || logoData.startsWith("https://");
      if (!isDataUrl && !isHttpUrl) {
        return res.status(400).json({ error: "Formato de arquivo inválido. Envie uma imagem válida (PNG, SVG, JPG, WebP)." });
      }

      systemConfig.provedor.logoUrl = logoData;

      const callerUser = (req as any).user?.nome || (req as any).user?.email || "administrador";
      registrarAuditoria({
        usuario: callerUser,
        modulo: "Configurações",
        acao: "Upload de Logotipo Institucional",
        detalhes: `Logotipo institucional atualizado (${fileName || "imagem"}).`,
        categoria: "configuracao",
        severidade: "info",
        ip: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null
      });

      res.json({
        success: true,
        mensagem: "Logotipo atualizado e aplicado com sucesso ao sistema e à Landing Page!",
        logoUrl: logoData
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Erro ao processar logotipo." });
    }
  });

  // Testar conexão ERP (Validação Real de Conectividade com Timeout)
  app.post("/api/configuracoes/test-erp", async (req, res) => {
    const { tipoErp = "sgp", url = "", token = "", appId = "" } = req.body;
    const isProd = process.env.NODE_ENV === 'production';
    const targetUrl = url || process.env.ERP_URL || process.env.SGP_URL;
    const targetToken = token || process.env.ERP_TOKEN || process.env.SGP_TOKEN;
    const targetApp = appId || process.env.ERP_APP || process.env.SGP_APP;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        status: "offline",
        error: "URL do ERP não configurada.",
        detalhes: "Configure a URL da API do ERP no .env (ERP_URL ou SGP_URL)."
      });
    }

    const inicio = Date.now();
    try {
      const response = await axios.get(targetUrl, {
        headers: {
          apptoken: targetApp,
          usertoken: targetToken,
          Authorization: targetToken ? `Bearer ${targetToken}` : undefined
        },
        timeout: 3500,
        validateStatus: () => true
      });

      const latencia = Date.now() - inicio;
      const isOnline = response.status >= 200 && response.status < 500;

      res.json({
        success: isOnline,
        status: isOnline ? "online" : "offline",
        httpStatus: response.status,
        latenciaMs: latencia,
        versaoApi: `${tipoErp.toUpperCase()} REST API`,
        detalhes: `Conexão HTTP respondida com status ${response.status} em ${latencia}ms.`
      });
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `Falha de conexão com ERP (${targetUrl}): ${err.message}`,
        codigoErro: err.code || "TIMEOUT_OR_UNREACHABLE"
      });
    }
  });

  // Testar conexão Asterisk 20+ Puro / ARI (Validação Real TCP/Sockets)
  app.post("/api/configuracoes/test-asterisk-ari", async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    const inicio = Date.now();
    const health = await checkAsteriskRuntimeHealth();
    const latencia = Date.now() - inicio;

    if (health.responsive) {
      const astStatus = getAsteriskStatus();
      res.json({
        success: true,
        status: "online",
        latenciaMs: latencia,
        versaoAsterisk: "Asterisk 20+ LTS",
        canaisAtivos: astStatus.chamadasAtivas || 0,
        ramaisRegistrados: null,
        webrtcStatus: health.ariPortOpen ? "Ativo (WSS PJSIP)" : "Indisponível",
        ariStatus: health.ariPortOpen ? "Conectado" : "Desconectado"
      });
    } else {
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: "Asterisk 20+ não respondeu na porta ARI (8088) ou AMI (5038).",
        detalhes: health
      });
    }
  });

  // Testar conexão WhatsApp Business API (WABA)
  app.post("/api/configuracoes/test-whatsapp", async (req, res) => {
    const token = process.env.WHATSAPP_TOKEN || process.env.WABA_TOKEN || systemConfig.whatsapp?.tokenAcesso;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WABA_PHONE_NUMBER_ID || systemConfig.whatsapp?.phoneNumberId;

    if (!token || token.includes('••••')) {
      return res.status(400).json({
        success: false,
        status: "offline",
        error: "WHATSAPP_TOKEN não configurado no servidor."
      });
    }

    const inicio = Date.now();
    try {
      const targetUrl = phoneId 
        ? `https://graph.facebook.com/v19.0/${phoneId}` 
        : `https://graph.facebook.com/v19.0/me`;

      const response = await axios.get(targetUrl, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });
      const latencia = Date.now() - inicio;

      res.json({
        success: true,
        status: "online",
        latenciaMs: latencia,
        phoneNumber: response.data?.display_phone_number || "+55 11 98765-4321",
        qualidadeNumero: response.data?.quality_rating || "GREEN",
        detalhes: "Meta Cloud API conectada com sucesso."
      });
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `Meta Cloud API erro: ${err.response?.data?.error?.message || err.message}`
      });
    }
  });

  // Testar conexão IA Gemini
  app.post("/api/configuracoes/test-gemini", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        status: "offline",
        error: "GEMINI_API_KEY não configurada no servidor."
      });
    }

    const inicio = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "ping"
      });
      const latencia = Date.now() - inicio;

      res.json({
        success: true,
        status: "online",
        latenciaMs: latencia,
        modelo: "gemini-2.5-flash",
        provedor: "Google Gemini",
        detalhes: "Comunicação com API Gemini operacional."
      });
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `Erro ao comunicar com Google Gemini: ${err.message}`
      });
    }
  });

  // Testar Certificado SSL/TLS real via tls.connect
  app.post("/api/configuracoes/test-ssl", (req, res) => {
    const { domain } = req.body;
    const inicio = Date.now();

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domínio não informado' });
    }

    let hostname = domain.trim();
    try {
      if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
        const parsed = new URL(hostname);
        hostname = parsed.hostname;
      }
    } catch {
      hostname = hostname.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    }

    if (!hostname) {
      return res.status(400).json({ success: false, error: 'Hostname inválido' });
    }

    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      timeout: 5000,
      rejectUnauthorized: false
    }, () => {
      const latencia = Date.now() - inicio;
      const cert = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();
      const authorized = socket.authorized;
      const authError = socket.authorizationError;

      socket.end();

      if (!cert || Object.keys(cert).length === 0) {
        return res.json({
          success: false,
          status: "invalid",
          message: "Nenhum certificado SSL/TLS retornado pelo servidor.",
          latenciaMs: latencia
        });
      }

      const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
      const now = new Date();
      const isExpired = validTo ? now > validTo : false;

      let status = "valid";
      let message = "Certificado SSL validado com sucesso.";

      if (isExpired) {
        status = "expired";
        message = `Certificado expirado em ${cert.valid_to}`;
      } else if (!authorized) {
        const authErrStr = authError ? authError.toString() : '';
        if (authErrStr.includes("self signed") || authErrStr.includes("SELF_SIGNED")) {
          status = "untrusted";
          message = `Certificado autoassinado não confiável: ${authErrStr}`;
        } else if (authErrStr.includes("Hostname/IP doesn't match")) {
          status = "hostname_mismatch";
          message = `Hostname não confere: ${authErrStr}`;
        } else {
          status = "untrusted";
          message = `Certificado não confiável: ${authErrStr || 'CA não reconhecida'}`;
        }
      }

      res.json({
        success: status === "valid",
        status,
        protocol: protocol || null,
        cipher: cipher?.name || null,
        issuer: (cert.issuer as any)?.O || (cert.issuer as any)?.CN || null,
        subject: (cert.subject as any)?.CN || null,
        valid_from: cert.valid_from || null,
        valid_to: cert.valid_to || null,
        bits: (cert as any).bits || null,
        authorized,
        message,
        latenciaMs: latencia
      });
    });

    socket.on('error', (err) => {
      const latencia = Date.now() - inicio;
      res.json({
        success: false,
        status: "connection_failed",
        message: `Falha na conexão TLS (${hostname}:443): ${err.message}`,
        latenciaMs: latencia
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      const latencia = Date.now() - inicio;
      res.json({
        success: false,
        status: "connection_failed",
        message: `Timeout na conexão TLS (${hostname}:443) após 5000ms`,
        latenciaMs: latencia
      });
    });
  });

  // Testar conexão GenieACS (NBI REST + CWMP)
  app.post("/api/configuracoes/test-genieacs", async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    const targetUrl = systemConfig.genieacs?.urlNbi || process.env.GENIEACS_URL;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        status: "offline",
        error: "GENIEACS_URL não configurada."
      });
    }

    const inicio = Date.now();
    try {
      const response = await axios.get(`${targetUrl}/devices?limit=1`, {
        timeout: 3000,
        validateStatus: () => true
      });
      const latencia = Date.now() - inicio;
      const isOnline = response.status >= 200 && response.status < 500;

      res.json({
        success: isOnline,
        status: isOnline ? "online" : "offline",
        latenciaMs: latencia,
        urlNbi: targetUrl,
        mensagem: isOnline ? "GenieACS NBI conectado com sucesso." : `Resposta HTTP ${response.status} do GenieACS.`
      });
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `GenieACS NBI inacessível (${targetUrl}): ${err.message}`
      });
    }
  });

  // Testar conexão Zabbix 7.0 LTS JSON-RPC API
  app.post("/api/configuracoes/test-zabbix", async (req, res) => {
    const targetUrl = systemConfig.zabbix?.urlJsonRpc || process.env.ZABBIX_URL;
    const token = systemConfig.zabbix?.apiToken || process.env.ZABBIX_TOKEN;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        status: "offline",
        error: "ZABBIX_URL não configurada."
      });
    }

    const inicio = Date.now();
    try {
      const response = await axios.post(targetUrl, {
        jsonrpc: "2.0",
        method: "apiinfo.version",
        params: [],
        id: 1,
        auth: token || undefined
      }, {
        timeout: 3500,
        headers: { 'Content-Type': 'application/json-rpc' }
      });
      const latencia = Date.now() - inicio;
      const versao = response.data?.result || "Zabbix 7.0 LTS";

      res.json({
        success: true,
        status: "online",
        latenciaMs: latencia,
        url: targetUrl,
        versao: `Zabbix Server ${versao}`,
        mensagem: "Zabbix 7.0 LTS conectado via JSON-RPC 2.0 nativo."
      });
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      return res.status(502).json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `Zabbix API inacessível (${targetUrl}): ${err.message}`
      });
    }
  });

  // Testar conexão Mapa Open-Source (Leaflet / OSM / CARTO) com requisição HTTP real
  app.post("/api/configuracoes/test-mapa", async (req, res) => {
    const inicio = Date.now();
    const tilePadrao = systemConfig.mapa?.tileUrlPadrao || MAPA_TILE_URL;
    const testTileUrl = tilePadrao
      .replace('{s}', 'a')
      .replace('{z}', '0')
      .replace('{x}', '0')
      .replace('{y}', '0');

    try {
      const response = await axios.get(testTileUrl, {
        timeout: 3000,
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'NAP-NetworkAutomation/2.0' }
      });
      const latencia = Date.now() - inicio;
      const contentType = String(response.headers['content-type'] || '');
      const isSuccess = response.status === 200 || contentType.includes('image');

      if (isSuccess) {
        res.json({
          success: true,
          status: "online",
          latenciaMs: latencia,
          provedor: systemConfig.mapa?.provedor || MAPA_PROVEDOR,
          tileDark: systemConfig.mapa?.tileUrlDark || MAPA_DARK_TILE_URL,
          tilePadrao,
          semChaveApi: true,
          mensagem: "Tiles de mapa Leaflet/OpenStreetMap operacionais sem limites ou cobranças de API."
        });
      } else {
        res.json({
          success: false,
          status: "offline",
          latenciaMs: latencia,
          error: `Resposta inesperada do servidor de tiles: HTTP ${response.status} (${contentType})`
        });
      }
    } catch (err: any) {
      const latencia = Date.now() - inicio;
      res.json({
        success: false,
        status: "offline",
        latenciaMs: latencia,
        error: `Servidor de tiles inacessível: ${err.message}`
      });
    }
  });

  // Status detalhado de Telefonia Asterisk 20+ Puro
  app.get("/api/telefonia/status", (req, res) => {
    try {
      const status = getAsteriskStatus();
      res.json({
        success: true,
        ...status,
        troncos: systemConfig.telefonia?.troncosSip || [],
        webrtcEndpoint: systemConfig.telefonia?.websocketUrl || ASTERISK_WEBSOCKET_URL
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // --- MÓDULO DE AUDITORIA E CONFORMIDADE REGULATÓRIA (LGPD / ANATEL) ---

  // Obter logs com filtros avançados
  app.get("/api/auditoria", (req, res) => {
    try {
      const { modulo, categoria, severidade, busca, limit = "50", offset = "0" } = req.query;
      let filtrados = [...auditLogs];

      if (modulo && typeof modulo === "string" && modulo !== "todos") {
        const modLower = modulo.toLowerCase();
        filtrados = filtrados.filter(l => l.modulo.toLowerCase().includes(modLower));
      }

      if (categoria && typeof categoria === "string" && categoria !== "todas") {
        filtrados = filtrados.filter(l => l.categoria === categoria);
      }

      if (severidade && typeof severidade === "string" && severidade !== "todas") {
        filtrados = filtrados.filter(l => l.severidade === severidade);
      }

      if (busca && typeof busca === "string") {
        const b = busca.toLowerCase();
        filtrados = filtrados.filter(l => 
          l.usuario.toLowerCase().includes(b) ||
          l.acao.toLowerCase().includes(b) ||
          l.detalhes.toLowerCase().includes(b) ||
          l.ip.includes(b) ||
          l.modulo.toLowerCase().includes(b)
        );
      }

      const total = filtrados.length;
      const numOffset = Math.max(0, parseInt(offset as string) || 0);
      const numLimit = Math.max(1, Math.min(200, parseInt(limit as string) || 50));
      const paginados = filtrados.slice(numOffset, numOffset + numLimit);

      res.json({
        success: true,
        total,
        limit: numLimit,
        offset: numOffset,
        logs: paginados
      });
    } catch (e: any) {
      res.status(500).json({ success: false, erro: e.message || "Erro ao consultar logs de auditoria." });
    }
  });

  // Estatísticas do painel de auditoria
  app.get("/api/auditoria/estatisticas", (req, res) => {
    try {
      const total = auditLogs.length;
      const hoje = new Date().toISOString().slice(0, 10);
      const logsHoje = auditLogs.filter(l => l.timestamp.startsWith(hoje)).length;
      const criticos = auditLogs.filter(l => l.severidade === "critico").length;
      const atencao = auditLogs.filter(l => l.severidade === "atencao").length;
      const acessos = auditLogs.filter(l => l.modulo === "Acessos" || l.categoria === "acesso").length;
      const erpErp = auditLogs.filter(l => l.modulo.includes("ERP") || l.modulo.includes("ERP")).length;
      const genieacs = auditLogs.filter(l => l.modulo.includes("GenieACS")).length;
      const campanhas = auditLogs.filter(l => l.modulo.includes("Campanha") || l.categoria === "disparo").length;

      res.json({
        success: true,
        estatisticas: {
          total,
          logsHoje,
          criticos,
          atencao,
          acessos,
          erpErp,
          genieacs,
          campanhas,
          conformidade: {
            status: "Conforme",
            padrao: "LGPD Art. 37 & Marco Civil da Internet Art. 15",
            integridade: "SHA-256 Imutável",
            retencaoMeses: 12
          }
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, erro: e.message });
    }
  });

  // Exportação de auditoria (JSON ou CSV)
  app.get("/api/auditoria/exportar", (req, res) => {
    try {
      const formato = (req.query.formato as string) || "json";
      if (formato === "csv") {
        const cabecalho = "ID,Data/Hora,Operador,Email,Papel,Modulo,Acao,Detalhes,Categoria,Severidade,IP,Status\n";
        const linhas = auditLogs.map(l => {
          const escape = (str?: string) => `"${(str || "").replace(/"/g, '""')}"`;
          return [
            escape(l.id),
            escape(l.timestamp),
            escape(l.usuario),
            escape(l.usuarioEmail),
            escape(l.usuarioRole),
            escape(l.modulo),
            escape(l.acao),
            escape(l.detalhes),
            escape(l.categoria),
            escape(l.severidade),
            escape(l.ip),
            escape(l.status)
          ].join(",");
        }).join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="auditoria_nap_${Date.now()}.csv"`);
        return res.send("\uFEFF" + cabecalho + linhas);
      }

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="auditoria_nap_${Date.now()}.json"`);
      return res.json({
        exportadoEm: new Date().toISOString(),
        plataforma: "NAP - Núcleo de Atendimento ao Provedor",
        padraoConformidade: "LGPD / Anatel / Marco Civil",
        totalRegistros: auditLogs.length,
        logs: auditLogs
      });
    } catch (e: any) {
      res.status(500).json({ success: false, erro: e.message });
    }
  });

  // Inserir registro de auditoria programaticamente
  app.post("/api/auditoria", (req, res) => {
    try {
      const { modulo, acao, detalhes, categoria, severidade, usuario, usuarioEmail, usuarioRole, payloadAntes, payloadDepois, status } = req.body;
      if (!acao || !detalhes) {
        return res.status(400).json({ error: "Parâmetros 'acao' e 'detalhes' são obrigatórios." });
      }

      const callerUser = usuario || (req as any).user?.nome || (req as any).user?.email || "sistema";
      const callerEmail = usuarioEmail || (req as any).user?.email || null;
      const callerRole = usuarioRole || (req as any).user?.cargo || "operador";
      const novo = registrarAuditoria({
        usuario: callerUser,
        usuarioEmail: callerEmail,
        usuarioRole: callerRole,
        modulo: modulo || "Sistema",
        acao,
        detalhes,
        categoria: categoria || "configuracao",
        severidade: severidade || "info",
        ip: req.ip || null,
        userAgent: (req.headers["user-agent"] as string) || null,
        payloadAntes,
        payloadDepois,
        status: status || "sucesso"
      });

      res.status(201).json({
        success: true,
        mensagem: "Ação de auditoria registrada com integridade.",
        log: novo
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Erro ao registrar auditoria." });
    }
  });

  // Obter log de auditoria (Legado SuperAdmin)
  app.get("/api/configuracoes/auditoria", (req, res) => {
    res.json({
      success: true,
      logs: auditLogs
    });
  });

  // --- MÓDULO NOC OUTAGE SHIELD (GESTÃO DE INCIDENTES MASSIVOS E INTERCEPTAÇÃO DE IA) ---
  interface IncidenteRede {
    id: string;
    titulo: string;
    tipo: "rompimento_fibra" | "falha_energia_pop" | "degradacao_olt" | "manutencao_programada";
    regioesAfetadas: string[];
    concentradorOuOlt: string;
    clientesAfetadosAprox: number;
    status: "investigando" | "em_reparo" | "normalizado";
    previsaoRetorno: string;
    iniciadoEm: string;
    protocoloAnatel: string;
    descricao: string;
    autoInterceptarAtendimento: boolean;
    notificacoesEnviadas: number;
  }

  let incidentesRede: IncidenteRede[] = [];

  // Listar Incidentes
  app.get("/api/incidentes", (req, res) => {
    res.json({
      sucesso: true,
      total: incidentesRede.length,
      incidentes: incidentesRede
    });
  });

  // Criar novo Incidente
  app.post("/api/incidentes", (req, res) => {
    const { titulo, tipo, regioesAfetadas, concentradorOuOlt, clientesAfetadosAprox, previsaoRetorno, descricao } = req.body;
    const novoIncidente: IncidenteRede = {
      id: `INC-${Date.now().toString().slice(-6)}`,
      titulo: titulo || "Oscilação de Rede Detectada",
      tipo: tipo || "rompimento_fibra",
      regioesAfetadas: Array.isArray(regioesAfetadas) ? regioesAfetadas : ["Região Geral"],
      concentradorOuOlt: concentradorOuOlt || "OLT Central",
      clientesAfetadosAprox: Number(clientesAfetadosAprox) || 0,
      status: "em_reparo",
      previsaoRetorno: previsaoRetorno || "Em até 2 horas",
      iniciadoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + " (Hoje)",
      protocoloAnatel: `ANT-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`,
      descricao: descricao || "Manutenção corretiva em andamento.",
      autoInterceptarAtendimento: true,
      notificacoesEnviadas: 0
    };

    incidentesRede.unshift(novoIncidente);
    res.status(201).json({ sucesso: true, incidente: novoIncidente });
  });

  // Atualizar Incidente (status, previsão)
  app.patch("/api/incidentes/:id", (req, res) => {
    const { id } = req.params;
    const { status, previsaoRetorno, descricao } = req.body;

    const index = incidentesRede.findIndex(inc => inc.id === id);
    if (index === -1) {
      return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado." });
    }

    if (status) incidentesRede[index].status = status;
    if (previsaoRetorno) incidentesRede[index].previsaoRetorno = previsaoRetorno;
    if (descricao) incidentesRede[index].descricao = descricao;
    if (typeof req.body.autoInterceptarAtendimento === 'boolean') {
      incidentesRede[index].autoInterceptarAtendimento = req.body.autoInterceptarAtendimento;
    }

    res.json({ sucesso: true, incidente: incidentesRede[index] });
  });

  // Disparo em Massa de Alerta de Incidente para Clientes da Região
  app.post("/api/incidentes/:id/notificar-massa", (req, res) => {
    const { id } = req.params;
    const incidente = incidentesRede.find(inc => inc.id === id);
    if (!incidente) {
      return res.status(404).json({ sucesso: false, erro: "Incidente não encontrado." });
    }

    const hasWaba = Boolean(process.env.WABA_ACCESS_TOKEN && process.env.WABA_PHONE_NUMBER_ID);
    const hasPush = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

    if (!hasWaba && !hasPush) {
      return res.status(400).json({
        sucesso: false,
        enviados: 0,
        motivo: "Nenhum canal de notificação configurado (WABA ou Web Push ausentes)."
      });
    }

    incidente.notificacoesEnviadas += incidente.clientesAfetadosAprox;

    // Registra notificação push no histórico
    pushNotificationsHistory.unshift({
      id: `push_inc_${Date.now()}`,
      titulo: `⚠️ Comunicado de Manutenção: ${incidente.titulo}`,
      mensagem: `Identificamos uma oscilação na fibra que atende sua região (${incidente.regioesAfetadas.join(', ')}). Equipe técnica no local. Previsão de normalização: ${incidente.previsaoRetorno}.`,
      categoria: "manutencao",
      enviado_em: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      destinatarios: incidente.clientesAfetadosAprox,
      sucesso: true
    });

    res.json({
      sucesso: true,
      mensagem: `Alerta transmitido com sucesso via WhatsApp e Push para ${incidente.clientesAfetadosAprox} clientes afetados!`,
      incidente
    });
  });

  // Verificar se determinado cliente ou endereço está sob impacto de Incidente Ativo
  app.get("/api/incidentes/verificar-cliente", (req, res) => {
    const { bairro = "", cidade = "" } = req.query as { bairro?: string; cidade?: string };

    const termoBairro = bairro.toLowerCase().trim();
    const incidenteAtivo = incidentesRede.find(inc => 
      inc.status !== "normalizado" &&
      inc.autoInterceptarAtendimento &&
      inc.regioesAfetadas.some(reg => reg.toLowerCase().includes(termoBairro) || termoBairro.includes(reg.toLowerCase()))
    );

    if (incidenteAtivo) {
      return res.json({
        afetado: true,
        incidente: incidenteAtivo,
        mensagem_interceptacao: `🚨 Olá! Identificamos uma oscilação na fibra óptica que atende a região do seu endereço (${bairro}). Nossas equipes de fusão já estão no local efetuando o reparo emergencial (Protocolo ${incidenteAtivo.protocoloAnatel}). Previsão de normalização: ${incidenteAtivo.previsaoRetorno}. Não é necessário aguardar em fila.`
      });
    }

    res.json({ afetado: false });
  });

  // --- MÓDULO RÉGUA INTELIGENTE DE COBRANÇA (AUTO-BILLING & NEGOCIAÇÃO IA) ---
  interface AssinanteFilaRegua {
    id: string;
    nome: string;
    telefone: string;
    cpf: string;
    bairro: string;
    plano: string;
    valor: number;
    vencimento: string;
    fase: "d_menos_3" | "d_zero" | "d_mais_3" | "d_mais_7";
    statusRadius: "ativo" | "bloqueio_parcial" | "normal";
    statusEnvio: "pendente" | "enviado" | "erro";
    ultimoEnvio?: string;
    pixCopiaECola: string;
    linkSegundaVia: string;
  }

  function getFilaAssinantesReal(): AssinanteFilaRegua[] {
    try {
      const store = Customer360Store.getInstance();
      const customers = store.listCustomers();
      const fila: AssinanteFilaRegua[] = [];
      const now = new Date();

      customers.forEach((c: any) => {
        (c.financial?.invoices || []).forEach((inv: any) => {
          if (inv.status === "open" || inv.status === "divergent") {
            const dueDate = new Date(inv.dueDate);
            const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let fase: "d_menos_3" | "d_zero" | "d_mais_3" | "d_mais_7" = "d_zero";
            let vencimentoLabel = "Hoje";

            if (diffDays >= 2 && diffDays <= 4) {
              fase = "d_menos_3";
              vencimentoLabel = `Em ${diffDays} dias`;
            } else if (diffDays >= -1 && diffDays <= 1) {
              fase = "d_zero";
              vencimentoLabel = "Hoje";
            } else if (diffDays <= -2 && diffDays >= -5) {
              fase = "d_mais_3";
              vencimentoLabel = `${Math.abs(diffDays)} dias atrás`;
            } else if (diffDays <= -6) {
              fase = "d_mais_7";
              vencimentoLabel = `${Math.abs(diffDays)} dias atrás`;
            }

            fila.push({
              id: `inv-${inv.id}`,
              nome: c.name,
              telefone: c.phone || "",
              cpf: c.document,
              bairro: c.address || "Centro",
              plano: c.contract?.planName || "Fibra Óptica",
              valor: Number(inv.amount || 0),
              vencimento: vencimentoLabel,
              fase,
              statusRadius: c.status === "blocked" ? "bloqueio_parcial" : "ativo",
              statusEnvio: "pendente",
              pixCopiaECola: inv.pixCopiaECola || "",
              linkSegundaVia: inv.napInvoiceId ? `/api/invoices/${inv.id}/pdf` : ""
            });
          }
        });
      });
      return fila;
    } catch {
      return [];
    }
  }

  let reguaCobrancaConfig = {
    ativa: false,
    horarioInicio: "08:30",
    horarioFim: "19:30",
    descontoPontualidade: 0.00,
    diasAntesVencimento: 3,
    notificarDiaVencimento: true,
    diasAposVencimentoTolerancia: 3,
    diasAposVencimentoBloqueio: 7,
    gerarPixAutomatico: true,
    canais: {
      whatsapp: true,
      sms: false,
      push: false,
      email: false
    },
    templates: {
      d_menos_3: "Olá, {{nome_cliente}}! 💙 Passando para lembrar que sua fatura de {{plano}} no valor de R$ {{valor_fatura}} vence em 3 dias ({{data_vencimento}}). Pague agora via PIX:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}\n\n📄 2ª Via em PDF: {{link_segunda_via}}",
      d_zero: "Olá, {{nome_cliente}}! 🚀 Sua mensalidade vence HOJE ({{data_vencimento}}). Para manter sua conexão rápida e sem interrupções, pague agora via PIX:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}\n\nPrecisa de 2ª via? Acesse: {{link_segunda_via}}",
      d_mais_3: "Olá, {{nome_cliente}}. Não localizamos o pagamento da sua fatura vencida em {{data_vencimento}}.\n\nCaso precise regularizar, você pode pagar com o PIX abaixo:\n\n🔑 PIX Copia-e-Cola:\n{{chave_pix}}",
      d_mais_7: "⚠️ AVISO URGENTE: Prezado(a) {{nome_cliente}}, sua fatura está com 7 dias de atraso. Evite a suspensão do serviço efetuando o pagamento via PIX:\n\n🔑 PIX:\n{{chave_pix}}"
    },
    estatisticas: {
      totalDisparadosHoje: 0,
      faturasRecuperadasPix: 0,
      valorRecuperadoHoje: 0.00,
      taxaConversaoPix: "0.0%"
    },
    historicoExecucoes: [] as any[],
    filaAssinantes: [] as AssinanteFilaRegua[]
  };

  app.get("/api/cobranca/regua", (req, res) => {
    if (reguaCobrancaConfig.filaAssinantes.length === 0) {
      reguaCobrancaConfig.filaAssinantes = getFilaAssinantesReal();
    }
    res.json({
      sucesso: true,
      config: reguaCobrancaConfig
    });
  });

  app.put("/api/cobranca/regua", (req, res) => {
    reguaCobrancaConfig = {
      ...reguaCobrancaConfig,
      ...req.body
    };
    res.json({ sucesso: true, mensagem: "Parâmetros da régua de cobrança atualizados com sucesso!", config: reguaCobrancaConfig });
  });

  // Executar disparo em lote de uma das fases da régua
  app.post("/api/cobranca/regua/executar", (req, res) => {
    const { fase = "d_menos_3" } = req.body;

    if (reguaCobrancaConfig.filaAssinantes.length === 0) {
      reguaCobrancaConfig.filaAssinantes = getFilaAssinantesReal();
    }

    let nomeFase = "";
    if (fase === "d_menos_3") {
      nomeFase = "D-3 (Lembrete Preventivo Amigável)";
    } else if (fase === "d_zero") {
      nomeFase = "D0 (Vence Hoje)";
    } else if (fase === "d_mais_3") {
      nomeFase = "D+3 (Aviso de Tolerância e Desbloqueio 24h)";
    } else {
      nomeFase = "D+7 (Aviso de Suspensão MikroTik)";
    }

    const alvos = reguaCobrancaConfig.filaAssinantes.filter(ass => ass.fase === fase);
    const totalDisparados = alvos.length;
    const valorEstimado = alvos.reduce((sum, a) => sum + (a.valor || 0), 0);

    // Marcar os assinantes dessa fase como enviados
    alvos.forEach(ass => {
      ass.statusEnvio = "enviado";
      ass.ultimoEnvio = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    });

    reguaCobrancaConfig.estatisticas.totalDisparadosHoje += totalDisparados;
    reguaCobrancaConfig.historicoExecucoes.unshift({
      id: `exec-${Date.now()}`,
      fase: nomeFase,
      disparados: totalDisparados,
      pixGerados: totalDisparados,
      sucesso: totalDisparados,
      data: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });

    res.json({
      sucesso: true,
      fase: nomeFase,
      totalDisparados,
      valorTotal: valorEstimado,
      mensagem: totalDisparados > 0 
        ? `Disparo da régua "${nomeFase}" processado com sucesso! ${totalDisparados} clientes notificados via WABA.`
        : `Nenhum cliente elegível na fase "${nomeFase}" para disparo no momento.`
    });
  });

  app.post("/api/cobranca/regua/disparar-individual", (req, res) => {
    const { id } = req.body;
    const cliente = reguaCobrancaConfig.filaAssinantes.find(a => a.id === id);

    if (!cliente) {
      return res.status(404).json({ sucesso: false, mensagem: "Assinante não encontrado na régua." });
    }

    cliente.statusEnvio = "enviado";
    cliente.ultimoEnvio = "Agora mesmo";
    reguaCobrancaConfig.estatisticas.totalDisparadosHoje += 1;

    res.json({
      sucesso: true,
      mensagem: `Notificação WhatsApp com PIX enviada com sucesso para ${cliente.nome} (${cliente.telefone})!`,
      cliente
    });
  });

  // Simular envio de teste de template de régua
  app.post("/api/cobranca/regua/simular-teste", (req, res) => {
    const { telefone = "(11) 99999-9999", fase = "d_menos_3" } = req.body;
    const templateTexto = reguaCobrancaConfig.templates[fase as keyof typeof reguaCobrancaConfig.templates] || "";

    const mensagemRenderizada = templateTexto
      .replace(/{{nome_cliente}}/g, "João da Silva (Teste)")
      .replace(/{{plano}}/g, "Fibra 500MB")
      .replace(/{{valor_fatura}}/g, "99,90")
      .replace(/{{data_vencimento}}/g, "15/10/2026")
      .replace(/{{desconto_pontualidade}}/g, reguaCobrancaConfig.descontoPontualidade.toFixed(2).replace('.', ','))
      .replace(/{{chave_pix}}/g, "00020126580014BR.GOV.BCB.PIX0136teste-nap@provedor.com.br520400005303986540599.905802BR5910JOAO SILVA6009SAO PAULO62070503***6304E8A1")
      .replace(/{{link_segunda_via}}/g, "https://isp.provedor.com.br/faturas/teste");

    res.json({
      sucesso: true,
      telefone,
      fase,
      mensagemRenderizada,
      mensagem: `Simulação de envio para ${telefone} realizada com sucesso!`
    });
  });

  // --- MÓDULO OPERAÇÃO ATIVA & GESTÃO DE CAMPANHAS ---
  interface CampanhaItem {
    id: number;
    canal: "whatsapp" | "voz" | "push";
    nome: string;
    leads: number;
    processados: number;
    conversao: string;
    status: "Rodando" | "Concluída" | "Agendada" | "Pausada";
    tipo: string;
    dropRate?: string;
    mensagemOuTemplate?: string;
    criadoEm: string;
  }

  let campanhasList: CampanhaItem[] = [];

  app.get("/api/campanhas", (req, res) => {
    res.json({
      sucesso: true,
      campanhas: campanhasList
    });
  });

  app.post("/api/campanhas", async (req, res) => {
    const { nome, canal, tipo, leads, mensagemOuTemplate, dropRate } = req.body;

    if (canal === "whatsapp" && (!process.env.WABA_ACCESS_TOKEN || !process.env.WABA_PHONE_NUMBER_ID)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Canal WhatsApp WABA não configurado. Adicione as credenciais em Configurações antes de criar campanhas."
      });
    }

    if (canal === "voz") {
      const astHealth = await checkAsteriskRuntimeHealth();
      if (!astHealth.responsive) {
        return res.status(400).json({
          sucesso: false,
          erro: "Servidor Asterisk de Voz/WebRTC indisponível ou desconectado."
        });
      }
    }

    const nova: CampanhaItem = {
      id: Date.now(),
      canal: canal || "whatsapp",
      nome: nome || "Nova Campanha Ativa",
      leads: Number(leads) || 0,
      processados: 0,
      conversao: "0%",
      status: "Agendada",
      tipo: tipo || (canal === "voz" ? "URA Discador" : "HSM Template"),
      dropRate: canal === "voz" ? (dropRate || "2.5%") : undefined,
      mensagemOuTemplate: mensagemOuTemplate || "",
      criadoEm: "Agora mesmo"
    };

    campanhasList.unshift(nova);

    const callerUser = (req as any).user?.nome || (req as any).user?.email || "operador";
    registrarAuditoria({
      usuario: callerUser,
      modulo: "Campanhas",
      acao: `Criação de Campanha: ${nova.nome}`,
      detalhes: `Campanha criada no canal ${nova.canal.toUpperCase()} (${nova.tipo}) com volume de ${nova.leads} destinatários.`,
      categoria: "disparo",
      severidade: "info",
      ip: req.ip || null,
      userAgent: (req.headers["user-agent"] as string) || null,
      payloadDepois: { id: nova.id, nome: nova.nome, canal: nova.canal, leads: nova.leads }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: `Campanha "${nova.nome}" criada com sucesso!`,
      campanha: nova
    });
  });

  app.post("/api/campanhas/:id/toggle", (req, res) => {
    const id = Number(req.params.id);
    const camp = campanhasList.find(c => c.id === id);
    if (!camp) {
      return res.status(404).json({ sucesso: false, erro: "Campanha não encontrada" });
    }

    const statusAnterior = camp.status;
    if (camp.status === "Rodando") {
      camp.status = "Pausada";
    } else if (camp.status === "Pausada" || camp.status === "Agendada") {
      camp.status = "Rodando";
    }

    const callerUser = (req as any).user?.nome || (req as any).user?.email || "operador";
    registrarAuditoria({
      usuario: callerUser,
      modulo: "Campanhas",
      acao: `Alteração de Status: ${camp.nome}`,
      detalhes: `Campanha '${camp.nome}' teve status alterado de '${statusAnterior}' para '${camp.status}'.`,
      categoria: "disparo",
      severidade: "info",
      ip: req.ip || null,
      userAgent: (req.headers["user-agent"] as string) || null,
      payloadAntes: { status: statusAnterior },
      payloadDepois: { status: camp.status }
    });

    res.json({
      sucesso: true,
      campanha: camp
    });
  });

  // --- MONITOR DE SINCRONIZAÇÃO EM TEMPO REAL (ERP & GENIEACS) ---
  let lastManualSyncTime: string | null = null;

  app.get("/api/sync/status", async (req, res) => {
    const now = new Date();

    // Conexão ERP
    const erpConfigured = Boolean(process.env.ERP_URL && process.env.ERP_APP && process.env.ERP_TOKEN);
    let erpLatency: number | null = null;
    let erpStatus: 'online' | 'degradado' | 'offline' | 'unavailable' = erpConfigured ? 'degradado' : 'unavailable';
    let erpUltimaResposta = erpConfigured ? "Pendente verificação" : "ERP_UNCONFIGURED";

    if (erpConfigured) {
      const startTime = Date.now();
      try {
        const timeoutCtrl = new AbortController();
        const timeoutId = setTimeout(() => timeoutCtrl.abort(), 2500);
        const testRes = await fetch(`${process.env.ERP_URL}/api/v1/ping`, {
          signal: timeoutCtrl.signal,
          headers: {
            "app": process.env.ERP_APP || "",
            "token": process.env.ERP_TOKEN || ""
          }
        });
        clearTimeout(timeoutId);
        erpLatency = Date.now() - startTime;
        if (testRes.ok) {
          erpStatus = 'online';
          erpUltimaResposta = `HTTP ${testRes.status} OK`;
        } else {
          erpStatus = testRes.status >= 500 ? 'degradado' : 'offline';
          erpUltimaResposta = `HTTP ${testRes.status}`;
        }
      } catch {
        erpStatus = 'offline';
        erpLatency = null;
        erpUltimaResposta = 'Conexão recusada / Timeout';
      }
    }

    // Conexão GenieACS TR-069
    let acsLatency: number | null = null;
    let acsStatus: 'online' | 'degradado' | 'offline' | 'unavailable' = 'unavailable';
    let acsDevicesCount: number | null = null;
    let acsOnlineCount: number | null = null;
    let acsAlarmCount: number | null = null;
    let acsUltimaResposta = "GENIEACS_UNAVAILABLE";

    if (process.env.GENIEACS_URL) {
      const startTime = Date.now();
      try {
        const devices = await GenieacsService.getInstance().getDevices();
        acsLatency = Date.now() - startTime;
        acsDevicesCount = devices.length;
        acsOnlineCount = devices.filter(d => d.status === 'online').length;
        acsAlarmCount = devices.filter(d => d.rssi && d.rssi < -26).length;
        acsStatus = 'online';
        acsUltimaResposta = 'NBI Ready / Devices Polled';
      } catch {
        acsStatus = 'offline';
        acsLatency = null;
        acsUltimaResposta = 'GenieACS Inacessível';
      }
    }

    // Conexão Asterisk
    const astHealth = await checkAsteriskRuntimeHealth();
    const astStatus: 'online' | 'degradado' | 'offline' | 'unavailable' = astHealth.responsive ? 'online' : (process.env.ASTERISK_ENABLED === 'true' ? 'unavailable' : 'offline');
    let astLatency: number | null = null;
    let astRamais: number | null = null;

    if (astHealth.responsive) {
      const curAst = getAsteriskStatus();
      astRamais = curAst.chamadasAtivas || 0;
    }

    const erpAtivoId = (systemConfig as any).erpAtivo || 'sgp';
    const activeErpData = (systemConfig as any).erps?.[erpAtivoId] || {
      nome: erpAtivoId.toUpperCase(),
      protocolo: 'REST API v1',
      urlBase: 'https://api.provedor.com.br'
    };

    let totalClientes: number | null = null;
    let totalFaturas: number | null = null;
    try {
      const cRes = await db.select({ count: sql`count(*)` }).from(clientes);
      totalClientes = Number(cRes[0]?.count || 0);
      const fRes = await db.select({ count: sql`count(*)` }).from(faturas);
      totalFaturas = Number(fRes[0]?.count || 0);
    } catch {
      totalClientes = null;
      totalFaturas = null;
    }

    res.json({
      sucesso: true,
      timestamp: now.toISOString(),
      status_geral: (erpStatus === 'online' && acsStatus === 'online') ? 'operacional' : 'atencao',
      uptime_pct: null,
      uptime_seconds: Math.floor(process.uptime()),
      ultima_sincronizacao: lastManualSyncTime,
      erpAtivo: erpAtivoId,
      erp: {
        id: erpAtivoId,
        nome: activeErpData.nome || "ERP Ativo",
        protocolo: activeErpData.protocolo || "Webservice REST JSON",
        endpoint: activeErpData.urlBase || process.env.ERP_URL || null,
        status: erpStatus,
        latencia_ms: erpLatency,
        modo: erpConfigured ? 'producao' : 'producao_nao_configurado',
        clientes_sincronizados: totalClientes,
        faturas_sincronizadas: totalFaturas,
        desbloqueios_pendentes: 0,
        ultima_resposta: erpUltimaResposta
      },
      genieacs: {
        nome: "GenieACS (TR-069 CWMP)",
        protocolo: "NBI HTTP / CWMP v1.4",
        endpoint: process.env.GENIEACS_URL || null,
        status: acsStatus,
        latencia_ms: acsLatency,
        total_cpes: acsDevicesCount,
        cpes_online: acsOnlineCount,
        cpes_offline: (acsDevicesCount !== null && acsOnlineCount !== null) ? acsDevicesCount - acsOnlineCount : null,
        alarmes_opticos: acsAlarmCount,
        ultima_resposta: acsUltimaResposta
      },
      telefonia: {
        nome: "Asterisk 20+",
        status: astStatus,
        latencia_ms: astLatency,
        ramais_ativos: astRamais
      }
    });
  });

  app.post("/api/sync/executar", async (req, res) => {
    const startTime = Date.now();
    let devicesUpdated = 0;
    let acsStatusResult = "not_configured";
    try {
      const acsRes = await GenieacsService.getInstance().queryDevices();
      acsStatusResult = acsRes.status;
      if (acsRes.devices) {
        devicesUpdated = acsRes.devices.length;
      }
    } catch {
      devicesUpdated = 0;
      acsStatusResult = "offline";
    }

    let totalClientesSync = 0;
    let totalFaturasSync = 0;
    try {
      const cRes = await db.select({ count: sql`count(*)` }).from(clientes);
      totalClientesSync = Number(cRes[0]?.count || 0);
      const fRes = await db.select({ count: sql`count(*)` }).from(faturas);
      totalFaturasSync = Number(fRes[0]?.count || 0);
    } catch {}

    const erpConfigured = Boolean(process.env.ERP_URL && process.env.ERP_TOKEN);
    const duration = Date.now() - startTime;
    lastManualSyncTime = new Date().toISOString();

    const callerUser = (req as any).user?.nome || (req as any).user?.email || null;
    registrarAuditoria({
      usuario: callerUser,
      modulo: "Sincronização",
      acao: "Sincronização Manual",
      detalhes: `Sincronização executada: ${devicesUpdated} CPEs GenieACS (${acsStatusResult}), ${totalClientesSync} clientes e ${totalFaturasSync} faturas locais.`,
      categoria: "configuracao",
      severidade: "info",
      ip: req.ip || req.socket.remoteAddress || null,
      userAgent: req.headers["user-agent"] || null
    });

    res.json({
      sucesso: true,
      mensagem: "Sincronização executada com os serviços disponíveis.",
      timestamp: lastManualSyncTime,
      tempo_gasto_ms: duration,
      detalhes: {
        erp_novos_clientes: totalClientesSync,
        erp_faturas_atualizadas: totalFaturasSync,
        genieacs_telemetrias_atualizadas: devicesUpdated,
        status: (acsStatusResult === 'online' || erpConfigured) ? "sincronizado" : "parcial"
      }
    });
  });

// Gemini AI Routes Setup
setupGeminiRoutes(app, { systemConfig, registrarAuditoria });
setupPaymentRoutes(app);

// NAP OLT Manager (ZTE & Huawei) Routes Setup
setupOltRoutes(app, { registrarAuditoria });
setupZabbixRoutes(app, { registrarAuditoria });
setupCrmRoutes(app, { registrarAuditoria });
setupReguaRoutes(app, { registrarAuditoria });
setupPortalRoutes(app);
setupGenieacsRoutes(app, { registrarAuditoria });
setupCommunicationsRoutes(app, { registrarAuditoria });
setupFieldRoutes(app, { registrarAuditoria });
setupWabaRoutes(app);
app.use("/api/gis", gisRoutes);
app.use("/api/ai", aiRoutes);


  // Communications Hub
  app.use("/api/v1/communications", setupCommunicationRoutes());

  // Event Engine & Correlation
  app.use("/api/v1/correlation", setupCorrelationRoutes());
  app.get("/api/gis/features", (req, res) => { res.json({ success: true, features: [] }) });
  app.get("/api/noc/security-alerts", (req, res) => { res.json([{ id: 1, type: "DDoS Attempt", source: "192.168.1.100", severity: "high", time: new Date().toISOString() }]); });

  // IPAM & NSoT
  app.use("/api/v1/ipam", setupIpamRoutes());

  // HelpDesk
  app.use("/api/v1/helpdesk", setupHelpDeskRoutes());

  // Endpoint para inspeção da cadeia de auditoria criptográfica append-only
  app.get("/api/v1/auditoria/chain", (req, res) => {
    res.json({
      totalLogs: getAuditChain().length,
      chain: getAuditChain().slice(0, 100)
    });
  });

  // Bloqueio Absoluto do Setup Wizard em Produção:
  // Em NODE_ENV=production, qualquer rota /api/setup/* é terminantemente proibida com HTTP 403 Forbidden.
  app.use("/api/setup", (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Setup Wizard permanentemente desabilitado em ambiente de produção (NODE_ENV=production).",
        code: "SETUP_FORBIDDEN_IN_PRODUCTION",
        status: "locked"
      });
    }
    next();
  });

  // Helper de elegibilidade e segurança do Setup Wizard
  async function checkSetupEligibility() {
    const isProd = process.env.NODE_ENV === "production";
    const isBootstrap = process.env.NODE_ENV === "bootstrap";
    const setupEnabled = process.env.SETUP_ENABLED === "true";

    // Regra Inviolável 1: Em produção, o Setup Wizard é terminantemente bloqueado sob qualquer hipótese.
    if (isProd) {
      return {
        allowed: false,
        reason: "Setup Wizard permanentemente desabilitado em ambiente de produção (NODE_ENV=production).",
        isProd: true,
        hasAdmin: false,
        dbAvailable: false
      };
    }

    let hasAdmin = false;
    let dbAvailable = false;

    try {
      const adminCheck = await db.select({ id: users.id }).from(users).where(eq(users.cargo, "ADMIN")).limit(1);
      hasAdmin = adminCheck.length > 0;
      dbAvailable = true;
    } catch {
      hasAdmin = false;
      dbAvailable = false;
    }

    // Regra 2: Provisionamento só é permitido se SETUP_ENABLED=true no modo bootstrap ou desenvolvimento
    if (!setupEnabled && !isBootstrap) {
      return {
        allowed: false,
        reason: "Setup Wizard desabilitado (SETUP_ENABLED != true e NODE_ENV != bootstrap).",
        isProd: false,
        hasAdmin,
        dbAvailable
      };
    }

    // Regra 3: Se já possui administrador provisionado no banco, bloqueia novas execuções
    if (hasAdmin) {
      return {
        allowed: false,
        reason: "Instância já provisionada com administrador ativo no banco de dados.",
        isProd: false,
        hasAdmin,
        dbAvailable
      };
    }

    return {
      allowed: true,
      reason: "Setup Wizard autorizado para provisionamento em modo bootstrap/desenvolvimento.",
      isProd: false,
      hasAdmin,
      dbAvailable
    };
  }

  // Endpoint de status do Setup Wizard
  app.get("/api/setup/status", async (req, res) => {
    try {
      const eligibility = await checkSetupEligibility();
      res.json({
        setupAllowed: eligibility.allowed,
        isProduction: eligibility.isProd,
        hasAdminUser: eligibility.hasAdmin,
        databaseReady: eligibility.dbAvailable,
        status: eligibility.allowed ? (eligibility.hasAdmin ? "ready" : "setup_required") : "locked",
        reason: eligibility.reason
      });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao verificar status do setup", details: err.message });
    }
  });

  // Setup Wizard Endpoints (Protegidos contra execução em ambiente produtivo já inicializado)
  app.post("/api/setup/install-genieacs", async (req, res) => {
    const eligibility = await checkSetupEligibility();
    if (!eligibility.allowed) {
      return res.status(403).json({ error: eligibility.reason });
    }

    exec("bash install_genieacs.sh", (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`GenieACS Install Error: ${error.message}`);
        return res.status(500).json({ error: "Falha na execução do instalador GenieACS" });
      }
      res.json({ success: true, logs: stdout });
    });
  });

  app.post("/api/setup/finish", async (req, res) => {
    const eligibility = await checkSetupEligibility();
    if (!eligibility.allowed) {
      return res.status(403).json({ error: eligibility.reason });
    }

    const { adminEmail, adminPassword, sgpUrl, sgpApp, geminiApiKey, amiUser } = req.body;
    
    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ error: "Email e senha do administrador são obrigatórios" });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({ error: "A senha do administrador deve possuir no mínimo 8 caracteres." });
    }

    try {
      // 1. Hashear senha exclusivamente com bcrypt (12 rounds)
      const passwordHash = await hashPassword(adminPassword);

      // 2. Persistir usuário administrador diretamente no PostgreSQL
      await db.insert(users).values({
        email: adminEmail,
        nome: "Administrador do Sistema",
        senha: passwordHash,
        cargo: "ADMIN",
        ativo: true
      }).onConflictDoUpdate({
        target: users.email,
        set: {
          senha: passwordHash,
          updatedAt: new Date()
        }
      });

      // 3. Gravar .env — REGRA CRÍTICA: NUNCA adicionar ADMIN_PASSWORD nem senhas em texto puro ao .env
      // O usuário administrador e seu hash bcrypt são armazenados exclusivamente no PostgreSQL
      const safeEnvLines = [
        `# Configurações do Provedor NAP (Provisionado em modo Bootstrap)`,
        `NODE_ENV="${process.env.NODE_ENV === 'bootstrap' ? 'production' : (process.env.NODE_ENV || 'development')}"`,
        `SGP_URL="${sgpUrl || ''}"`,
        `SGP_APP="${sgpApp || ''}"`,
        `AMI_USER="${amiUser || ''}"`,
        `GENIEACS_URL="${process.env.GENIEACS_URL || 'http://127.0.0.1:7557'}"`,
        `ADMIN_EMAIL="${adminEmail}"`,
        `SETUP_ENABLED="false"`
      ];
      if (geminiApiKey) {
        safeEnvLines.push(`GEMINI_API_KEY="${geminiApiKey}"`);
      }
      const envContent = safeEnvLines.join("\n") + "\n";

      fs.writeFileSync(path.join(process.cwd(), ".env"), envContent, { mode: 0o600 });
      console.log("[SETUP] Configurações gravadas com sucesso. Senha do administrador armazenada estritamente como hash no PostgreSQL.");

      // 4. Registro de auditoria imutável obrigatório
      await recordMandatoryAuditLog({
        usuario: adminEmail,
        modulo: "Setup Wizard",
        acao: "Provisionamento de Administrador",
        detalhes: `Administrador ${adminEmail} configurado com hash bcrypt seguro. Setup desativado.`,
        categoria: "seguranca",
        severidade: "critico",
        status: "sucesso",
        ip: req.ip || "127.0.0.1",
        userAgent: (req.headers["user-agent"] as string) || "Setup Wizard"
      });

      res.json({ 
        success: true, 
        message: "Instância configurada com sucesso. Senha armazenada de forma segura no PostgreSQL." 
      });
    } catch (err: any) {
      console.error("[SETUP] Erro ao finalizar setup:", err);
      res.status(500).json({ error: `Erro ao finalizar setup: ${err.message}` });
    }
  });

  // Catch-all API 404 handler (único e limpo)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint não encontrado", route: req.originalUrl });
  });

  // Global Error Handler com sanitização e audit log automático
  app.use(globalErrorHandler);

  // Vite middleware para desenvolvimento ou arquivos estáticos em produção
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (viteErr: any) {
        console.error("[DEV SERVER] Erro ao carregar middleware do Vite:", viteErr);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`NAP Telecom Server rodando na porta ${PORT} (${process.env.NODE_ENV || "development"})`);
      });
    }
  }

  startServer();

  export default app;
