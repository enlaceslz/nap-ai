import { ErpAdapter } from './ErpAdapterInterface';
import { SgpAdapter } from './SgpAdapter';

export class ErpFactory {
  // Singleton pattern to hold the active adapter
  private static instance: ErpAdapter | null = null;

  static initialize(config: { provider: string; baseUrl?: string; appToken?: string; userToken?: string }): ErpAdapter {
    const { provider, baseUrl = '', appToken = '', userToken = '' } = config;

    switch (provider.toLowerCase()) {
      case 'sgp':
        this.instance = new SgpAdapter(baseUrl, appToken, userToken);
        break;
      // case 'ixc': 
      //   this.instance = new IxcAdapter(...);
      // case 'mikweb':
      //   this.instance = new MikWebAdapter(...);
      default:
        console.warn(`[Aviso ERP] Provedor ${provider} não reconhecido. Usando SGP como Fallback default.`);
        this.instance = new SgpAdapter(baseUrl, appToken, userToken);
    }

    return this.instance;
  }

  static getInstance(): ErpAdapter {
    if (!this.instance) {
      // Inicia em Memory Fallback por padrão para desenvolvimento
      return this.initialize({ provider: 'sgp' });
    }
    return this.instance;
  }
}
