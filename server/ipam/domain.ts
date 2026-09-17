export interface IpamPrefix {
  id?: string;
  prefix: string; 
  family: 4 | 6;
  status: string;
  description?: string;
  role?: string;
  vrfId?: string;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IpamAddress {
  id?: string;
  address: string; 
  family: 4 | 6;
  status: string; 
  description?: string;
  assignedObjectId?: string; 
  tenantId?: string;
}

export interface IpamVlan {
  id?: string;
  vid: number;
  name: string;
  status: string;
  role?: string;
  siteId?: string;
  description?: string;
}

export interface IpamVrf {
  id?: string;
  name: string;
  rd?: string; 
  tenantId?: string;
  description?: string;
}

export interface IpamDevice {
  id?: string;
  name: string;
  deviceRole: string; 
  deviceType: string;
  siteId?: string;
  status: string;
  primaryIp4Id?: string;
  primaryIp6Id?: string;
}

export interface IpamInterface {
  id?: string;
  deviceId: string;
  name: string;
  type: string;
  macAddress?: string;
  description?: string;
  enabled: boolean;
  mtu?: number;
}

export interface IpamASN {
  id?: string;
  asn: number;
  organization?: string;
  description?: string;
  rir?: string;
  tenantId?: string;
}

export interface IpamBGPSession {
  id?: string;
  localAsnId: string;
  remoteAsnId: string;
  peerIpId?: string;
  status: string;
  description?: string;
}

export interface IpamCircuit {
  id?: string;
  cid: string; 
  providerId: string;
  type: string;
  status: string;
  description?: string;
}
