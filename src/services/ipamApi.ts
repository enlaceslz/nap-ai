// Client-side API handler for IPAM & NSoT

const API_BASE_URL = '/api/v1';

export async function fetchIpamPrefixes() {
  // Num cenário real, isso faria fetch de /api/v1/ipam/prefixes
  // Por enquanto vamos retornar dados que parecem reais do Nautobot
  return {
    global: [
      { id: 'pref-1', prefix: '100.64.0.0/10', type: 'CGNAT', status: 'active', usage: '68%' },
      { id: 'pref-2', prefix: '177.10.20.0/22', type: 'IPv4 Public', status: 'active', usage: '45%' },
      { id: 'pref-3', prefix: '2001:db8::/32', type: 'IPv6', status: 'active', usage: '12%' },
    ],
    vrfs: [
      { id: 'vrf-1', name: 'VRF_GERENCIA', rd: '65000:1' },
      { id: 'vrf-2', name: 'VRF_CLIENTES_PPPOE', rd: '65000:2' },
    ],
    audits: [
      { id: 1, resource: '100.64.1.15', context: 'Cliente ID: 1042 (WAN Allocation)', status: 'Active', date: 'Há 5 min', isConflict: false },
      { id: 2, resource: '2001:db8:a::/56', context: 'Cliente ID: 1042 (IPv6 PD)', status: 'Active', date: 'Há 5 min', isConflict: false },
      { id: 3, resource: '100.64.0.254', context: 'Conflito Detectado (IP Duplicado)', status: 'Conflict', date: 'Há 1 hora', isConflict: true },
    ]
  };
}
