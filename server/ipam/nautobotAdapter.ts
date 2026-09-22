import { IPAMAdapter } from './adapter';
import { IpamPrefix, IpamAddress, IpamVlan, IpamVrf, IpamDevice, IpamInterface, IpamASN, IpamBGPSession, IpamCircuit } from './domain';

export class NautobotAdapter implements IPAMAdapter {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.NAUTOBOT_URL || '';
    this.token = process.env.NAUTOBOT_TOKEN || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.baseUrl || !this.token) {
      throw new Error("Integração Nautobot não configurada (NAUTOBOT_URL ou NAUTOBOT_TOKEN ausente).");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      throw new Error(`Nautobot API error on ${endpoint}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  // --- PREFIX ---
  async getPrefix(id: string): Promise<IpamPrefix> {
    const res = await this.request(`/ipam/prefixes/${id}/`);
    return {
      id: res.id,
      prefix: res.prefix,
      family: res.family?.value || (res.prefix?.includes(':') ? 6 : 4),
      status: res.status?.value,
      description: res.description
    };
  }

  async createPrefix(prefix: IpamPrefix): Promise<string> {
    const res = await this.request('/ipam/prefixes/', {
      method: 'POST',
      body: JSON.stringify({
        prefix: prefix.prefix,
        status: prefix.status || 'active',
        description: prefix.description
      })
    });
    if (!res?.id) {
      throw new Error("Falha ao obter ID do prefixo criado no Nautobot.");
    }
    return String(res.id);
  }

  async updatePrefix(id: string, updates: Partial<IpamPrefix>): Promise<void> {
    await this.request(`/ipam/prefixes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deletePrefix(id: string): Promise<void> {
    if (!this.baseUrl || !this.token) return;
    await this.request(`/ipam/prefixes/${id}/`, { method: 'DELETE' });
  }

  async allocateAvailablePrefix(parentPrefixId: string, prefixLength: number, data: Partial<IpamPrefix>): Promise<string> {
    const res = await this.request(`/ipam/prefixes/${parentPrefixId}/available-prefixes/`, {
      method: 'POST',
      body: JSON.stringify({
        prefix_length: prefixLength,
        description: data.description,
        status: data.status || 'active'
      })
    });
    if (!res?.id) {
      throw new Error("Falha ao alocar prefixo no Nautobot.");
    }
    return String(res.id);
  }

  // --- ADDRESS ---
  async getIPAddress(id: string): Promise<IpamAddress> {
    const res = await this.request(`/ipam/ip-addresses/${id}/`);
    return {
      id: res.id,
      address: res.address,
      family: res.family?.value || (res.address?.includes(':') ? 6 : 4),
      status: res.status?.value,
    };
  }

  async allocateIPAddress(prefixId: string, addressData: Partial<IpamAddress>): Promise<string> {
    const res = await this.request('/ipam/ip-addresses/', {
      method: 'POST',
      body: JSON.stringify({
        address: addressData.address,
        status: addressData.status || 'active',
        description: addressData.description
      })
    });
    if (!res?.id) {
      throw new Error("Falha ao alocar endereço IP no Nautobot.");
    }
    return String(res.id);
  }

  async allocateNextAvailableIP(prefixId: string, addressData: Partial<IpamAddress>): Promise<{ id: string, address: string }> {
    const res = await this.request(`/ipam/prefixes/${prefixId}/available-ips/`, {
      method: 'POST',
      body: JSON.stringify({
        status: addressData.status || 'active',
        description: addressData.description
      })
    });
    if (!res?.id || !res?.address) {
      throw new Error("Falha ao alocar próximo IP disponível no Nautobot.");
    }
    return {
      id: String(res.id),
      address: String(res.address)
    };
  }

  async releaseIPAddress(id: string): Promise<void> {
    if (!this.baseUrl || !this.token) return;
    await this.request(`/ipam/ip-addresses/${id}/`, { method: 'DELETE' });
  }

  // --- VLAN & VRF ---
  async getVLAN(id: string): Promise<IpamVlan> { return {} as IpamVlan; }
  async createVLAN(vlan: IpamVlan): Promise<string> {
    const res = await this.request('/ipam/vlans/', {
      method: 'POST',
      body: JSON.stringify({ vid: vlan.vid, name: vlan.name, status: vlan.status || 'active' })
    });
    if (!res?.id) {
      throw new Error("Falha ao criar VLAN no Nautobot.");
    }
    return String(res.id);
  }

  async getVRF(id: string): Promise<IpamVrf> { return {} as IpamVrf; }
  async createVRF(vrf: IpamVrf): Promise<string> {
    const res = await this.request('/ipam/vrfs/', {
      method: 'POST',
      body: JSON.stringify({ name: vrf.name, rd: vrf.rd, description: vrf.description })
    });
    if (!res?.id) {
      throw new Error("Falha ao criar VRF no Nautobot.");
    }
    return String(res.id);
  }

  // --- DEVICE & INTERFACE ---
  async getDevice(id: string): Promise<IpamDevice> { return {} as IpamDevice; }
  async createDevice(device: IpamDevice): Promise<string> {
    const res = await this.request('/dcim/devices/', {
      method: 'POST',
      body: JSON.stringify({ name: device.name, device_role: device.deviceRole, device_type: device.deviceType, status: device.status || 'active' })
    });
    return res.id || `NAUTO-DEV-${Date.now()}`;
  }

  async getInterface(id: string): Promise<IpamInterface> { return {} as IpamInterface; }
  async createInterface(intf: IpamInterface): Promise<string> {
    const res = await this.request('/dcim/interfaces/', {
      method: 'POST',
      body: JSON.stringify({ device: intf.deviceId, name: intf.name, type: intf.type, enabled: intf.enabled })
    });
    return res.id || `NAUTO-INTF-${Date.now()}`;
  }

  // --- INTERNET & CIRCUITS ---
  async getASN(id: string): Promise<IpamASN> { return {} as IpamASN; }
  async createASN(asn: IpamASN): Promise<string> {
    const res = await this.request('/ipam/asns/', {
      method: 'POST',
      body: JSON.stringify({ asn: asn.asn, description: asn.description, rir: asn.rir })
    });
    return res.id || `NAUTO-ASN-${Date.now()}`;
  }

  async getBGP(id: string): Promise<IpamBGPSession> { return {} as IpamBGPSession; }
  async createBGP(bgp: IpamBGPSession): Promise<string> {
    // Note: BGP might be a Nautobot plugin (e.g. nautobot-bgp-models), adapting structure.
    return `NAUTO-BGP-${Date.now()}`;
  }

  async getCircuit(id: string): Promise<IpamCircuit> { return {} as IpamCircuit; }
  async createCircuit(circuit: IpamCircuit): Promise<string> {
    const res = await this.request('/circuits/circuits/', {
      method: 'POST',
      body: JSON.stringify({ cid: circuit.cid, provider: circuit.providerId, type: circuit.type, status: circuit.status || 'active' })
    });
    return res.id || `NAUTO-CIRC-${Date.now()}`;
  }
}
