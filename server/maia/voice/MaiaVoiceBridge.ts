/**
 * MAIA V3 — Voice Bridge (Asterisk Telephony Integration)
 * Vincula inequivocamente sessões de voz da MaIA aos canais do Asterisk 20+
 * utilizando UniqueID e LinkedID reais (NUNCA Date.now() ou Math.random()).
 */

import { MaiaSecurityContext } from "../core/types";
import { MaiaSessionService } from "../sessions/MaiaSessionService";
import crypto from "crypto";

export interface AsteriskVoiceSessionBinding {
  sessionId: string;
  asteriskChannelId: string;
  asteriskUniqueId: string;
  linkedId: string;
  callerNumber: string;
  status: 'CONNECTED' | 'BRIDGED' | 'HANGUP';
  createdAt: string;
}

export class MaiaVoiceBridge {
  private static activeVoiceSessions = new Map<string, AsteriskVoiceSessionBinding>();

  /**
   * Vincula uma sessão da MaIA ao canal e identificadores oficiais do Asterisk ARI/AMI
   */
  public static bindAsteriskSession(params: {
    sessionId?: string;
    asteriskChannelId: string;
    asteriskUniqueId: string;
    linkedId?: string;
    callerNumber: string;
    tenantId?: string;
  }): AsteriskVoiceSessionBinding {
    if (!params.asteriskUniqueId || params.asteriskUniqueId.trim() === '') {
      throw new Error('[MaiaVoiceBridge] UniqueID real do Asterisk é obrigatório. NUNCA utilize Date.now() ou identificadores aleatórios.');
    }

    const sessionId = params.sessionId || `voice_${crypto.randomUUID()}`;
    const linkedId = params.linkedId || params.asteriskUniqueId;

    const binding: AsteriskVoiceSessionBinding = {
      sessionId,
      asteriskChannelId: params.asteriskChannelId,
      asteriskUniqueId: params.asteriskUniqueId,
      linkedId,
      callerNumber: params.callerNumber,
      status: 'CONNECTED',
      createdAt: new Date().toISOString()
    };

    this.activeVoiceSessions.set(params.asteriskUniqueId, binding);
    return binding;
  }

  public static getSessionByUniqueId(uniqueId: string): AsteriskVoiceSessionBinding | undefined {
    return this.activeVoiceSessions.get(uniqueId);
  }

  public static async handleHangup(uniqueId: string): Promise<void> {
    const binding = this.activeVoiceSessions.get(uniqueId);
    if (binding) {
      binding.status = 'HANGUP';
      await MaiaSessionService.endSession(binding.sessionId, 'completed');
      this.activeVoiceSessions.delete(uniqueId);
    }
  }

  /**
   * Status de prontidão da infraestrutura de voz em tempo real (Gemini Live API)
   * Declara explicitamente NOT_IMPLEMENTED se o stack Asterisk External Media RTP/PCM não estiver ativo.
   */
  public static checkLiveVoiceCapability(): {
    status: 'READY' | 'NOT_IMPLEMENTED';
    supported: boolean;
    reason: string;
  } {
    const hasExternalMedia = Boolean(process.env.ASTERISK_EXTERNAL_MEDIA_HOST);
    const hasLiveKey = Boolean(process.env.GEMINI_API_KEY);

    if (hasExternalMedia && hasLiveKey) {
      return {
        status: 'READY',
        supported: true,
        reason: 'Ponte de áudio bidirecional Asterisk ARI External Media configurada.'
      };
    }

    return {
      status: 'NOT_IMPLEMENTED',
      supported: false,
      reason: 'Gemini Live Voice BIDI via WebSockets/External Media não configurado no host. Operando em modo padrão de voz com TTS/STT.'
    };
  }
}
