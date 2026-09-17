import { ErpAdapter } from './ErpAdapterInterface';
import { SgpAdapter } from './SgpAdapter';
import { IxcAdapter } from './IxcAdapter';
import { HubSoftAdapter } from './HubSoftAdapter';

export class ErpFactory {
  private static adapters: Map<string, ErpAdapter> = new Map();
  private static defaultProvider: string = 'sgp';

  static initialize(config: { provider: string; baseUrl?: string; appToken?: string; userToken?: string; apiKey?: string }): ErpAdapter {
    const { provider, baseUrl = '', appToken = '', userToken = '', apiKey = '' } = config;
    const provKey = provider.toLowerCase();
    this.defaultProvider = provKey;

    let adapter: ErpAdapter;
    switch (provKey) {
      case 'ixc':
        adapter = new IxcAdapter(baseUrl, appToken || apiKey);
        break;
      case 'hubsoft':
        adapter = new HubSoftAdapter(baseUrl, apiKey || appToken);
        break;
      case 'sgp':
      default:
        adapter = new SgpAdapter(baseUrl, appToken, userToken);
        break;
    }

    this.adapters.set(provKey, adapter);
    return adapter;
  }

  static getAdapter(providerName?: string): ErpAdapter {
    const prov = (providerName || this.defaultProvider).toLowerCase();
    if (!this.adapters.has(prov)) {
      this.initialize({ provider: prov });
    }
    return this.adapters.get(prov)!;
  }

  static getInstance(): ErpAdapter {
    return this.getAdapter();
  }
}
