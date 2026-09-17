import { 
  IpamPrefix, IpamAddress, IpamVlan, IpamVrf, 
  IpamDevice, IpamInterface, IpamASN, IpamBGPSession, IpamCircuit 
} from './domain';

export interface IPAMAdapter {
  // Prefix
  getPrefix(id: string): Promise<IpamPrefix>;
  createPrefix(prefix: IpamPrefix): Promise<string>;
  updatePrefix(id: string, updates: Partial<IpamPrefix>): Promise<void>;
  deletePrefix(id: string): Promise<void>;
  allocateAvailablePrefix(parentPrefixId: string, prefixLength: number, data: Partial<IpamPrefix>): Promise<string>;

  // Address
  getIPAddress(id: string): Promise<IpamAddress>;
  allocateIPAddress(prefixId: string, addressData: Partial<IpamAddress>): Promise<string>;
  allocateNextAvailableIP(prefixId: string, addressData: Partial<IpamAddress>): Promise<{ id: string, address: string }>;
  releaseIPAddress(id: string): Promise<void>;

  // VLAN / VRF
  getVLAN(id: string): Promise<IpamVlan>;
  createVLAN(vlan: IpamVlan): Promise<string>;
  getVRF(id: string): Promise<IpamVrf>;
  createVRF(vrf: IpamVrf): Promise<string>;

  // Device / Interface
  getDevice(id: string): Promise<IpamDevice>;
  createDevice(device: IpamDevice): Promise<string>;
  getInterface(id: string): Promise<IpamInterface>;
  createInterface(intf: IpamInterface): Promise<string>;

  // Internet & Circuits
  getASN(id: string): Promise<IpamASN>;
  createASN(asn: IpamASN): Promise<string>;
  
  getBGP(id: string): Promise<IpamBGPSession>;
  createBGP(bgp: IpamBGPSession): Promise<string>;
  
  getCircuit(id: string): Promise<IpamCircuit>;
  createCircuit(circuit: IpamCircuit): Promise<string>;
}
