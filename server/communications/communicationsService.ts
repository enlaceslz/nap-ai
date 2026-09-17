import { TelegramGateway } from './telegramGateway';
import { randomBytes } from 'crypto';
import { NocCopilot } from './nocCopilot';

/**
 * COMMUNICATIONS HUB SERVICE
 * Camada de orquestração (Notification Engine, RBAC, Identidade).
 */

export interface TelegramBinding {
  napUserId: string;
  napRole: 'admin' | 'noc' | 'engenharia' | 'tecnico';
  telegramUserId: number;
  telegramChatId: number;
  status: 'active' | 'revoked' | 'pending';
  code?: string;
}

export class CommunicationsService {
  private static instance: CommunicationsService;
  private gateway: TelegramGateway;
  private copilot: NocCopilot;
  
  // Data stores (Mocking DB tables per PRD #56)
  private bindings: TelegramBinding[] = [];
  private auditFn: any = null;

  private constructor() {
    this.gateway = TelegramGateway.getInstance();
    this.copilot = new NocCopilot();
  }

  public static getInstance(): CommunicationsService {
    if (!CommunicationsService.instance) {
      CommunicationsService.instance = new CommunicationsService();
    }
    return CommunicationsService.instance;
  }

  public setAuditFunction(fn: any) {
    this.auditFn = fn;
  }

  private audit(action: string, details: string, user: string = 'System', severity: string = 'info') {
    if (this.auditFn) {
      this.auditFn({
        usuario: user,
        modulo: "Communications Hub",
        acao: action,
        detalhes: details,
        categoria: "telemetria", // or general communication
        severidade: severity,
        ip: "127.0.0.1",
        userAgent: "Telegram Bot Gateway"
      });
    }
  }

  // --- Identidade e Vinculação (PRD #9 e #10) ---

  public generateBindingCode(napUserId: string, napRole: any): string {
    const code = randomBytes(3).toString('hex').toUpperCase(); // Ex: 4A2F8B
    
    // Remove existing pending for this user
    this.bindings = this.bindings.filter(b => b.napUserId !== napUserId);
    
    this.bindings.push({
      napUserId,
      napRole,
      telegramUserId: 0,
      telegramChatId: 0,
      status: 'pending',
      code
    });

    this.audit("Geração de Código de Vínculo", `Código gerado para usuário NAP: ${napUserId}`);
    return code;
  }

  public async processWebhook(update: any) {
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const tgUserId = update.message.from.id;
      const text = update.message.text.trim();

      // Verifica se é uma tentativa de vínculo
      const pendingBinding = this.bindings.find(b => b.status === 'pending' && b.code === text);
      if (pendingBinding) {
        pendingBinding.telegramUserId = tgUserId;
        pendingBinding.telegramChatId = chatId;
        pendingBinding.status = 'active';
        delete pendingBinding.code;

        this.audit("Vínculo Telegram Confirmado", `Telegram ID ${tgUserId} vinculado ao NAP User ${pendingBinding.napUserId}`, pendingBinding.napUserId);
        await this.gateway.sendMessage(chatId, "✅ <b>Vínculo confirmado com sucesso!</b>\nVocê agora está conectado ao NAP (Network Automation Platform) com o perfil: <i>" + pendingBinding.napRole + "</i>.");
        return;
      }

      // Identifica o usuário
      const activeUser = this.bindings.find(b => b.status === 'active' && b.telegramUserId === tgUserId);
      if (!activeUser) {
        await this.gateway.sendMessage(chatId, "⚠️ Acesso Negado. Seu usuário do Telegram não está vinculado a uma conta do NAP. Gere um código no painel e envie aqui.");
        return;
      }

      // Processamento de Comandos Básicos (PRD #18 e #20)
      if (text.startsWith('/status')) {
        await this.gateway.sendMessage(chatId, "📊 <b>Status NAP</b>\nTodos os serviços operacionais estão online.");
        this.audit("Comando Executado", "Executou /status", activeUser.napUserId);
      } else {
        // Envio para Inteligência Artificial (NOC Copilot via Telegram)
        await this.gateway.sendMessage(chatId, "🤖 <i>Processando sua solicitação via NAP Copilot... (IA RAG)</i>");
        
        // AI Gateway & RAG Integration (Fase 6 - PRD #41)
        try {
          const aiResponse = await this.copilot.ask(text, activeUser.napRole, activeUser.napUserId);
          await this.gateway.sendMessage(chatId, aiResponse);
          this.audit("Consulta IA Telegram", `User perguntou: "${text}"`, activeUser.napUserId);
        } catch (e) {
          await this.gateway.sendMessage(chatId, "⚠️ Erro interno no Copilot.");
        }
      }
    } else if (update.callback_query) {
      // Processamento de Botões Interativos (PRD #17)
      const tgUserId = update.callback_query.from.id;
      const data = update.callback_query.data;
      const activeUser = this.bindings.find(b => b.status === 'active' && b.telegramUserId === tgUserId);
      
      if (activeUser) {
        this.audit("Botão Interativo", `Ação de botão: ${data}`, activeUser.napUserId, "medio");
        // Em um cenário real, executaríamos a ação no NAP (ex: ACK do Zabbix)
      }
    }
  }

  // --- Notification Engine (PRD #7 e #13) ---
  
  public async dispatchNotification(options: { severity: string, message: string, requiredRoles?: string[] }) {
    // Find matching active bindings
    const targets = this.bindings.filter(b => b.status === 'active');
    
    // Simulate Dispatch
    for (const target of targets) {
      // Regra RBAC básica: Só envia se não tiver filtro de role, ou se o usuário tiver a role
      if (!options.requiredRoles || options.requiredRoles.includes(target.napRole)) {
        
        const prefix = options.severity === 'critical' ? '🚨 <b>INCIDENTE CRÍTICO</b>' : '⚠️ <b>ALERTA</b>';
        const msg = `${prefix}\n\n${options.message}`;
        
        // Botões (PRD #17)
        const buttons = {
          inline_keyboard: [
            [{ text: "Reconhecer (ACK)", callback_data: "ack_incident" }],
            [{ text: "Ver no GIS", callback_data: "open_gis" }]
          ]
        };

        await this.gateway.sendMessage(msg, target.telegramChatId.toString(), "HTML");
      }
    }
  }

  public getBindings() {
    return this.bindings;
  }
}
