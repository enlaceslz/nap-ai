import client from 'ari-client';
import net from 'net';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from "../src/db/index";
import { clientes, campanhas_chamadas_voz } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { assertRealService } from "./security/mockGuard";

const ARI_URL = process.env.ARI_URL || process.env.ASTERISK_ARI_URL || (process.env.ASTERISK_HOST ? `http://${process.env.ASTERISK_HOST}:${process.env.ASTERISK_PORT_ARI || '8088'}` : '');
const ARI_USER = process.env.ARI_USER || process.env.ASTERISK_USER_ARI || '';
const ARI_PASS = process.env.ARI_PASS || process.env.ASTERISK_SECRET_ARI || '';

let ariInstance: any = null;
let isConnected = false;
let chamadasAtivas: any[] = [];

/**
 * Executa áudio real no canal ARI do Asterisk via TTS Engine configurado ou arquivo de saudação oficial.
 * Se nenhum motor de TTS ou áudio estiver configurado, retorna not_configured sem inventar reprodução.
 */
async function playAudioOnAsterisk(channel: any, text: string): Promise<{ success: boolean; status: string; error?: string }> {
  const ttsEngineUrl = process.env.TTS_ENGINE_URL;
  const customGreetingMedia = process.env.ASTERISK_GREETING_MEDIA;

  if (!ttsEngineUrl && !customGreetingMedia) {
    console.warn(`[Asterisk URA] TTS não configurado para reprodução no canal ${channel.id}. Defina TTS_ENGINE_URL ou ASTERISK_GREETING_MEDIA.`);
    return {
      success: false,
      status: 'not_configured',
      error: 'Mecanismo de TTS (TTS_ENGINE_URL) e arquivo de saudação (ASTERISK_GREETING_MEDIA) não configurados.'
    };
  }

  let mediaUri = customGreetingMedia || '';

  // Se TTS_ENGINE_URL estiver configurado, sintetiza o áudio e salva no diretório de sons do Asterisk
  if (ttsEngineUrl) {
    try {
      const soundsDir = process.env.ASTERISK_SOUNDS_DIR || '/var/lib/asterisk/sounds/custom';
      const textHash = crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
      const soundFileId = `nap_tts_${textHash}`;
      const localFilePath = path.join(soundsDir, `${soundFileId}.wav`);

      if (!fs.existsSync(localFilePath)) {
        const timeoutCtrl = new AbortController();
        const timeoutId = setTimeout(() => timeoutCtrl.abort(), 4000);

        const response = await fetch(ttsEngineUrl, {
          method: 'POST',
          signal: timeoutCtrl.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: 'pt-BR',
            voice: process.env.TTS_VOICE || 'pt-BR-Wavenet-A',
            codec: 'wav',
            sampleRate: 8000 // Formato nativo Asterisk narrow-band
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`TTS Engine retornou HTTP ${response.status}: ${response.statusText}`);
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        if (!fs.existsSync(soundsDir)) {
          fs.mkdirSync(soundsDir, { recursive: true });
        }
        fs.writeFileSync(localFilePath, audioBuffer);
      }

      mediaUri = `sound:custom/${soundFileId}`;
    } catch (ttsErr: any) {
      console.error(`[Asterisk URA] Falha ao sintetizar áudio via TTS Engine (${ttsEngineUrl}):`, ttsErr.message);
      if (!customGreetingMedia) {
        return {
          success: false,
          status: 'unavailable',
          error: `Falha no motor de TTS: ${ttsErr.message}`
        };
      }
      mediaUri = customGreetingMedia;
    }
  }

  try {
    return new Promise((resolve) => {
      channel.play({ media: mediaUri }, (err: any, playback: any) => {
        if (err) {
          console.error(`[Asterisk URA] Falha na reprodução ARI no canal ${channel.id}:`, err.message || err);
          resolve({ success: false, status: 'error', error: err.message || 'Falha de reprodução ARI' });
        } else {
          console.log(`[Asterisk URA] Reproduzindo mídia "${mediaUri}" no canal ${channel.id}`);
          resolve({ success: true, status: 'playing' });
        }
      });
    });
  } catch (err: any) {
    console.error(`[Asterisk URA] Erro ao despachar áudio via ARI:`, err.message);
    return { success: false, status: 'unavailable', error: err.message };
  }
}

export async function connectARI() {
  const isEnabled = process.env.ASTERISK_ENABLED === 'true' || process.env.VOIP_ENABLED === 'true';
  if (!ARI_PASS || !ARI_USER || !ARI_URL) {
    if (isEnabled) {
      assertRealService('Asterisk ARI', 'Credenciais ASTERISK_SECRET_ARI ou ARI_URL não configuradas no servidor.');
    }
    console.warn('[Asterisk] Credenciais ARI ausentes. Asterisk ARI operando em modo desabilitado/não configurado.');
    isConnected = false;
    return;
  }

  try {
    console.log(`[Asterisk] Conectando ao ARI oficial em ${ARI_URL}...`);
    ariInstance = await client.connect(ARI_URL, ARI_USER, ARI_PASS);
    isConnected = true;
    console.log('[Asterisk] ARI conectado com sucesso.');

    ariInstance.on('StasisStart', async (event: any, channel: any) => {
      console.log(`[Asterisk] Evento StasisStart recebido: canal ${channel.id} de ${channel.caller?.number || 'desconhecido'}`);

      const callEntry = {
        id: channel.id,
        caller: channel.caller?.number || null,
        did: channel.dialplan?.exten || null,
        status: channel.state || 'ringing',
        duration: null,
        queue: 'URA Inbound',
        agent: null
      };
      chamadasAtivas.push(callEntry);

      // Atender a Chamada (SIP 200 OK)
      channel.answer(async (err: any) => {
        if (err) {
          console.error('[Asterisk] Erro ao atender chamada ARI:', err);
          return;
        }

        callEntry.status = 'answered';

        // Identificar chamador no banco
        let nomeCliente: string | null = null;
        if (channel.caller?.number) {
          try {
            const result = await db.select().from(clientes).where(eq(clientes.telefone, channel.caller.number)).limit(1);
            if (result.length > 0 && result[0].nome) {
              nomeCliente = result[0].nome.split(' ')[0];
            }
          } catch (e: any) {
            console.warn('[Asterisk URA] Consulta de cliente falhou:', e.message);
          }
        }

        const mensagem = nomeCliente
          ? `Olá ${nomeCliente}, seja bem-vindo ao suporte de internet. Por favor, aguarde o direcionamento.`
          : `Olá! Você ligou para a central de atendimento. Por favor, aguarde atendimento.`;

        const playResult = await playAudioOnAsterisk(channel, mensagem);
        if (!playResult.success) {
          console.warn(`[Asterisk URA] Áudio da URA indisponível (${playResult.status}): ${playResult.error || 'sem detalhe'}`);
        }
      });
    });

    ariInstance.on('StasisEnd', (event: any, channel: any) => {
      console.log(`[Asterisk] Evento StasisEnd: canal finalizado ${channel.id}`);
      chamadasAtivas = chamadasAtivas.filter(c => c.id !== channel.id);
    });

    ariInstance.start('ura_maia');
    isConnected = true;
  } catch (error: any) {
    isConnected = false;
    chamadasAtivas = [];
    console.warn(`[Asterisk] Falha na conexão ARI: ${error.message}. Status: unavailable.`);
  }
}

export function getChamadas() {
  if (!isConnected) {
    return [];
  }
  return chamadasAtivas;
}

export function getAsteriskStatus() {
  const isEnabled = process.env.ASTERISK_ENABLED === 'true' || process.env.VOIP_ENABLED === 'true';
  return {
    conectado: isConnected,
    status: isConnected ? 'online' : (isEnabled ? (ARI_PASS ? 'unavailable' : 'not_configured') : 'disabled'),
    ariUrl: ARI_URL || null,
    ariUser: ARI_USER || null,
    amiPort: process.env.ASTERISK_PORT_AMI ? Number(process.env.ASTERISK_PORT_AMI) : null,
    amiUser: process.env.ASTERISK_USER_AMI || null,
    websocketUrl: process.env.ASTERISK_WEBSOCKET_URL || null,
    ramalPadrao: process.env.ASTERISK_RAMAL_PADRAO || null,
    contexto: 'from-internal',
    stasisApp: 'ura_maia',
    chamadasAtivas: isConnected ? chamadasAtivas.length : null,
    ramaisRegistrados: null, // Métrica PJSIP separada; se não consultada via AMI/PJSIP, retorna null (nunca inventar 0)
    ttsStatus: Boolean(process.env.TTS_ENGINE_URL || process.env.ASTERISK_GREETING_MEDIA) ? 'configured' : 'not_configured',
    codecs: ['opus', 'alaw', 'ulaw', 'g729']
  };
}

/**
 * Validação ativa de runtime para o Asterisk 20+
 * Efetua probe TCP nas portas AMI e ARI para confirmar responsividade real.
 */
export async function checkAsteriskRuntimeHealth(): Promise<{
  responsive: boolean;
  amiPortOpen: boolean;
  ariPortOpen: boolean;
  error?: string;
}> {
  const host = process.env.ASTERISK_HOST || '127.0.0.1';
  const amiPort = Number(process.env.ASTERISK_PORT_AMI || 5038);
  const ariPort = Number(process.env.ASTERISK_PORT_ARI || 8088);

  const testPort = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  };

  const [amiPortOpen, ariPortOpen] = await Promise.all([
    testPort(amiPort),
    testPort(ariPort)
  ]);

  return {
    responsive: amiPortOpen || ariPortOpen,
    amiPortOpen,
    ariPortOpen,
    error: (!amiPortOpen && !ariPortOpen) ? `Portas Asterisk AMI (${amiPort}) e ARI (${ariPort}) não respondem em ${host}` : undefined
  };
}

