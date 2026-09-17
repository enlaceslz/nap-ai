import ariClient from 'ari-client';

export class AsteriskAriService {
  private static instance: AsteriskAriService;
  private client: ariClient.Client | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): AsteriskAriService {
    if (!AsteriskAriService.instance) {
      AsteriskAriService.instance = new AsteriskAriService();
    }
    return AsteriskAriService.instance;
  }

  public async connect(url: string, user: string, pass: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        return true;
      }

      console.log(`[ARI] Conectando ao Asterisk 20+ em ${url}...`);
      
      this.client = await ariClient.connect(url, user, pass);
      this.isConnected = true;
      console.log(`[ARI] Conexão estabelecida com sucesso.`);

      this.setupEventHandlers();
      
      // Inicia a aplicação Stasis 'nap_engine' configurada no extensions.conf
      this.client.start('nap_engine');

      return true;
    } catch (error) {
      console.error(`[ARI] Falha ao conectar no Asterisk:`, error);
      this.isConnected = false;
      return false;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    // Escuta novas chamadas entrando no Stasis
    this.client.on('StasisStart', async (event, channel: ariClient.Channel) => {
      console.log(`[ARI] Nova chamada recebida no NAP Engine: ${channel.id} (De: ${channel.caller.number} Para: ${event.args[0]})`);
      
      try {
        await channel.answer();
        console.log(`[ARI] Chamada ${channel.id} atendida pelo motor Node.js.`);
        
        // Exemplo: Disparar um áudio de boas vindas provido pela IA 
        // No mundo real isso seria integrado com o Gemini Live API gerando áudio
        const playback = this.client?.Playback();
        if (playback) {
           await channel.play({ media: 'sound:tt-weasels' }, playback);
           console.log(`[ARI] Reproduzindo audio na chamada ${channel.id}`);
        }
      } catch (e) {
        console.error(`[ARI] Erro ao tratar StasisStart:`, e);
      }
    });

    this.client.on('StasisEnd', (event, channel: ariClient.Channel) => {
      console.log(`[ARI] Chamada finalizada: ${channel.id}`);
    });
  }

  // Método para a IA (Gemini) iniciar uma chamada ativa
  public async originateCall(endpoint: string, extension: string): Promise<boolean> {
     if (!this.client) return false;
     try {
       console.log(`[ARI] Iniciando chamada para ${endpoint} via engine nativo...`);
       await this.client.channels.originate({
         endpoint: endpoint,
         extension: extension,
         context: 'from-internal',
         priority: 1,
         app: 'nap_engine',
         appArgs: 'dialed'
       });
       return true;
     } catch (e) {
       console.error(`[ARI] Erro ao originar chamada:`, e);
       return false;
     }
  }

  // Método para pendurar
  public async hangupCall(channelId: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.channels.hangup({ channelId });
      console.log(`[ARI] Chamada ${channelId} desligada pelo sistema.`);
    } catch (e) {
      console.error(`[ARI] Erro ao desligar chamada ${channelId}:`, e);
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      engine: 'Asterisk 20+ NATIVE (ARI/PJSIP)',
      application: 'nap_engine'
    };
  }
}

export const ariService = AsteriskAriService.getInstance();
