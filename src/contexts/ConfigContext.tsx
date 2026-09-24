import React, { createContext, useContext, useState, useEffect } from 'react';

export interface MacroItem {
 id: string;
 atalho: string;
 titulo: string;
 conteudo: string;
 categoria: 'Financeiro' | 'Suporte' | 'Vendas' | 'Geral';
}

export interface PlanoLanding {
 nome: string;
 velocidade: string;
 preco: string;
 tag: string;
 wifi: string;
 streaming?: string;
}

export interface LandingPageConfig {
 templatePadrao: 1 | 2 | 3;
 tituloPrincipal: string;
 subtitulo: string;
 textoBotaoCta: string;
 whatsappVendas: string;
 telefoneVendas: string;
 mostrarBotaoPortal: boolean;
 mostrarBotaoAdmin: boolean;
 mostrarBarraFlutuante: boolean;
 plano1: PlanoLanding;
 plano2: PlanoLanding;
 plano3: PlanoLanding;
}

export type SupportedErp = 'ixc' | 'hubsoft' | 'radiusnet' | 'mksolutions' | 'ispfy' | 'mikweb' | 'sgp';

export interface ErpItemConfig {
 id: SupportedErp;
 nome: string;
 categoria: string;
 protocolo: string;
 urlBase: string;
 token?: string;
 appId?: string;
 clientId?: string;
 clientSecret?: string;
 usuarioId?: string;
 provedorId?: string;
 autoDesbloqueio48h: boolean;
 avisoSonoroInadimplente: boolean;
 habilitarConsultaRadius: boolean;
 syncIntervalMinutes: number;
 status: 'conectado' | 'desconectado' | 'alerta';
 ultimaSincronizacao?: string;
 latenciaMs?: number;
}

export interface SipTrunkConfig {
 id: string;
 nome: string;
 host: string;
 porta: number;
 usuario: string;
 senha?: string;
 codecs: string;
 status: 'ativo' | 'inativo';
}

export interface GenieAcsConfig {
 urlNbi: string;
 urlCwmp: string;
 urlUi: string;
 usuarioNbi: string;
 senhaNbi: string;
 status: 'conectado' | 'desconectado' | 'alerta';
}

export interface ZabbixConfig {
 urlJsonRpc: string;
 apiToken: string;
 usuarioApi: string;
 portaAgent: number;
 versao: string;
 status: 'conectado' | 'desconectado' | 'alerta';
}

export interface MapaConfig {
 provedor: string;
 tileUrlDark: string;
 tileUrlPadrao: string;
 tileUrlSatelite: string;
 atribuicao: string;
 centroPadrao: { lat: number; lng: number };
 zoomPadrao: number;
 clusterizarOnus: boolean;
 status: 'ativo';
}

