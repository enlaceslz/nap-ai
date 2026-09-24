import { Express, Request, Response } from 'express';
import { OltService } from './oltService';
import { AuthorizeOnuPayload, BatchOnuOperationPayload } from './types';
import { requirePermission } from '../auth/rbacMiddleware';
import { z } from 'zod';

const AuthorizeOnuSchema = z.object({
  olt_id: z.string().min(1, 'olt_id é obrigatório'),
  pon_identifier: z.string().min(1, 'pon_identifier é obrigatório'),
  serial: z.string().min(4, 'Serial da ONU é obrigatório'),
  cliente_id: z.union([z.string(), z.number()]).optional(),
  cliente_nome: z.string().optional(),
  vlan: z.number().int().min(1).max(4094),
  profile_name: z.string().optional()
});

const BatchOnuSchema = z.object({
  onu_ids: z.array(z.string()).min(1, 'Lista onu_ids não pode ser vazia'),
  operation: z.enum(['reboot', 'enable', 'disable']),
  reason: z.string().optional()
});

export function setupOltRoutes(
  app: Express,
  deps: {
    registrarAuditoria?: (entry: {
      usuario: string;
      usuarioEmail?: string;
      usuarioRole?: string;
      modulo: string;
      acao: string;
      detalhes: string;
      categoria?: string;
      severidade?: 'info' | 'atencao' | 'critico';
      ip?: string;
      userAgent?: string;
      status?: 'sucesso' | 'falha';
    }) => void;
  }
) {
  const oltService = OltService.getInstance();
  const registrarAuditoria = deps.registrarAuditoria || ((_e) => {});

  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || '127.0.0.1';
  };

  // Identidade obtida ESTRITAMENTE do contexto criptográfico autenticado (req.user), NUNCA de headers do cliente
  const getUserIdentity = (req: Request) => {
    return {
      nome: req.user?.nome || 'Operador Autenticado',
      email: req.user?.email || 'sistema',
      role: req.user?.role || 'NOC'
    };
  };

  // ==================== DASHBOARD & ALARMES ====================

  app.get('/api/v1/olts-dashboard', requirePermission('OLT_READ'), (req: Request, res: Response) => {
    try {
      const metrics = oltService.getDashboardMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao obter métricas de OLTs' });
    }
  });

  app.get('/api/v1/olts-alarms', requirePermission('OLT_READ'), (req: Request, res: Response) => {
    try {
      const oltId = req.query.olt_id as string;
      const alarms = oltService.getAlarms(oltId);
      res.json(alarms);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar alarmes' });
    }
  });

  app.post('/api/v1/olts-alarms/:id/ack', requirePermission('OLT_UPDATE'), (req: Request, res: Response) => {
    try {
      const success = oltService.acknowledgeAlarm(req.params.id);
      if (success) {
        const user = getUserIdentity(req);
        registrarAuditoria({
          usuario: user.nome,
          usuarioEmail: user.email,
          usuarioRole: user.role,
          modulo: 'OLT Manager (GPON)',
          acao: 'RECONHECER_ALARME',
          detalhes: `Alarme ${req.params.id} reconhecido por operador`,
          ip: getClientIp(req),
          status: 'sucesso',
          severidade: 'info'
        });
      }
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao reconhecer alarme' });
    }
  });

  app.get('/api/v1/olts-profiles', async (req: Request, res: Response) => {
    try {
      const oltId = req.query.olt_id as string;
      const profiles = await oltService.getProfiles(oltId);
      res.json(profiles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== OLT CRUD & DISCOVERY ====================

  app.get('/api/v1/olts', (req: Request, res: Response) => {
    try {
      const olts = oltService.getOlts();
      res.json(olts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/olts/:id', (req: Request, res: Response) => {
    try {
      const olt = oltService.getOltById(req.params.id);
      if (!olt) return res.status(404).json({ error: 'OLT não encontrada' });
      res.json(olt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/v1/olts', async (req: Request, res: Response) => {
    try {
      const newOlt = await oltService.createOlt(req.body);
      const user = getUserIdentity(req);
      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'CADASTRAR_OLT',
        detalhes: `Cadastrada OLT ${newOlt.nome} (${newOlt.fabricante} ${newOlt.modelo}) no IP ${newOlt.ip}`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });
      res.status(201).json(newOlt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/v1/olts/:id', (req: Request, res: Response) => {
    try {
      const updated = oltService.updateOlt(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'OLT não encontrada' });
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'ATUALIZAR_OLT',
        detalhes: `Atualizadas configurações da OLT ${updated.nome}`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/v1/olts/:id', (req: Request, res: Response) => {
    try {
      const olt = oltService.getOltById(req.params.id);
      const success = oltService.deleteOlt(req.params.id);
      if (!success) return res.status(404).json({ error: 'OLT não encontrada' });
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'EXCLUIR_OLT',
        detalhes: `OLT ${olt?.nome || req.params.id} e suas portas/ONUs foram removidas do sistema`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'atencao'
      });
      res.json({ success: true, message: 'OLT removida com sucesso' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/v1/olts/:id/test-connection', async (req: Request, res: Response) => {
    try {
      const result = await oltService.testConnection(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/olts/:id/discovery', async (req: Request, res: Response) => {
    try {
      const olt = oltService.getOltById(req.params.id);
      const result = await oltService.runDiscovery(req.params.id);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'DISCOVERY_OLT',
        detalhes: `Descoberta executada na OLT ${olt?.nome}. Identificados ${result.slots.length} slots e ${result.pons.length} interfaces PON.`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/olts/:id/slots', (req: Request, res: Response) => {
    try {
      const slots = oltService.getSlots(req.params.id);
      res.json(slots);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/olts/:id/pons', (req: Request, res: Response) => {
    try {
      const pons = oltService.getPons(req.params.id);
      res.json(pons);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/pons', (req: Request, res: Response) => {
    try {
      const pons = oltService.getPons();
      res.json(pons);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== ONUS & CLIENTES ÓPTICOS ====================

  app.get('/api/v1/onus', (req: Request, res: Response) => {
    try {
      const filters = {
        olt_id: req.query.olt_id as string,
        pon_identifier: req.query.pon_identifier as string,
        status: req.query.status as string,
        search: req.query.search as string
      };
      const onus = oltService.getOnus(filters);
      res.json(onus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/onus/unassigned', (req: Request, res: Response) => {
    try {
      const oltId = req.query.olt_id as string;
      const unassigned = oltService.getUnassignedOnus(oltId);
      res.json(unassigned);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/v1/onus/:id', (req: Request, res: Response) => {
    try {
      const onu = oltService.getOnuById(req.params.id);
      if (!onu) return res.status(404).json({ error: 'ONU não encontrada' });
      res.json(onu);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/v1/onus', requirePermission('ONU_PROVISION'), async (req: Request, res: Response) => {
    try {
      const parseResult = AuthorizeOnuSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Dados de provisionamento inválidos',
          detalhes: parseResult.error.format()
        });
      }
      const payload: AuthorizeOnuPayload = parseResult.data as any;
      const result = await oltService.authorizeOnu(payload);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'PROVISIONAR_ONU',
        detalhes: `ONU provisionada com sucesso: Serial ${payload.serial} na PON ${payload.pon_identifier} com VLAN ${payload.vlan} (Cliente: ${payload.cliente_nome || 'N/A'})`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao autorizar ONU' });
    }
  });

  app.post('/api/v1/onus/:id/reboot', requirePermission('ONU_REBOOT'), async (req: Request, res: Response) => {
    try {
      const onu = oltService.getOnuById(req.params.id);
      const result = await oltService.rebootOnu(req.params.id);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'REBOOT_ONU',
        detalhes: `Comando de reinicialização enviado para ONU ${onu?.serial || req.params.id} (PON ${onu?.pon_identifier})`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao reiniciar ONU' });
    }
  });

  app.post('/api/v1/onus/:id/enable', requirePermission('ONU_ENABLE'), async (req: Request, res: Response) => {
    try {
      const onu = oltService.getOnuById(req.params.id);
      const result = await oltService.enableOnu(req.params.id);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'DESBLOQUEAR_ONU',
        detalhes: `ONU ${onu?.serial || req.params.id} desbloqueada administrativamente`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'info'
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao habilitar ONU' });
    }
  });

  app.post('/api/v1/onus/:id/disable', requirePermission('ONU_DISABLE'), async (req: Request, res: Response) => {
    try {
      const onu = oltService.getOnuById(req.params.id);
      const result = await oltService.disableOnu(req.params.id);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'BLOQUEAR_ONU',
        detalhes: `ONU ${onu?.serial || req.params.id} bloqueada administrativamente`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'atencao'
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao bloquear ONU' });
    }
  });

  app.delete('/api/v1/onus/:id', requirePermission('ONU_DELETE'), async (req: Request, res: Response) => {
    try {
      const onu = oltService.getOnuById(req.params.id);
      const result = await oltService.deleteOnu(req.params.id);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'REMOVER_ONU',
        detalhes: `ONU ${onu?.serial || req.params.id} removida e desprovisionada da OLT ${onu?.olt_nome}`,
        ip: getClientIp(req),
        status: 'sucesso',
        severidade: 'atencao'
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao remover ONU' });
    }
  });

  app.get('/api/v1/onus/:id/optical', requirePermission('ONU_READ'), async (req: Request, res: Response) => {
    try {
      const telemetry = await oltService.getOpticalInfo(req.params.id);
      res.json(telemetry);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar telemetria óptica' });
    }
  });

  app.get('/api/v1/onus/:id/diagnostics', requirePermission('ONU_READ'), async (req: Request, res: Response) => {
    try {
      const diagnostics = await oltService.runDiagnostics(req.params.id);
      res.json(diagnostics);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro nos diagnósticos da ONU' });
    }
  });

  app.post('/api/v1/onus/batch', requirePermission('ONU_BATCH'), async (req: Request, res: Response) => {
    try {
      const parseResult = BatchOnuSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Payload de lote inválido',
          detalhes: parseResult.error.format()
        });
      }
      const payload: any = parseResult.data;
      const result = await oltService.executeBatchOperation(payload);
      const user = getUserIdentity(req);

      registrarAuditoria({
        usuario: user.nome,
        usuarioEmail: user.email,
        usuarioRole: user.role,
        modulo: 'OLT Manager (GPON)',
        acao: 'BATCH_ONU_OPERATION',
        detalhes: `Operação em lote '${payload.operation}' executada para ${payload.onu_ids.length} ONUs. Sucesso: ${result.success}, Falhas: ${result.failed}`,
        ip: getClientIp(req),
        status: result.failed > 0 ? 'falha' : 'sucesso',
        severidade: result.failed > 0 ? 'atencao' : 'info'
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao executar lote de ONUs' });
    }
  });
}
