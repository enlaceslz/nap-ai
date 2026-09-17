const fs = require('fs');
let text = fs.readFileSync('server/olt/oltService.ts', 'utf8');

if (!text.includes('oltVsolId')) {
  text = text.replace(
    "const oltZteId = 'olt-zte-pop01';",
    "const oltZteId = 'olt-zte-pop01';\n    const oltVsolId = 'olt-vsol-pop03';"
  );

  const newOlt = `      {
        id: oltVsolId,
        nome: 'OLT-VSOL-POP-LESTE',
        fabricante: 'VSOL',
        modelo: 'V1600G2-B',
        ip: '10.200.3.10',
        porta: 161,
        protocolo: 'SNMP',
        usuario: 'nap_admin_vsol',
        versao_firmware: 'V1.0.9_221028',
        uptime: '45 dias, 3 horas',
        cpu_usage: 12,
        memory_usage: 28,
        temperatura: 35,
        pop: 'POP Zona Leste',
        localizacao: 'Rack D, Unidade 5-7U',
        descricao: 'OLT VSOL para expansão de novos bairros.',
        status: 'online',
        ultima_comunicacao: new Date().toISOString(),
        versao_driver: '1.0.0-native',
        criado_em: '2026-03-20T08:00:00Z',
        zabbix_hostid: '10544'
      },`;
      
  text = text.replace(
    "const olts: OltDevice[] = [",
    "const olts: OltDevice[] = [\n" + newOlt
  );
  
  const newSlots = `      { id: \`\${oltVsolId}_S1\`, olt_id: oltVsolId, slot_number: 1, card_type: 'CONTROL', card_model: 'VSOL-CTRL', card_status: 'normal', total_ports: 4, ports_active: 4 },
      { id: \`\${oltVsolId}_S2\`, olt_id: oltVsolId, slot_number: 2, card_type: 'GPON', card_model: 'VSOL-16G', card_status: 'normal', total_ports: 16, ports_active: 16 },`;
      
  text = text.replace(
    "const slots: OltSlot[] = [",
    "const slots: OltSlot[] = [\n" + newSlots
  );
  
  const newPons = `      { id: \`\${oltVsolId}_PON1\`, olt_id: oltVsolId, slot_number: 2, port_number: 1, pon_identifier: '0/0/1', tecnologia: 'GPON', status: 'up', onus_total: 58, onus_online: 55, onus_offline: 3, rx_power_avg: -22.5, tx_power: 2.1, vlan_default: 1, alarmes_ativos: 0 },
      { id: \`\${oltVsolId}_PON2\`, olt_id: oltVsolId, slot_number: 2, port_number: 2, pon_identifier: '0/0/2', tecnologia: 'GPON', status: 'up', onus_total: 42, onus_online: 40, onus_offline: 2, rx_power_avg: -21.8, tx_power: 2.0, vlan_default: 1, alarmes_ativos: 1 },`;
      
  text = text.replace(
    "const pons: OltPonPort[] = [",
    "const pons: OltPonPort[] = [\n" + newPons
  );
  
  const newOnus = `      {
        id: 'onu-vsol-1', olt_id: oltVsolId, pon_identifier: '0/0/1', onu_id: 1, serial: 'VSOL12345678', nome: 'Cliente VSOL 1', modelo: 'V2801SG', status: 'online', rx_onu: -21.3, tx_onu: 2.4, rx_olt: -22.1, tx_olt: 2.5, distancia_metros: 1250, vlan: 100, profile_line: 'LINE_500M', profile_service: 'SRV_INTERNET', criado_em: new Date().toISOString(), temperatura: 39, uptime: '10 dias'
      },
      {
        id: 'onu-vsol-2', olt_id: oltVsolId, pon_identifier: '0/0/1', onu_id: 2, serial: 'VSOL87654321', nome: 'Cliente VSOL 2', modelo: 'V2801SG', status: 'offline', rx_onu: -28.9, tx_onu: 1.1, rx_olt: -29.2, tx_olt: 2.5, distancia_metros: 3400, vlan: 200, profile_line: 'LINE_1G', profile_service: 'SRV_INTERNET', criado_em: new Date().toISOString(), temperatura: 42, uptime: '0'
      },`;
      
  text = text.replace(
    "const onus: OnuDevice[] = [",
    "const onus: OnuDevice[] = [\n" + newOnus
  );
  
  fs.writeFileSync('server/olt/oltService.ts', text, 'utf8');
  console.log('seeded VSOL');
} else {
  console.log('already seeded');
}
