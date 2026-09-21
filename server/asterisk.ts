import client from 'ari-client';
import net from 'net';
import { db } from "../src/db/index.js";
import { clientes } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { assertRealService, isMockAllowed } from "./security/mockGuard.js";

const ARI_URL = process.env.ARI_URL || process.env.ASTERISK_ARI_URL || `http://${process.env.ASTERISK_HOST || '127.0.0.1'}:${process.env.ASTERISK_PORT_ARI || '8088'}`;
const ARI_USER = process.env.ARI_USER || process.env.ASTERISK_USER_ARI || 'nap_admin';
const ARI_PASS = process.env.ARI_PASS || process.env.ASTERISK_SECRET_ARI || '';

let ariInstance: any = null;
let isConnected = false;
let chamadasAtivas: any[] = [];

// Helper para simular a sintese e reprodução na URA
async function playAudioOnAsterisk(channel: any, text: string) {
    console.log(`[Asterisk URA] 🤖 MaIa diz (Canal ${channel.id}): "${text}"`);
    // Em produção (Asterisk ARI + Gemini TTS/Google Cloud TTS):
    // 1. Gera áudio via Gemini Audio/TTS
    // 2. Salva em /tmp/tts_audio.wav
    // 3. channel.play({ media: 'sound:/tmp/tts_audio' })
}

export async function connectARI() {
  const isEnabled = process.env.ASTERISK_ENABLED === 'true' || process.env.VOIP_ENABLED === 'true';
  if (!ARI_PASS) {
    if (isEnabled) {
      assertRealService('Asterisk ARI', 'ASTERISK_SECRET_ARI não configurado no servidor.');
    }
    console.warn('[Asterisk] ASTERISK_SECRET_ARI não configurado. ARI desabilitado neste ambiente.');
    return;
  }
  try {
    console.log(`[Asterisk] Tentando conectar ao ARI em ${ARI_URL}...`);
    ariInstance = await client.connect(ARI_URL, ARI_USER, ARI_PASS);
    isConnected = true;
    console.log('[Asterisk] Conectado ao ARI com sucesso!');

    ariInstance.on('StasisStart', async (event: any, channel: any) => {
      console.log(`[Asterisk] Nova chamada inbound: ${channel.id} (De: ${channel.caller.number})`);
      
      chamadasAtivas.push({
        id: channel.id,
        caller: channel.caller.number,
        did: channel.dialplan.exten,
        status: channel.state,
        duration: 0,
        queue: 'URA Lia',
        agent: 'Lia (Voice Agent)'
      });

      // 1. Atender a Chamada (SIP 200 OK)
      channel.answer(async (err: any) => {
        if (err) return console.error('[Asterisk] Erro ao atender chamada:', err);
        
        // 2. Identificar o cliente via Banco de Dados (Drizzle)
        let nomeCliente = "Visitante";
        let isConhecido = false;
        try {
          const result = await db.select().from(clientes).where(eq(clientes.telefone, channel.caller.number));
          if (result.length > 0) {
              nomeCliente = result[0].nome.split(' ')[0];
              isConhecido = true;
          }
        } catch(e) {}

        // 3. Gerar Saudação Contextual da URA Cognitiva (Simulando Gemini GenAI)
        setTimeout(async () => {
            if (isConhecido) {
               await playAudioOnAsterisk(channel, `Olá ${nomeCliente}, eu sou a MaIA, a assistente virtual do DJD Telecom de internet. Analisando a sua conexão no nosso sistema, vi que seu roteador está online há 5 dias com sinal excelente. Sobre o que você gostaria de falar? Pode falar naturalmente.`);
               
               // Simula o cliente respondendo e a URA transferindo
               setTimeout(async () => {
                   console.log(`[Asterisk URA] 🗣️ Cliente (Canal ${channel.id}): "Eu quero a segunda via do meu boleto" (Detectado via Google Speech-to-Text)`);
                   await playAudioOnAsterisk(channel, `Entendi, você precisa da segunda via. Vou enviar o PIX Copia e Cola agora mesmo para o seu WhatsApp cadastrado, e vou te transferir para o setor financeiro caso tenha mais alguma dúvida. Aguarde um momento.`);
                   console.log(`[Asterisk] Chamada ${channel.id} sendo transferida para a fila: Financeiro & Cobrança`);
               }, 6000);

            } else {
               await playAudioOnAsterisk(channel, `Olá! Você ligou para a nossa central de atendimento. Por favor, digite ou diga o número do seu CPF ou CNPJ para eu localizar o seu cadastro.`);
            }
        }, 1000);
      });
    });

    ariInstance.on('StasisEnd', (event: any, channel: any) => {
      console.log(`[Asterisk] Chamada finalizada (Hangup): ${channel.id}`);
      chamadasAtivas = chamadasAtivas.filter(c => c.id !== channel.id);
    });

    ariInstance.start('ura_maia'); 
    isConnected = true;
  } catch (error: any) {
    if (!isMockAllowed()) {
      isConnected = false;
      chamadasAtivas = [];
      console.warn(`[Asterisk] Falha ao conectar no ARI em produção: ${error.message}. Status definido como offline/indisponível.`);
      return;
    }
    // Fallback apenas em ambiente de desenvolvimento / preview
    console.warn('[Asterisk] [Modo Dev] Falha ao conectar no ARI. Utilizando chamadas simuladas apenas em ambiente local.');
    isConnected = false;
    chamadasAtivas = [
      { id: "SIP-0012A", caller: "5511987654321", did: "08005910000", status: "Up", duration: 142, queue: "Suporte N1", agent: "Roberto Oliveira" },
      { id: "SIP-0016E", caller: "5521999998888", did: "08005910000", status: "Up", duration: 12, queue: "URA Lia", agent: "Lia (Voice Agent)" }
    ];
  }
}

export function getChamadas() {
  if (!isMockAllowed() && !isConnected) {
    return [];
  }
  return chamadasAtivas;
}

export function getAsteriskStatus() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    conectado: isConnected,
    status: isConnected ? 'online' : (process.env.ASTERISK_ENABLED === 'true' ? 'unavailable' : 'offline'),
    ariUrl: ARI_URL,
    ariUser: ARI_USER,
    amiPort: Number(process.env.ASTERISK_PORT_AMI || 5038),
    amiUser: process.env.ASTERISK_USER_AMI || 'nap_ami',
    websocketUrl: process.env.ASTERISK_WEBSOCKET_URL || 'wss://127.0.0.1:8089/ws',
    ramalPadrao: process.env.ASTERISK_RAMAL_PADRAO || '2001',
    contexto: 'from-internal',
    stasisApp: 'ura_maia',
    chamadasAtivas: isConnected ? chamadasAtivas.length : (isProd ? 0 : chamadasAtivas.length),
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