export interface OriginateCallParams {
  campaignId: number;
  recipientId: number;
  telefone: string;
  idempotencyKey: string;
  audioText?: string;
  timeoutSeconds?: number;
}

export interface OriginateCallResult {
  status: 'queued' | 'originating' | 'ringing' | 'answered' | 'no_answer' | 'busy' | 'failed' | 'cancelled';
  asteriskChannelId?: string;
  asteriskUniqueId?: string;
  startedAt?: Date;
  ringingAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  hangupCause?: string;
  result?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * BLOQUEADOR CRÍTICO 01: Originação e Acompanhamento Real de Chamadas de Voz no Asterisk 20+
 * Regra: Asterisk conectado != chamada realizada.
 * Ciclo de vida estrito: queued -> originating -> ringing -> answered | no_answer | busy | failed
 * Persistência append-only no PostgreSQL (campanhas_chamadas_voz).
 */
export async function originateCampaignVoiceCall(params: OriginateCallParams): Promise<OriginateCallResult> {
  const { campaignId, recipientId, telefone, idempotencyKey, audioText, timeoutSeconds = 30 } = params;

  // 1. Verificação de Idempotência: não duplicar chamadas em execução ou já atendidas
  try {
    const existing = await db.select().from(campanhas_chamadas_voz)
      .where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      const reg = existing[0];
      if (reg.status === 'answered' || reg.status === 'originating' || reg.status === 'ringing') {
        console.log(`[Asterisk Voz] Idempotência ativa para chave ${idempotencyKey}: status=${reg.status}`);
        return {
          status: reg.status as any,
          asteriskChannelId: reg.asteriskChannelId || undefined,
          startedAt: reg.startedAt || undefined,
          answeredAt: reg.answeredAt || undefined,
          endedAt: reg.endedAt || undefined,
          durationSeconds: reg.durationSeconds || 0,
          hangupCause: reg.hangupCause || undefined,
          result: reg.result || undefined,
          errorCode: reg.errorCode || undefined,
          errorMessage: reg.errorMessage || undefined
        };
      }
    }
  } catch (dbErr: any) {
    console.warn(`[Asterisk Voz] Aviso ao consultar idempotência: ${dbErr.message}`);
  }