export interface SystemConfig {
 provedor: {
 nomeFantasia: string;
 razaoSocial: string;
 cnpj: string;
 inscricaoEstadual: string;
 telefoneSuporte: string;
 telefoneWhatsapp: string;
 emailAtendimento: string;
 cidadeUf: string;
 corPrincipal: string;
 corSecundaria: string;
 logoUrl: string;
 portalUrl: string;
 themeMode: 'dark' | 'light' | 'system';
 };
 infraestrutura?: {
 dominioLandingPage: string;
 dominioGenieAcs: string;
 ipPublico: string;
 ipPrivadoTr069: string;
 radiusHost?: string;
 radiusPort?: number;
 radiusSecret?: string;
 postgresUrl?: string;
 };
 landingPage: LandingPageConfig;
 erpAtivo: SupportedErp;
 erps: Record<SupportedErp, ErpItemConfig>;
 sgp: {
 urlBase: string;
 appId: string;
 token: string;
 syncIntervalMinutes: number;
 autoDesbloqueio48h: boolean;
 avisoSonoroInadimplente: boolean;
 habilitarConsultaRadius: boolean;
 status: 'conectado' | 'desconectado' | 'alerta';
 };
 telefonia: {
 troncosSip: SipTrunkConfig[];
 ariHost: string;
 ariPort: number;
 ariUser: string;
 ariSecret: string;
 amiHost?: string;
 amiPort?: number;
 amiUser?: string;
 amiSecret?: string;
 contextoDiscagem: string;
 ramalWebRTC: string;
 secretWebRTC: string;
 websocketUrl: string;
 gravarChamadas: boolean;
 transcricaoAutomatica: boolean;
 status: 'conectado' | 'desconectado' | 'alerta';
 };
 genieacs: GenieAcsConfig;
 zabbix: ZabbixConfig;
 mapa: MapaConfig;
 whatsapp: {
 phoneNumberId: string;
 businessAccountId: string;
 tokenAcesso: string;
 webhookUrl: string;
 verifyToken: string;
 canalOficial: boolean;
 envioAutomaticoPix: boolean;
 canalPrincipalPortal?: boolean;
 politicaEnvioFaturasWaba?: 'criterio_operador' | 'automatico' | 'desativado';
 politicaEnvioInformativosWaba?: 'criterio_operador' | 'automatico' | 'desativado';
 homologadoMeta?: boolean;
 maiaAtendimento24h?: boolean;
 permitirHandoffHumanoInstantaneo?: boolean;
 status: 'conectado' | 'desconectado' | 'alerta';
 };
 ia: {
 modeloPrimario: string;
 provedorGateway: string;
    apiKey?: string;
    baseUrl?: string;
    failoverAutomatico?: boolean;
    alertarOperadoresEmEsgotamento?: boolean;
    alertaCotaAtivo?: boolean;
    nome?: string;
 temperatura: number;
 topP: number;
 maxTokens: number;
 promptSuporte: string;
 promptVendas: string;
 promptCobranca: string;
 gatilhoTransbordo: 'imediato' | 'apos_3_falhas' | 'solicitacao_cliente';
 copilotoAtivo: boolean;
 status: 'conectado' | 'desconectado' | 'alerta';
 };
 seguranca: {
 sessaoTimeoutMinutos: number;
 exigir2FAOperadores: boolean;
 permitirAcessoExterno: boolean;
 limiteTentativasLogin: number;
 armazenamentoLogsDias: number;
 };
 atendimento: {
 horarioSemana: string;
 horarioSabado: string;
 horarioDomingoFeriado: string;
 mensagemForaHorario: string;
 slaRespostaMinutos: number;
 slaResolucaoHoras: number;
 mensagemBoasVindas: string;
 permitirTransbordoNocForaHorario: boolean;
 };
 respostasRapidas: MacroItem[];
}

