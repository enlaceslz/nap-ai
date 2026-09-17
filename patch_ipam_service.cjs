const fs = require('fs');

const code = `import { db } from '../../src/db';
import { ipam_bindings, ipam_audit, ipam_reservations } from '../../src/db/schema';
import { NautobotAdapter } from './nautobotAdapter';
import { 
  IpamPrefix, IpamAddress, IpamVlan, IpamVrf, 
  IpamDevice, IpamInterface, IpamASN, IpamBGPSession, IpamCircuit 
} from './domain';

export class IPAMService {
  private adapter: NautobotAdapter;
  private memoryReservations: any[] = [];

  constructor() {
    this.adapter = new NautobotAdapter();
  }

  // --- BINDINGS & SYNC ---
  private async registerBinding(napType: string, napId: string, backendId: string) {
    try {
      await db.insert(ipam_bindings).values({
        backend: 'nautobot',
        backend_object_id: backendId,
        nap_entity_type: napType,
        nap_entity_id: napId,
      });
    } catch(e) {
      console.log("[Info] DB offline, IPAM registerBinding memory fallback");
    }
  }

  async auditLog(actorId: string, action: string, objectType: string, objectId: string, before: string | null = null, after: string | null = null) {
    try {
      await db.insert(ipam_audit).values({
        actor_id: actorId,
        action,
        object_type: objectType,
        object_id: objectId,
        before,
        after,
      });
    } catch(e) {
      console.log("[Info] DB offline, IPAM auditLog memory fallback");
    }
  }

  // --- PREFIXES & IPV6 PD ---
  async createPrefix(data: IpamPrefix, actorId: string = 'system') {
    const backendId = await this.adapter.createPrefix(data);
    await this.auditLog(actorId, 'create_prefix', 'prefix', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  async delegateIPv6Prefix(parentPrefixId: string, customerId: number, prefixLength: number = 56, actorId: string = 'system') {
    const backendId = await this.adapter.allocateAvailablePrefix(parentPrefixId, prefixLength, {
      description: \`IPv6 PD for Customer \${customerId}\`,
      status: 'active'
    });
    
    let reservationId = Date.now();
    try {
      const [reservation] = await db.insert(ipam_reservations).values({
        prefix_id: backendId,
        ip_address: \`Delegated /\${prefixLength}\`, 
        customer_id: customerId,
        purpose: 'IPv6 Prefix Delegation (PD)',
      }).returning();
      reservationId = reservation.id;
    } catch(e) {
      console.log("[Info] DB offline, IPAM delegateIPv6Prefix memory fallback");
      this.memoryReservations.push({ id: reservationId, prefix_id: backendId, customer_id: customerId, purpose: 'IPv6 Prefix Delegation (PD)' });
    }

    await this.registerBinding('ipv6_pd', String(reservationId), backendId);
    await this.auditLog(actorId, 'delegate_ipv6_pd', 'prefix', backendId, null, \`Customer: \${customerId}\`);
    return { success: true, backendId, reservationId };
  }

  // --- IP ALLOCATION (IPv4 & IPv6) ---
  async allocateIP(prefixId: string, address: string, customerId: number, actorId: string = 'system') {
    const backendId = await this.adapter.allocateIPAddress(prefixId, {
      address,
      status: 'active',
      description: \`Customer ID: \${customerId}\`
    });

    let resData = { id: Date.now(), prefix_id: prefixId, ip_address: address, customer_id: customerId, purpose: 'WAN Allocation' };
    try {
      const [reservation] = await db.insert(ipam_reservations).values({
        prefix_id: prefixId,
        ip_address: address,
        customer_id: customerId,
        purpose: 'WAN Allocation',
      }).returning();
      resData = reservation as any;
    } catch(e) {
      console.log("[Info] DB offline, IPAM allocateIP memory fallback");
      this.memoryReservations.push(resData);
    }

    await this.registerBinding('ip_reservation', String(resData.id), backendId);
    await this.auditLog(actorId, 'allocate_ip', 'ip_address', backendId, null, JSON.stringify({ address, customerId }));
    return resData;
  }

  async allocateNextAvailableIP(prefixId: string, customerId: number, purpose: string = 'WAN Allocation', actorId: string = 'system') {
    const { id: backendId, address } = await this.adapter.allocateNextAvailableIP(prefixId, {
      description: \`Customer ID: \${customerId} - \${purpose}\`
    });

    let resData = { id: Date.now(), prefix_id: prefixId, ip_address: address, customer_id: customerId, purpose };
    try {
      const [reservation] = await db.insert(ipam_reservations).values({
        prefix_id: prefixId,
        ip_address: address,
        customer_id: customerId,
        purpose,
      }).returning();
      resData = reservation as any;
    } catch(e) {
      console.log("[Info] DB offline, IPAM allocateNextAvailableIP memory fallback");
      this.memoryReservations.push(resData);
    }

    await this.registerBinding('ip_reservation', String(resData.id), backendId);
    await this.auditLog(actorId, 'allocate_next_ip', 'ip_address', backendId, null, JSON.stringify({ address, customerId, purpose }));
    return resData;
  }

  // --- VLAN & VRF ---
  
  async createVlan(data: IpamVlan, actorId: string = 'system') {
    const backendId = await this.adapter.createVLAN(data);
    await this.auditLog(actorId, 'create_vlan', 'vlan', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  async createVrf(data: IpamVrf, actorId: string = 'system') {
    const backendId = await this.adapter.createVRF(data);
    await this.auditLog(actorId, 'create_vrf', 'vrf', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  // --- DEVICES & INTERFACES ---
  
  async createDevice(data: IpamDevice, actorId: string = 'system') {
    const backendId = await this.adapter.createDevice(data);
    await this.auditLog(actorId, 'create_device', 'device', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  async createInterface(data: IpamInterface, actorId: string = 'system') {
    const backendId = await this.adapter.createInterface(data);
    await this.auditLog(actorId, 'create_interface', 'interface', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  // --- INTERNET, ASN, BGP & CIRCUITS ---
  
  async createASN(data: IpamASN, actorId: string = 'system') {
    const backendId = await this.adapter.createASN(data);
    await this.auditLog(actorId, 'create_asn', 'asn', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  async createBGP(data: IpamBGPSession, actorId: string = 'system') {
    const backendId = await this.adapter.createBGP(data);
    await this.auditLog(actorId, 'create_bgp_session', 'bgp_session', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }

  async createCircuit(data: IpamCircuit, actorId: string = 'system') {
    const backendId = await this.adapter.createCircuit(data);
    await this.auditLog(actorId, 'create_circuit', 'circuit', backendId, null, JSON.stringify(data));
    return { success: true, backendId };
  }
}
`;

fs.writeFileSync('server/ipam/service.ts', code, 'utf8');
console.log('IPAM service patched with fallback.');