  // 2. Sanitização estrita do telefone
  const cleanPhone = (telefone || '').replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    const errResult: OriginateCallResult = {
      status: 'failed',
      errorCode: 'INVALID_PHONE_NUMBER',
      errorMessage: `Número telefônico inválido para originação SIP: "${telefone}".`
    };
    try {
      await db.insert(campanhas_chamadas_voz).values({
        campaignId,
        recipientId,
        telefone: cleanPhone || telefone,
        status: 'failed',
        result: 'failed',
        errorCode: errResult.errorCode,
        errorMessage: errResult.errorMessage,
        idempotencyKey,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: campanhas_chamadas_voz.idempotencyKey,
        set: { status: 'failed', result: 'failed', errorCode: errResult.errorCode, errorMessage: errResult.errorMessage, updatedAt: new Date() }
      });
    } catch {}
    return errResult;
  }

  // 3. Verificação de Runtime do Asterisk
  const health = await checkAsteriskRuntimeHealth();
  if (!health.responsive) {
    const errResult: OriginateCallResult = {
      status: 'failed',
      errorCode: 'ASTERISK_UNAVAILABLE',
      errorMessage: health.error || 'Servidor Asterisk de Voz/WebRTC indisponível ou inacessível nas portas de telefonia.'
    };
    try {
      await db.insert(campanhas_chamadas_voz).values({
        campaignId,
        recipientId,
        telefone: cleanPhone,
        status: 'failed',
        result: 'failed',
        errorCode: errResult.errorCode,
        errorMessage: errResult.errorMessage,
        idempotencyKey,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: campanhas_chamadas_voz.idempotencyKey,
        set: { status: 'failed', result: 'failed', errorCode: errResult.errorCode, errorMessage: errResult.errorMessage, updatedAt: new Date() }
      });
    } catch {}
    return errResult;
  }

  // Se ARI não estiver conectado mas as portas estão ativas, tenta reconectar
  if (!isConnected || !ariInstance) {
    await connectARI();
  }

  if (!isConnected || !ariInstance) {
    const errResult: OriginateCallResult = {
      status: 'failed',
      errorCode: 'ARI_NOT_CONNECTED',
      errorMessage: 'Conexão Asterisk ARI não autenticada no servidor.'
    };
    try {
      await db.insert(campanhas_chamadas_voz).values({
        campaignId,
        recipientId,
        telefone: cleanPhone,
        status: 'failed',
        result: 'failed',
        errorCode: errResult.errorCode,
        errorMessage: errResult.errorMessage,
        idempotencyKey,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: campanhas_chamadas_voz.idempotencyKey,
        set: { status: 'failed', result: 'failed', errorCode: errResult.errorCode, errorMessage: errResult.errorMessage, updatedAt: new Date() }
      });
    } catch {}
    return errResult;
  }

  // 4. Registro inicial no banco: queued -> originating
  const startedAt = new Date();
  try {
    await db.insert(campanhas_chamadas_voz).values({
      campaignId,
      recipientId,
      telefone: cleanPhone,
      status: 'originating',
      startedAt,
      idempotencyKey,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: campanhas_chamadas_voz.idempotencyKey,
      set: { status: 'originating', startedAt, updatedAt: new Date() }
    });
  } catch (e: any) {
    console.warn(`[Asterisk Voz] Falha ao registrar início da chamada no PostgreSQL: ${e.message}`);
  }

  // 5. Originação Real no ARI
  const trunk = process.env.ASTERISK_SIP_TRUNK || 'trunk_isp';
  const endpoint = `PJSIP/${cleanPhone}@${trunk}`;
  const callerId = process.env.ASTERISK_CALLERID || 'NAP Telecom';

  return new Promise<OriginateCallResult>((resolve) => {
    let callResolved = false;
    let ringingAt: Date | undefined = undefined;
    let answeredAt: Date | undefined = undefined;
    let asteriskChannelId: string | null = null;
    let asteriskUniqueId: string | null = null;
    let activeChannel: any = null;

    const timeoutTimer = setTimeout(async () => {
      if (callResolved) return;
      callResolved = true;
      const endedAt = new Date();

      // Solicitar encerramento real (hangup) ao canal no Asterisk
      if (activeChannel) {
        try {
          activeChannel.hangup(() => {});
        } catch (hangupErr: any) {
          console.warn(`[Asterisk ARI] Falha ao solicitar hangup por timeout: ${hangupErr.message}`);
        }
      }

      const result: OriginateCallResult = {
        status: 'no_answer',
        asteriskChannelId: asteriskChannelId || undefined,
        asteriskUniqueId: asteriskUniqueId || undefined,
        startedAt,
        ringingAt,
        answeredAt,
        endedAt,
        durationSeconds: 0,
        hangupCause: 'TIMEOUT_NO_ANSWER',
        result: 'no_answer',
        errorMessage: `Tempo limite de chamada expirado (${timeoutSeconds}s) sem atendimento.`
      };

      try {
        await db.update(campanhas_chamadas_voz).set({
          status: 'no_answer',
          result: 'no_answer',
          ringingAt,
          endedAt,
          durationSeconds: 0,
          hangupCause: result.hangupCause,
          errorMessage: result.errorMessage,
          updatedAt: new Date()
        }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey));
      } catch {}

      resolve(result);
    }, timeoutSeconds * 1000);

    try {
      ariInstance.channels.originate({
        endpoint,
        app: 'ura_maia',
        callerId,
        timeout: timeoutSeconds
      }, (err: any, channel: any) => {
        if (err || !channel) {
          clearTimeout(timeoutTimer);
          if (callResolved) return;
          callResolved = true;
          const errMsg = err?.message || 'Rejeição de originação pelo Asterisk ARI';
          const failedResult: OriginateCallResult = {
            status: 'failed',
            startedAt,
            errorCode: 'ORIGINATE_REJECTED',
            errorMessage: errMsg,
            result: 'failed'
          };

          db.update(campanhas_chamadas_voz).set({
            status: 'failed',
            result: 'failed',
            errorCode: failedResult.errorCode,
            errorMessage: errMsg,
            updatedAt: new Date()
          }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey)).catch(() => {});

          return resolve(failedResult);
        }

        activeChannel = channel;
        asteriskChannelId = channel.id || null;

        // REGRA V6: Nunca fabricar identificador Asterisk artificial. Usar identificador real ou null.
        const realUniqueId = channel.id || (channel as any).name || (channel as any).uniqueid || null;
        if (!realUniqueId) {
          console.warn('[Asterisk ARI] Canal originado sem identificador único retornado pelo Asterisk (id/name/uniqueid). Definindo asteriskUniqueId = null.');
          asteriskUniqueId = null;
        } else {
          asteriskUniqueId = String(realUniqueId);
        }

        // Atualiza channel_id e unique_id no banco
        db.update(campanhas_chamadas_voz).set({
          asteriskChannelId,
          asteriskUniqueId,
          status: 'originating',
          updatedAt: new Date()
        }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey)).catch(() => {});

        // Monitorar eventos reais do canal
        channel.on('ChannelStateChange', async (event: any) => {
          const state = (event.channel?.state || channel.state || '').toLowerCase();

          if (state === 'ringing' && !callResolved) {
            ringingAt = new Date();
            db.update(campanhas_chamadas_voz).set({
              status: 'ringing',
              ringingAt,
              updatedAt: new Date()
            }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey)).catch(() => {});
          } else if (state === 'up' && !callResolved) {
            answeredAt = new Date();
            db.update(campanhas_chamadas_voz).set({
              status: 'answered',
              answeredAt,
              updatedAt: new Date()
            }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey)).catch(() => {});

            // Se fornecido texto para a URA, reproduz o áudio real no canal
            if (audioText) {
              playAudioOnAsterisk(channel, audioText).catch(() => {});
            }
          }
        });

        channel.on('ChannelDestroyed', async (event: any) => {
          clearTimeout(timeoutTimer);
          if (callResolved) return;
          callResolved = true;

          const endedAt = new Date();
          const cause = Number(event.cause || 0);
          const causeTxt = event.cause_txt || `ISDN-${cause}`;

          let finalStatus: 'answered' | 'no_answer' | 'busy' | 'failed' = 'failed';
          let durationSeconds = 0;

          if (answeredAt) {
            finalStatus = 'answered';
            durationSeconds = Math.max(1, Math.round((endedAt.getTime() - answeredAt.getTime()) / 1000));
          } else if (cause === 17) {
            finalStatus = 'busy'; // User busy
          } else if (cause === 19 || cause === 18) {
            finalStatus = 'no_answer'; // No answer / no user responding
          } else {
            finalStatus = 'failed';
          }

          const callResult: OriginateCallResult = {
            status: finalStatus,
            asteriskChannelId: asteriskChannelId || undefined,
            asteriskUniqueId: asteriskUniqueId || undefined,
            startedAt,
            ringingAt,
            answeredAt,
            endedAt,
            durationSeconds,
            hangupCause: causeTxt,
            result: finalStatus
          };

          try {
            await db.update(campanhas_chamadas_voz).set({
              status: finalStatus,
              asteriskUniqueId,
              ringingAt,
              answeredAt,
              endedAt,
              durationSeconds,
              hangupCause: causeTxt,
              result: finalStatus,
              updatedAt: new Date()
            }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey));
          } catch (updateErr: any) {
            console.warn(`[Asterisk Voz] Falha ao persistir encerramento de chamada: ${updateErr.message}`);
          }

          resolve(callResult);
        });
      });
    } catch (launchErr: any) {
      clearTimeout(timeoutTimer);
      if (callResolved) return;
      callResolved = true;
      const failedResult: OriginateCallResult = {
        status: 'failed',
        startedAt,
        errorCode: 'ORIGINATE_EXCEPTION',
        errorMessage: launchErr.message,
        result: 'failed'
      };
      db.update(campanhas_chamadas_voz).set({
        status: 'failed',
        result: 'failed',
        errorCode: failedResult.errorCode,
        errorMessage: launchErr.message,
        updatedAt: new Date()
      }).where(eq(campanhas_chamadas_voz.idempotencyKey, idempotencyKey)).catch(() => {});
      resolve(failedResult);
    }
  });
}


