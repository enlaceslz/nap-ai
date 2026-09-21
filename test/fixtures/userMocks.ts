/**
 * Fixtures de Desenvolvimento e Testes para Usuários do Provedor
 * ESTE ARQUIVO É DESTINADO EXCLUSIVAMENTE PARA TESTES E DESENVOLVIMENTO LOCAL.
 * PROIBIDO O USO OU IMPORTAÇÃO EM CAMINHOS DE EXECUÇÃO DE PRODUÇÃO (NODE_ENV=production).
 */

export const devMockUsuariosProvedor = [
  {
    id: 1,
    nome: "André Pereira",
    email: "andreljp@gmail.com",
    username: "andre.admin",
    cargo: "admin",
    nivel_hierarquia: 1,
    cargo_label: "Diretor Geral / SuperAdmin",
    ramal: "1000",
    status: "online",
    status_label: "Disponível",
    filas: ["Diretoria", "NOC N3", "Acesso Total"],
    telefone: "(11) 98888-0001",
    geolocalizacao: {
      ativo: true,
      lat: -23.55052,
      lng: -46.633308,
      precisao_metros: 5,
      endereco_estimado: "Sede Central - Av. Paulista, 1000",
      velocidade_kmh: 0,
      bateria_percentual: 98,
      atualizado_em: "Agora"
    },
    pwa: {
      instalado: true,
      dispositivo: "Desktop / Chrome",
      push_ativo: true,
      ultimo_acesso: "Agora"
    }
  },
  {
    id: 2,
    nome: "Camila Rocha",
    email: "camila.operadora@naptelecom.com.br",
    username: "camila.atendimento",
    cargo: "operador",
    nivel_hierarquia: 2,
    cargo_label: "Operadora de Atendimento & Suporte",
    ramal: "2001",
    status: "online",
    status_label: "Em Atendimento",
    filas: ["Suporte N1", "Financeiro / Faturas", "WhatsApp WABA"],
    telefone: "(11) 97777-1002",
    geolocalizacao: {
      ativo: false,
      lat: -23.55320,
      lng: -46.63540,
      precisao_metros: 10,
      endereco_estimado: "Central de Atendimento",
      velocidade_kmh: 0,
      bateria_percentual: 85,
      atualizado_em: "Há 10 min"
    },
    pwa: {
      instalado: true,
      dispositivo: "Mobile / iOS",
      push_ativo: true,
      ultimo_acesso: "Agora"
    }
  },
  {
    id: 3,
    nome: "Lucas Ferreira",
    email: "lucas.campo@naptelecom.com.br",
    username: "lucas.tecnico",
    cargo: "tecnico_campo",
    nivel_hierarquia: 3,
    cargo_label: "Técnico de Instalação & Reparo",
    veiculo: "Fiorino Branca #04",
    status: "em_rota",
    status_label: "Em Deslocamento",
    filas: ["Instalação Fibra", "Reparo Óptico"],
    telefone: "(11) 96666-2003",
    geolocalizacao: {
      ativo: true,
      lat: -23.54890,
      lng: -46.63890,
      precisao_metros: 8,
      endereco_estimado: "Rua Augusta, 450 - Consolação",
      velocidade_kmh: 38,
      bateria_percentual: 72,
      atualizado_em: "Há 2 min"
    },
    pwa: {
      instalado: true,
      dispositivo: "Android / PWA Campo",
      push_ativo: true,
      ultimo_acesso: "Há 2 min"
    }
  },
  {
    id: 4,
    nome: "Rodrigo Matos",
    email: "rodrigo.noc@naptelecom.com.br",
    username: "rodrigo.noc",
    cargo: "tecnico_noc",
    nivel_hierarquia: 3,
    cargo_label: "Especialista NOC N2",
    veiculo: "Unidade Móvel NOC #01",
    status: "no_cliente",
    status_label: "Atendimento no Cliente",
    filas: ["BGP / OLTs", "Rompimentos de Fibra"],
    telefone: "(11) 95555-3004",
    geolocalizacao: {
      ativo: true,
      lat: -23.56010,
      lng: -46.64520,
      precisao_metros: 6,
      endereco_estimado: "Alameda Santos, 1200 - Jardins",
      velocidade_kmh: 0,
      bateria_percentual: 88,
      atualizado_em: "Há 5 min"
    },
    pwa: {
      instalado: true,
      dispositivo: "Android / PWA Campo",
      push_ativo: true,
      ultimo_acesso: "Há 5 min"
    }
  }
];
