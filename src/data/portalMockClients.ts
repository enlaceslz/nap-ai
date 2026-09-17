export interface PortalClient {
  id: number;
  nome: string;
  cpf: string;
  cpf_limpo: string;
  email: string;
  telefone: string;
  contrato: string;
  plano: string;
  valor_plano: number;
  status_cliente: 'ativo' | 'bloqueado_parcial' | 'inativo';
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  ponto_referencia: string;
  cto: string;
  cpe: {
    modelo: string;
    fabricante: string;
    serial: string;
    mac: string;
    rxPower: string;
    txPower: string;
    ipWan: string;
    ssid24: string;
    ssid5: string;
    senhaWifi: string;
    dispositivos: number;
  };
  metricas: {
    score_pagador: number;
    tempo_contrato_meses: number;
    chamados_abertos: number;
  };
  faturas: {
    id: number;
    valor: number;
    vencimento: string;
    status: 'pendente' | 'pago' | 'atrasado';
    descricao: string;
    linha_digitavel: string;
    codigo_pix: string;
    dias_atraso?: number;
  }[];
  tag: string;
  badgeColor: 'emerald' | 'amber' | 'blue';
  descricao_cenario: string;
}

export const CLIENTE_HOMOLOGACAO_PRINCIPAL: PortalClient = {
  id: 102,
  nome: "Rafael Medeiros de Albuquerque",
  cpf: "384.921.750-42",
  cpf_limpo: "38492175042",
  email: "rafael.medeiros@napfibra.com.br",
  telefone: "(11) 98765-4321",
  contrato: "CTR-2026-8894",
  plano: "600 Mega Fibra Turbo + Wi-Fi 6 Mesh",
  valor_plano: 119.90,
  status_cliente: "ativo",
  endereco: "Rua das Acácias, 412, Apto 82",
  bairro: "Centro Histórico",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01310-100",
  ponto_referencia: "Próximo à Praça da Matriz e Estação São Bento",
  cto: "CTO-08 (Porta 04 - Splitter 1:8 balanceado)",
  cpe: {
    modelo: "EchoLife HG8145V5 Dual Band Wi-Fi",
    fabricante: "Huawei Technologies",
    serial: "HWTC78A9C412",
    mac: "48:57:02:78:A9:C4",
    rxPower: "-19.2 dBm",
    txPower: "+2.4 dBm",
    ipWan: "177.136.42.18",
    ssid24: "NAP_Fibra_Rafael",
    ssid5: "NAP_Fibra_Rafael_5G",
    senhaWifi: "FibraRapida@2026",
    dispositivos: 6
  },
  metricas: {
    score_pagador: 9.8,
    tempo_contrato_meses: 18,
    chamados_abertos: 0
  },
  faturas: [
    {
      id: 1044,
      valor: 119.90,
      vencimento: "2026-09-15",
      status: "pendente",
      descricao: "Mensalidade Fibra 600M + Wi-Fi 6 (Ref. Setembro/2026)",
      linha_digitavel: "03399.87654 32100.000000 12345.678901 1 99990000011990",
      codigo_pix: "00020126580014br.gov.bcb.pix0136mock-pix-key-1044-84a2-9999999999995204000053039865802BR5915PROVEDOR NAP6009SAO PAULO62070503***6304ABCD"
    },
    {
      id: 1043,
      valor: 119.90,
      vencimento: "2026-08-15",
      status: "pago",
      descricao: "Mensalidade Fibra 600M + Wi-Fi 6 (Ref. Agosto/2026)",
      linha_digitavel: "03399.87654 32100.000000 12345.678901 1 99990000011990",
      codigo_pix: "00020126580014br.gov.bcb.pix0136mock-pix-key-1043-84a2-9999999999995204000053039865802BR5915PROVEDOR NAP6009SAO PAULO62070503***6304ABCD"
    },
    {
      id: 1042,
      valor: 119.90,
      vencimento: "2026-07-15",
      status: "pago",
      descricao: "Mensalidade Fibra 600M + Wi-Fi 6 (Ref. Julho/2026)",
      linha_digitavel: "03399.87654 32100.000000 12345.678901 1 99990000011990",
      codigo_pix: "00020126580014br.gov.bcb.pix0136mock-pix-key-1042-84a2-9999999999995204000053039865802BR5915PROVEDOR NAP6009SAO PAULO62070503***6304ABCD"
    }
  ],
  tag: "Adimplente • Homologação Padrão",
  badgeColor: "emerald",
  descricao_cenario: "Cliente ideal para teste completo do portal: Fatura a vencer com PIX Copia e Cola, telemetria TR-069 ativa, troca de senha Wi-Fi e auto-diagnóstico."
};