export const DEFAULT_CONFIG: SystemConfig = {
 provedor: {
 nomeFantasia: "D.J.D. TELECOM",
 razaoSocial: "D.J.D. TELECOM LTDA",
 cnpj: "36.954.827/0001-81",
 inscricaoEstadual: "ISENTO",
 telefoneSuporte: "0800 591 0000",
 telefoneWhatsapp: "",
 emailAtendimento: "suporte@djdtelecom.com.br",
 cidadeUf: "São Luís - MA",
 corPrincipal: "#2563eb",
 corSecundaria: "#10b981",
 logoUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=150&auto=format&fit=crop&q=80",
 portalUrl: "https://central.djdtelecom.com.br",
 themeMode: "dark"
 },
 infraestrutura: {
 dominioLandingPage: "https://djdtelecom.com.br",
 dominioGenieAcs: "",
 ipPublico: "",
 ipPrivadoTr069: "10.10.10.254",
 radiusHost: "",
 radiusPort: 3799,
 radiusSecret: "",
 postgresUrl: ""
 },
 landingPage: {
 templatePadrao: 1,
 tituloPrincipal: "Conexão Ultrarrápida em Fibra Óptica para Sua Casa ou Empresa",
 subtitulo: "Internet 100% fibra simétrica com Wi-Fi 6 de alta performance, estabilidade absoluta e suporte técnico humanizado 24h por dia.",
 textoBotaoCta: "Ver Planos Disponíveis",
 whatsappVendas: "",
 telefoneVendas: "0800 591 0000",
 mostrarBotaoPortal: true,
 mostrarBotaoAdmin: true,
 mostrarBarraFlutuante: true,
 plano1: { nome: "Fibra 400 Mega", velocidade: "400", preco: "89,90", tag: "Essencial", wifi: "Wi-Fi 5 Dual-Band Incluso", streaming: "Paramount+ Incluso" },
 plano2: { nome: "Fibra 700 Mega", velocidade: "700", preco: "119,90", tag: "Mais Popular", wifi: "Roteador Wi-Fi 6 Mesh Gigagold", streaming: "Paramount+ & Max Inclusos" },
 plano3: { nome: "Fibra 1 Giga Gamer", velocidade: "1000", preco: "159,90", tag: "Gamer / Pro", wifi: "2x Nós Mesh Wi-Fi 6 Mesh", streaming: "IP Fixo + Rota Baixa Latência" }
 },
 erpAtivo: 'sgp' as SupportedErp,
 erps: {
 ixc: {
 id: 'ixc',
 nome: 'IXC Soft (IXC Provedor)',
 categoria: 'ERP / CRM Telecom',
 protocolo: 'Webservice REST JSON v1',
 urlBase: 'https://ixc.djdtelecom.com.br/webservice/v1',
 token: '',
 usuarioId: '1',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 10,
 status: 'desconectado'
 },
 hubsoft: {
 id: 'hubsoft',
 nome: 'Hubsoft Telecom',
 categoria: 'ERP Cloud para ISPs',
 protocolo: 'API REST v1 / v2',
 urlBase: 'https://djdtelecom.hubsoft.com.br/api/v1',
 clientId: 'nap_omni_hubsoft_client',
 clientSecret: 'hub_sec_9918237498172938472918',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 },
 radiusnet: {
 id: 'radiusnet',
 nome: 'RadiusNet',
 categoria: 'ERP & AAA Radius',
 protocolo: 'REST API v2',
 urlBase: 'https://api.radiusnet.com.br/v2',
 token: 'rnet_key_99382173489127',
 provedorId: '1',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: false,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 },
 mksolutions: {
 id: 'mksolutions',
 nome: 'MK Solutions (MK-Auth / MK v2)',
 categoria: 'ERP Telecom & Financeiro',
 protocolo: 'REST / Webservice v1/v2',
 urlBase: 'https://mk.djdtelecom.com.br/api/v1',
 token: 'mk_jwt_token_secret_99812',
 appId: 'DJD_MK_APP',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 },
 ispfy: {
 id: 'ispfy',
 nome: 'ISPFy',
 categoria: 'Sistema de Gestão para ISPs',
 protocolo: 'ISPFy REST API v1',
 urlBase: 'https://djdtelecom.ispfy.com.br/api/v1',
 token: 'ispfy_tok_49817298371982',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: false,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 },
 mikweb: {
 id: 'mikweb',
 nome: 'MikWeb',
 categoria: 'Gerenciador MikroTik & ISP',
 protocolo: 'MikWeb API v1',
 urlBase: 'https://api.mikweb.com.br/v1',
 token: 'mikweb_token_7182947192837',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: false,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 },
 sgp: {
 id: 'sgp',
 nome: 'SGP (Sistema de Gestão de Provedores)',
 categoria: 'ERP Telecom Integrado',
 protocolo: 'REST / HTTPS v2.4',
 urlBase: "",
 appId: 'DJD_NATIVE_APP',
 token: '',
 autoDesbloqueio48h: true,
 avisoSonoroInadimplente: true,
 habilitarConsultaRadius: true,
 syncIntervalMinutes: 15,
 status: 'desconectado'
 }
 },
 sgp: {
		urlBase: "",
		appId: "",
		token: "",
		syncIntervalMinutes: 15,
		autoDesbloqueio48h: true,
		avisoSonoroInadimplente: true,
		habilitarConsultaRadius: true,
		status: "desconectado"
	},
 telefonia: {
 troncosSip: [
 { id: '1', nome: 'Tronco SIP Localhost (PJSIP Nativo)', host: '', porta: 5060, usuario: '', senha: '', codecs: 'alaw, ulaw, g729, opus', status: 'inativo' }
 ],
 ariHost: "",
 ariPort: 8088,
 ariUser: "nap_admin",
 ariSecret: "",
 amiHost: "",
 amiPort: 5038,
 amiUser: "nap_ami",
 amiSecret: "",
 contextoDiscagem: "from-internal",
 ramalWebRTC: "2001",
 secretWebRTC: "",
 websocketUrl: "",
 gravarChamadas: true,
 transcricaoAutomatica: true,
 status: "desconectado"
 },
 genieacs: {
 urlNbi: "",
 urlCwmp: "",
 urlUi: "",
 usuarioNbi: "nap_acs_admin",
 senhaNbi: "",
 status: "desconectado"
 },
 zabbix: {
 urlJsonRpc: "",
 apiToken: "",
 usuarioApi: "nap_zabbix_api",
 portaAgent: 10050,
 versao: "Zabbix Server 7.0 LTS",
 status: "desconectado"
 },
 mapa: {
 provedor: "OpenStreetMap / CARTO (Nativo Open-Source)",
 tileUrlDark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
 tileUrlPadrao: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
 tileUrlSatelite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
 atribuicao: "&copy; OpenStreetMap contributors &copy; CARTO",
 centroPadrao: { lat: -2.52972, lng: -44.302808 },
 zoomPadrao: 13,
 clusterizarOnus: true,
 status: "ativo"
 },
 whatsapp: {
 phoneNumberId: "",
 businessAccountId: "",
 tokenAcesso: "",
 webhookUrl: "https://api.provedor.com.br/api/webhooks/whatsapp",
 verifyToken: "",
 canalOficial: true,
 envioAutomaticoPix: false, // Por padrão, a critério do operador (não envio forçado)
 canalPrincipalPortal: true, // Portal do Cliente é o canal principal para notificação, cobrança e suporte
 politicaEnvioFaturasWaba: 'criterio_operador', // A critério do operador
 politicaEnvioInformativosWaba: 'criterio_operador', // A critério do operador
 homologadoMeta: true, // Validado com a Meta Cloud API
 maiaAtendimento24h: true, // WhatsApp disponível 24h atendido e respondido pela MaIA
 permitirHandoffHumanoInstantaneo: true, // Interatividade humana a qualquer momento
 status: "desconectado"
 },
 ia: {
 modeloPrimario: "gemini-2.5-flash",
 provedorGateway: "9router",
    apiKey: "",
    baseUrl: "https://9router.enlace.slz.br",
    failoverAutomatico: true,
    alertarOperadoresEmEsgotamento: true,
    alertaCotaAtivo: false,
    nome: "MaIA",
 temperatura: 0.6,
 topP: 0.95,
 maxTokens: 1024,
 promptSuporte: "Você é a MaIA, a inteligência artificial humanizada do {nome_provedor}. Atenda os clientes com extrema empatia, como uma pessoa real conversando de forma leve, amigável e natural. Evite parecer um robô. Entenda o problema da internet do cliente com carinho e precisão técnica.",
 promptVendas: "Você é a MaIA, consultora comercial humanizada do {nome_provedor}. Converse com o cliente de forma muito amigável, próxima e natural, ouvindo suas necessidades antes de oferecer nossos planos de fibra óptica simétrica.",
 promptCobranca: "Você é a MaIA, do suporte financeiro do {nome_provedor}. Haja com empatia, respeito e de forma extremamente humana. Ajude o cliente a resolver pendências fornecendo o PIX sem julgamentos, tornando a conversa leve.",
 gatilhoTransbordo: "solicitacao_cliente",
 copilotoAtivo: true,
 status: "desconectado"
 },
 seguranca: {
 sessaoTimeoutMinutos: 60,
 exigir2FAOperadores: true,
 permitirAcessoExterno: true,
 limiteTentativasLogin: 5,
 armazenamentoLogsDias: 90
 },
 atendimento: {
 horarioSemana: "08:00 - 20:00",
 horarioSabado: "08:00 - 14:00",
 horarioDomingoFeriado: "Plantão NOC Emergencial",
 mensagemForaHorario: "Olá! Nosso atendimento humano encerrou por hoje.",
 slaRespostaMinutos: 5,
 slaResolucaoHoras: 4,
 mensagemBoasVindas: "Olá! Seja bem-vindo à central de atendimento do {nome_provedor}.",
 permitirTransbordoNocForaHorario: true
 },
 respostasRapidas: []
};

