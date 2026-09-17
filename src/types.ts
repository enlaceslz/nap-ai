export interface Operador {
 id: number;
 nome: string;
 role: "operator" | "admin_operator" | "super_admin";
 status: "online" | "pausa" | "offline";
}

export interface Contato {
 id: number;
 cpf_cnpj: string;
 nome: string;
 telefone: string;
 plano?: string;
 status_cliente: "ativo" | "bloqueado" | "cancelado";
 endereco?: string;
 logradouro?: string;
 numero?: string;
 complemento?: string;
 bairro?: string;
 cidade?: string;
 uf?: string;
 cep?: string;
 ponto_referencia?: string;
 coordenadas?: {
 lat: number;
 lng: number;
 };
}

export interface Conversa {
 id: number;
 canal: "whatsapp" | "webchat" | "telefone";
 contato_id: number;
 nome_cliente?: string;
 telefone?: string;
 cpf?: string;
 plano?: string;
 protocolo?: string;
 tempo_espera?: string;
 fila?: string;
 operador_id?: number;
 status: "aberta" | "fechada" | "triagem_ia";
 prioridade: number;
 mensagens: Mensagem[];
}

export interface Mensagem {
 id: number;
 conversa_id: number;
 autor_tipo: "cliente" | "ia" | "operador";
 tipo?: "texto" | "nota_interna" | "audio" | "arquivo";
 conteudo: string;
 enviada_em: string;
 status?: "enviando" | "enviado" | "entregue" | "lido";
 duracao_audio?: string;
}

export interface Deal {
 id: number;
 titulo: string;
 estagio: string;
 pipeline: "Suporte" | "Vendas" | "Cobranca";
 contato: string;
 telefone?: string;
 endereco?: string;
 plano?: string;
 valor?: number;
 dias_atraso?: number;
 prioridade: number;
 criado_em?: string;
 contexto_ia?: string;
}

export interface AuditLogEntry {
 id: string;
 timestamp: string;
 usuario: string;
 usuarioEmail?: string;
 usuarioRole?: string;
 modulo: 'Acessos' | 'SGP / ERP' | 'GenieACS (TR-069)' | 'NOC / Zabbix' | 'Campanhas' | 'Segurança' | 'Configurações' | 'Sistema';
 acao: string;
 detalhes: string;
 categoria?: 'acesso' | 'configuracao' | 'disparo' | 'comando' | 'seguranca';
 severidade: 'info' | 'atencao' | 'critico';
 ip: string;
 userAgent?: string;
 payloadAntes?: any;
 payloadDepois?: any;
 status: 'sucesso' | 'falha';
 data?: string;
}

