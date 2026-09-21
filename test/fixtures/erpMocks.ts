/**
 * Fixtures de Desenvolvimento e Testes para ERP (SGP / MikWeb / IXC / Hubsoft)
 * ESTE ARQUIVO É DESTINADO EXCLUSIVAMENTE PARA TESTES E DESENVOLVIMENTO LOCAL.
 * PROIBIDO O USO OU IMPORTAÇÃO EM CAMINHOS DE EXECUÇÃO DE PRODUÇÃO (NODE_ENV=production).
 */

export const devMockErpDatabase = [
  { id: 1, nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", plano: "Fibra 500MB", status: "ativo", onu_mac: "48:57:02:11:22:33" },
  { id: 2, nome: "Ana Beatriz Santos", cpf: "234.567.890-11", plano: "Fibra 700MB Gamer", status: "ativo", onu_mac: "48:57:02:44:55:66" },
  { id: 3, nome: "Roberto Albuquerque", cpf: "345.678.901-22", plano: "Fibra 300MB", status: "bloqueado", onu_mac: "48:57:02:77:88:99" },
  { id: 4, nome: "Juliana Mendes", cpf: "456.789.012-33", plano: "Fibra 1GB Turbo", status: "ativo", onu_mac: "48:57:02:AA:BB:CC" },
  { id: 5, nome: "Marcos Vinicius", cpf: "567.890.123-44", plano: "Fibra 500MB", status: "ativo", onu_mac: "48:57:02:DD:EE:FF" }
];
