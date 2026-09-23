import client from 'ari-client';
import net from 'net';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from "../src/db/index.js";
import { clientes } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { assertRealService } from "./security/mockGuard.js";

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