export const CLIENTE_TESTE_INADIMPLENTE: PortalClient = {
  id: 103,
  nome: "Sérgio Ramos da Silva",
  cpf: "966.559.988-21",
  cpf_limpo: "96655998821",
  email: "sergio.ramos@email.com",
  telefone: "(11) 96655-9988",
  contrato: "CTR-2026-3312",
  plano: "Fibra 700MB Gamer Pro",
  valor_plano: 139.90,
  status_cliente: "bloqueado_parcial",
  endereco: "Rua Floriano Peixoto, 305",
  bairro: "Jd. América",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01402-000",
  ponto_referencia: "Esquina com Rua Oscar Freire",
  cto: "CTO-14 (Porta 02 - Splitter 1:16)",
  cpe: {
    modelo: "ZTE F670L GPON Dual Band",
    fabricante: "ZTE Corporation",
    serial: "ZTEG8812B305",
    mac: "74:83:C2:88:12:B3",
    rxPower: "-21.4 dBm",
    txPower: "+1.9 dBm",
    ipWan: "177.136.42.89",
    ssid24: "NAP_Gamer_Sergio",
    ssid5: "NAP_Gamer_Sergio_5G",
    senhaWifi: "GamerPro#2026",
    dispositivos: 4
  },
  metricas: {
    score_pagador: 5.4,
    tempo_contrato_meses: 7,
    chamados_abertos: 1
  },
  faturas: [
    {
      id: 303,
      valor: 139.90,
      vencimento: "2026-09-02",
      status: "atrasado",
      dias_atraso: 9,
      descricao: "Mensalidade Fibra 700M Gamer (Ref. Setembro/2026) - Em atraso",
      linha_digitavel: "03399.87654 32100.000000 12345.678901 1 99990000013990",
      codigo_pix: "00020126580014br.gov.bcb.pix0136mock-pix-key-303-84a2-9999999999995204000053039865802BR5915PROVEDOR NAP6009SAO PAULO62070503***6304ABCD"
    }
  ],
  tag: "Inadimplente • Teste Desbloqueio 24h",
  badgeColor: "amber",
  descricao_cenario: "Cenário de atraso de 9 dias para validação de régua de cobrança, aviso de débito e teste do botão de Desbloqueio em Confiança de 24 horas."
};

export const CLIENTE_TESTE_CANCELADO: PortalClient = {
  id: 104,
  nome: "Lucas Pereira da Costa",
  cpf: "147.258.369-10",
  cpf_limpo: "14725836910",
  email: "lucas.pereira@email.com",
  telefone: "(11) 91472-5836",
  contrato: "CTR-2025-1100",
  plano: "Fibra 300MB - Cancelado",
  valor_plano: 89.90,
  status_cliente: "inativo",
  endereco: "Rua do Cancelamento, 100",
  bairro: "Jd. Saudades",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01000-000",
  ponto_referencia: "Residencial",
  cto: "N/A",
  cpe: {
    modelo: "Equipamento Recolhido",
    fabricante: "N/A",
    serial: "N/A",
    mac: "N/A",
    rxPower: "N/A",
    txPower: "N/A",
    ipWan: "N/A",
    ssid24: "N/A",
    ssid5: "N/A",
    senhaWifi: "N/A",
    dispositivos: 0
  },
  metricas: {
    score_pagador: 8.0,
    tempo_contrato_meses: 12,
    chamados_abertos: 0
  },
  faturas: [],
  tag: "Cancelado • Retenção / Win-back",
  badgeColor: "blue",
  descricao_cenario: "Cenário de Ex-cliente que manteve o PWA instalado. Testa a jornada de reconquista (Win-back) com oferta exclusiva."
};

export const CLIENTES_TESTE_PORTAL: PortalClient[] = [
  CLIENTE_HOMOLOGACAO_PRINCIPAL,
  CLIENTE_TESTE_INADIMPLENTE,
  CLIENTE_TESTE_CANCELADO
];

export function getClientByCpf(cpf: string): PortalClient {
  const clean = cpf.replace(/\D/g, '');
  const found = CLIENTES_TESTE_PORTAL.find(c => c.cpf_limpo === clean || c.cpf === cpf);
  if (found) return found;

  // Fallback: se digitou outro CPF válido, gera perfil personalizado baseado no principal
  return {
    ...CLIENTE_HOMOLOGACAO_PRINCIPAL,
    cpf: cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf,
    cpf_limpo: clean,
    contrato: `CTR-2026-${clean.slice(-4) || '8894'}`
  };
}