interface ConfigContextType {
 config: SystemConfig;
 loading: boolean;
 updateConfig: (newConfig: Partial<SystemConfig>) => Promise<boolean>;
 uploadLogo: (file: File) => Promise<{ success: boolean; logoUrl?: string; error?: string }>;
 reloadConfig: () => Promise<void>;
 resetToNativeDefaults: () => Promise<boolean>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
 const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
 const [loading, setLoading] = useState(true);

 const fetchConfig = async () => {
 try {
 const res = await fetch('/api/configuracoes');
 if (res.ok) {
 const data = await res.json();
 if (data.config) {
 setConfig(prev => ({
 ...prev,
 ...data.config,
 provedor: { ...prev.provedor, ...(data.config.provedor || {}) },
 landingPage: { ...prev.landingPage, ...(data.config.landingPage || {}) },
 infraestrutura: { ...prev.infraestrutura, ...(data.config.infraestrutura || {}) },
 telefonia: { ...prev.telefonia, ...(data.config.telefonia || {}) },
 genieacs: { ...prev.genieacs, ...(data.config.genieacs || {}) },
 zabbix: { ...prev.zabbix, ...(data.config.zabbix || {}) },
 mapa: { ...prev.mapa, ...(data.config.mapa || {}) },
 sgp: { ...prev.sgp, ...(data.config.sgp || {}) }
 }));
 }
 }
 } catch (err) {
 console.warn("Usando configurações padrão (offline/fallback):", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchConfig();
 }, []);

 const resetToNativeDefaults = async (): Promise<boolean> => {
 try {
 setConfig(DEFAULT_CONFIG);
 const res = await fetch('/api/configuracoes/restaurar-nativos', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' }
 });
 if (res.ok) {
 const data = await res.json();
 if (data.config) {
 setConfig(data.config);
 }
 return true;
 }
 // Fallback: grava DEFAULT_CONFIG via PUT
 const putRes = await fetch('/api/configuracoes', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(DEFAULT_CONFIG)
 });
 return putRes.ok;
 } catch (e) {
 console.error("Erro ao restaurar credenciais nativas:", e);
 return false;
 }
 };

 const updateConfig = async (newConfigData: Partial<SystemConfig>): Promise<boolean> => {
 try {
 const updated = {
 ...config,
 ...newConfigData,
 provedor: { ...config.provedor, ...(newConfigData.provedor || {}) },
 landingPage: { ...config.landingPage, ...(newConfigData.landingPage || {}) },
 infraestrutura: { ...config.infraestrutura, ...(newConfigData.infraestrutura || {}) },
 telefonia: { ...config.telefonia, ...(newConfigData.telefonia || {}) },
 genieacs: { ...config.genieacs, ...(newConfigData.genieacs || {}) },
 zabbix: { ...config.zabbix, ...(newConfigData.zabbix || {}) },
 mapa: { ...config.mapa, ...(newConfigData.mapa || {}) },
 sgp: { ...config.sgp, ...(newConfigData.sgp || {}) }
 };
 setConfig(updated);

 const res = await fetch('/api/configuracoes', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updated)
 });
 return res.ok;
 } catch (e) {
 console.error("Falha ao salvar configurações no servidor:", e);
 return false;
 }
 };

 const uploadLogo = async (file: File): Promise<{ success: boolean; logoUrl?: string; error?: string }> => {
 return new Promise((resolve) => {
 // Validação de tipo
 if (!file.type.startsWith('image/')) {
 resolve({ success: false, error: 'Por favor, selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).' });
 return;
 }
 // Validação de tamanho (máximo 5MB)
 if (file.size > 5 * 1024 * 1024) {
 resolve({ success: false, error: 'A imagem deve ter no máximo 5MB.' });
 return;
 }

 const reader = new FileReader();
 reader.onload = async () => {
 const base64Data = reader.result as string;
 try {
 const res = await fetch('/api/configuracoes/upload-logo', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 logoData: base64Data,
 fileName: file.name
 })
 });

 if (res.ok) {
 const data = await res.json();
 const newLogo = data.logoUrl || base64Data;
 setConfig(prev => ({
 ...prev,
 provedor: { ...prev.provedor, logoUrl: newLogo }
 }));
 resolve({ success: true, logoUrl: newLogo });
 } else {
 const errData = await res.json();
 resolve({ success: false, error: errData.error || 'Falha ao salvar imagem.' });
 }
 } catch (e: any) {
 // Fallback caso rede falhe: aplica no estado local
 setConfig(prev => ({
 ...prev,
 provedor: { ...prev.provedor, logoUrl: base64Data }
 }));
 resolve({ success: true, logoUrl: base64Data });
 }
 };
 reader.onerror = () => {
 resolve({ success: false, error: 'Falha ao ler o arquivo de imagem.' });
 };
 reader.readAsDataURL(file);
 });
 };

 return (
 <ConfigContext.Provider value={{ config, loading, updateConfig, uploadLogo, reloadConfig: fetchConfig, resetToNativeDefaults }}>
 {children}
 </ConfigContext.Provider>
 );
}

export function useConfig() {
 const context = useContext(ConfigContext);
 if (!context) {
 throw new Error('useConfig deve ser utilizado dentro de um ConfigProvider');
 }
 return context;
}
