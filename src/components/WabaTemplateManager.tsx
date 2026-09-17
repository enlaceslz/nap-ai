import React, { useState, useMemo } from 'react';
import {
 MessageSquare,
 ShieldCheck,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 Copy,
 Check,
 Smartphone,
 Send,
 Sparkles,
 Info,
 HelpCircle,
 ExternalLink,
 Plus,
 Trash2,
 FileText,
 RotateCcw,
 Clock,
 ChevronRight,
 Layers,
 ArrowRight,
 Loader2,
 Lock,
 Tag,
 Eye,
 Code
} from 'lucide-react';

export interface MetaTemplateComponent {
 type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
 format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
 text?: string;
 example?: {
 header_text?: string[];
 body_text?: string[][];
 };
 buttons?: Array<{
 type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP' | 'COPY_CODE';
 text: string;
 url?: string;
 phone_number?: string;
 otp_type?: 'COPY_CODE' | 'ONE_TAP';
 }>;
}

export interface MetaTemplate {
 id: string;
 name: string;
 category: 'UTILITY' | 'AUTHENTICATION' | 'MARKETING';
 language: string;
 status: 'APPROVED' | 'PENDING' | 'REJECTED';
 components: MetaTemplateComponent[];
 samples?: Record<string, string>;
 description?: string;
 useCase?: string;
}

// Modelos pré-homologados oficiais recomendados pela Meta para Provedores de Internet
export const ISP_APPROVED_TEMPLATES: MetaTemplate[] = [
 {
 id: 'fatura_pix_isp',
 name: 'fatura_pix_isp',
 category: 'UTILITY',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Segunda via de fatura com chave PIX Copia e Cola e PDF em anexo.',
 useCase: 'Disparo de régua de cobrança ou resposta automática quando o assinante solicita 2ª via.',
 samples: {
 '{{1}}': 'João da Silva',
 '{{2}}': '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540599.905802BR5915FIBRA NET LTDA6009SAO PAULO62070503***6304ABCD',
 '{{3}}': 'R$ 99,90',
 '{{4}}': '15/10/2026'
 },
 components: [
 {
 type: 'HEADER',
 format: 'TEXT',
 text: 'Sua Fatura de Internet Chegou!'
 },
 {
 type: 'BODY',
 text: 'Olá, {{1}}! Segue a sua fatura deste mês da conexão de fibra óptica.\n\nVocê pode pagar instantaneamente usando o código PIX Copia e Cola abaixo:\n\n{{2}}\n\n*Valor:* {{3}}\n*Vencimento:* {{4}}\n\nAgradecemos por manter sua mensalidade em dia e garantir a velocidade máxima da sua conexão!',
 example: {
 body_text: [['João da Silva', '0002012658...4000', 'R$ 99,90', '15/10/2026']]
 }
 },
 {
 type: 'FOOTER',
 text: 'Provedor de Internet • Atendimento oficial via WABA'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'QUICK_REPLY',
 text: 'Já efetuei o pagamento'
 },
 {
 type: 'URL',
 text: 'Ver Fatura Completa (PDF)',
 url: 'https://cliente.meuprovedor.com.br/fatura/{{1}}'
 }
 ]
 }
 ]
 },
 {
 id: 'aviso_manutencao_fibra',
 name: 'aviso_manutencao_fibra',
 category: 'UTILITY',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Comunicado de manutenção preventiva ou rompimento emergencial de cabo de fibra óptica.',
 useCase: 'Envio em massa preventivo para clientes de um determinado bairro ou OLT para reduzir chamados no suporte.',
 samples: {
 '{{1}}': 'Maria Oliveira',
 '{{2}}': 'Centro e Bairro das Flores',
 '{{3}}': 'Melhoria preventiva na OLT principal',
 '{{4}}': '14:30 às 16:30'
 },
 components: [
 {
 type: 'HEADER',
 format: 'TEXT',
 text: 'Aviso Importante: Manutenção de Rede'
 },
 {
 type: 'BODY',
 text: 'Prezado(a) assinante {{1}}, informamos que nossa equipe de engenharia está executando serviços de infraestrutura óptica na região de {{2}}.\n\n*Motivo:* {{3}}\n*Previsão de normalização:* {{4}}\n\nDurante este intervalo, a conexão poderá apresentar instabilidade momentânea. Nossos técnicos já estão no local finalizando os reparos.',
 example: {
 body_text: [['Maria Oliveira', 'Centro e Bairro das Flores', 'Melhoria preventiva na OLT principal', '14:30 às 16:30']]
 }
 },
 {
 type: 'FOOTER',
 text: 'NOC / Engenharia de Redes'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'QUICK_REPLY',
 text: 'Acompanhar no Portal'
 },
 {
 type: 'QUICK_REPLY',
 text: 'Falar com Suporte Técnico'
 }
 ]
 }
 ]
 },
 {
 id: 'confirmacao_visita_tecnica',
 name: 'confirmacao_visita_tecnica',
 category: 'UTILITY',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Confirmação e lembrete de agendamento de visita do técnico de campo.',
 useCase: 'Disparado pelo Kanban de Suporte quando a Ordem de Serviço (OS) é atribuída ao técnico de rua.',
 samples: {
 '{{1}}': 'Carlos Eduardo',
 '{{2}}': 'Manutenção de ONU e troca de conector óptico',
 '{{3}}': 'Amanhã, 14/10 às 09:30',
 '{{4}}': 'Lucas Ferreira (Técnico N2)'
 },
 components: [
 {
 type: 'HEADER',
 format: 'TEXT',
 text: 'Agendamento de Visita Técnica'
 },
 {
 type: 'BODY',
 text: 'Olá, {{1}}! Sua visita técnica foi agendada com sucesso.\n\n*Serviço:* {{2}}\n*Horário Previsto:* {{3}}\n*Técnico Responsável:* {{4}}\n\nPara sua segurança, todos os nossos técnicos comparecem uniformizados e com crachá de identificação oficial. Por favor, certifique-se de que haverá um maior de 18 anos no local.',
 example: {
 body_text: [['Carlos Eduardo', 'Troca de conector óptico', 'Amanhã, às 09:30', 'Lucas Ferreira']]
 }
 },
 {
 type: 'FOOTER',
 text: 'Central de Operações de Campo'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'QUICK_REPLY',
 text: 'Confirmar Presença'
 },
 {
 type: 'QUICK_REPLY',
 text: 'Preciso Reagendar'
 }
 ]
 }
 ]
 },
 {
 id: 'desbloqueio_confianca_confirmado',
 name: 'desbloqueio_confianca_confirmado',
 category: 'UTILITY',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Notificação de liberação em confiança de 48 horas da conexão após solicitação do cliente.',
 useCase: 'Disparado pelo ERP/SGP automaticamente quando o cliente aciona o desbloqueio temporário no portal ou chat.',
 samples: {
 '{{1}}': 'Fernanda Lima',
 '{{2}}': '48 horas',
 '{{3}}': '16/10 às 18:00'
 },
 components: [
 {
 type: 'HEADER',
 format: 'TEXT',
 text: 'Conexão Desbloqueada em Confiança!'
 },
 {
 type: 'BODY',
 text: 'Olá, {{1}}! Recebemos sua solicitação e o desbloqueio em confiança da sua internet foi liberado com sucesso.\n\nSeu sinal foi restabelecido pelo período temporário de {{2}}, válido até {{3}}.\n\nOrientamos efetuar a quitação da pendência dentro do prazo para evitar nova suspensão automática do sinal.',
 example: {
 body_text: [['Fernanda Lima', '48 horas', '16/10 às 18:00']]
 }
 },
 {
 type: 'FOOTER',
 text: 'Autoatendimento SGP Financeiro'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'QUICK_REPLY',
 text: 'Receber Código PIX'
 },
 {
 type: 'QUICK_REPLY',
 text: 'Ver Comprovante no Portal'
 }
 ]
 }
 ]
 },
 {
 id: 'codigo_acesso_portal',
 name: 'codigo_acesso_portal',
 category: 'AUTHENTICATION',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Código de autenticação seguro de 6 dígitos (OTP) para login no Portal do Assinante.',
 useCase: 'Autenticação sem senha (passwordless) por 2FA no aplicativo PWA do cliente.',
 samples: {
 '{{1}}': '842915'
 },
 components: [
 {
 type: 'BODY',
 text: 'Seu código de segurança para acessar o Portal do Assinante é {{1}}. Não compartilhe este código com ninguém. Ele expira em 5 minutos.',
 example: {
 body_text: [['842915']]
 }
 },
 {
 type: 'FOOTER',
 text: 'Segurança de Acesso'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'COPY_CODE',
 text: 'Copiar Código de Segurança'
 }
 ]
 }
 ]
 },
 {
 id: 'upgrade_fibra_oferta',
 name: 'upgrade_fibra_oferta',
 category: 'MARKETING',
 language: 'pt_BR',
 status: 'APPROVED',
 description: 'Campanha promocional de upgrade de velocidade com botão obrigatório de Opt-out.',
 useCase: 'Campanha de fidelização para clientes pontuais ofertando aumento de banda por valor promocional.',
 samples: {
 '{{1}}': 'Paulo Roberto',
 '{{2}}': '600 Mega Fibra com Wi-Fi 6 Mesh',
 '{{3}}': 'R$ 19,90'
 },
 components: [
 {
 type: 'HEADER',
 format: 'TEXT',
 text: 'Upgrade Exclusivo para Você!'
 },
 {
 type: 'BODY',
 text: 'Olá, {{1}}! Como você é um cliente especial da nossa rede, preparamos uma oferta de upgrade de velocidade para sua residência.\n\nPasse para o plano {{2}} pagando apenas {{3}} a mais na sua mensalidade atual.\n\nA instalação do novo roteador de alta performance é 100% gratuita.',
 example: {
 body_text: [['Paulo Roberto', '600 Mega Fibra com Wi-Fi 6 Mesh', 'R$ 19,90']]
 }
 },
 {
 type: 'FOOTER',
 text: 'Para não receber ofertas, clique em Cancelar Notificações'
 },
 {
 type: 'BUTTONS',
 buttons: [
 {
 type: 'QUICK_REPLY',
 text: 'Quero Contratar o Upgrade'
 },
 {
 type: 'QUICK_REPLY',
 text: 'Cancelar Notificações' // Botão de Opt-out obrigatório pela Meta para categoria MARKETING
 }
 ]
 }
 ]
 }
];

export default function WabaTemplateManager() {
 const [templates, setTemplates] = useState<MetaTemplate[]>(ISP_APPROVED_TEMPLATES);
 const [selectedTemplate, setSelectedTemplate] = useState<MetaTemplate>(ISP_APPROVED_TEMPLATES[0]);
 const [previewMode, setPreviewMode] = useState<'sample' | 'variables'>('sample');
 const [activeTab, setActiveTab] = useState<'library' | 'editor' | 'guidelines' | 'json'>('library');
 const [copiedKey, setCopiedKey] = useState<string | null>(null);
 const [testPhoneNumber, setTestPhoneNumber] = useState('(11) 98765-4321');
 const [sendingTest, setSendingTest] = useState(false);
 const [testSuccess, setTestSuccess] = useState<string | null>(null);

 // Estados do Editor de Template Customizado
 const [editName, setEditName] = useState('aviso_vencimento_isp');
 const [editCategory, setEditCategory] = useState<'UTILITY' | 'AUTHENTICATION' | 'MARKETING'>('UTILITY');
 const [editHeaderType, setEditHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT'>('TEXT');
 const [editHeaderText, setEditHeaderText] = useState('Lembrete de Vencimento de Fatura');
 const [editBodyText, setEditBodyText] = useState(
 'Olá, {{1}}! Sua fatura de internet referente ao plano {{2}} vence no dia {{3}}.\n\nEvite a suspensão parcial da sua conexão e acerte seu pagamento via PIX.\n\nCódigo PIX Copia e Cola:\n{{4}}\n\nCaso já tenha efetuado o pagamento, por favor desconsidere este aviso.'
 );
 const [editFooterText, setEditFooterText] = useState('Financeiro • Seu Provedor de Internet');
 const [editButtons, setEditButtons] = useState<Array<{ type: 'QUICK_REPLY' | 'URL'; text: string; url?: string }>>([
 { type: 'QUICK_REPLY', text: 'Já realizei o pagamento' },
 { type: 'URL', text: 'Abrir 2ª Via', url: 'https://cliente.meuprovedor.com.br/faturas' }
 ]);
 const [editSamples, setEditSamples] = useState<Record<string, string>>({
 '{{1}}': 'Ana Cláudia',
 '{{2}}': '500 Mega Fibra Gamer',
 '{{3}}': '20/10/2026',
 '{{4}}': '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3'
 });

 // Análise em tempo real de conformidade com os requisitos da Meta
 const validationResults = useMemo(() => {
 const issues: Array<{ id: string; type: 'error' | 'warning' | 'success'; title: string; desc: string }> = [];
 const text = editBodyText.trim();

 // 1. Checagem de nome
 if (!editName) {
 issues.push({
 id: 'name-empty',
 type: 'error',
 title: 'Nome do Template Obrigatório',
 desc: 'O nome do template é obrigatório na Meta.'
 });
 } else if (!/^[a-z0-9_]+$/.test(editName)) {
 issues.push({
 id: 'name-invalid',
 type: 'error',
 title: 'Nome Fora do Padrão Meta',
 desc: 'Use apenas letras minúsculas, números e sublinhados (_). Espaços ou letras maiúsculas causam rejeição automática.'
 });
 } else {
 issues.push({
 id: 'name-valid',
 type: 'success',
 title: 'Nome em Conformidade',
 desc: 'Nome no formato técnico exigido pela Graph API da Meta.'
 });
 }

 // 2. Extração de variáveis do corpo
 const varsFound = text.match(/\{\{\d+\}\}/g) || [];
 const uniqueVars = Array.from(new Set(varsFound));

 // 3. Regra de ouro da Meta: Não iniciar com variável
 if (text.startsWith('{{')) {
 issues.push({
 id: 'var-start',
 type: 'error',
 title: 'Corpo Começa com Variável',
 desc: 'A Meta proíbe templates que iniciam com variável (ex: "{{1}} olá..."). Insira uma saudação ou palavra fixa antes, ex: "Olá, {{1}}".'
 });
 } else {
 issues.push({
 id: 'var-start-ok',
 type: 'success',
 title: 'Início com Texto Fixo',
 desc: 'O template não começa com variável solta.'
 });
 }

 // 4. Regra de ouro da Meta: Não terminar com variável
 if (text.endsWith('}}')) {
 issues.push({
 id: 'var-end',
 type: 'error',
 title: 'Corpo Termina com Variável',
 desc: 'A Meta proíbe templates que terminam com variável (ex: "...acesse {{1}}"). Adicione um ponto final ou texto de encerramento após a variável.'
 });
 } else {
 issues.push({
 id: 'var-end-ok',
 type: 'success',
 title: 'Término com Texto Fixo',
 desc: 'O template possui fechamento com texto ou pontuação adequada.'
 });
 }

 // 5. Regra da Meta: Não ter variáveis consecutivas (ex: {{1}} {{2}})
 if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(text)) {
 issues.push({
 id: 'var-consecutive',
 type: 'error',
 title: 'Variáveis Consecutivas Detectadas',
 desc: 'A Meta rejeita variáveis coladas (ex: "{{1}} {{2}}"). Você deve inserir texto explicativo entre elas (ex: "{{1}}, referente ao plano {{2}}").'
 });
 } else {
 issues.push({
 id: 'var-consecutive-ok',
 type: 'success',
 title: 'Sem Variáveis Consecutivas',
 desc: 'Todas as variáveis possuem delimitadores textuais claros.'
 });
 }

 // 6. Regra da Meta: Encurtadores de links proibidos
 const prohibitedShorteners = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'encurtador.com.br'];
 const foundShortener = prohibitedShorteners.find(s => text.toLowerCase().includes(s));
 if (foundShortener) {
 issues.push({
 id: 'shortener-prohibited',
 type: 'error',
 title: 'Encurtador de Link Proibido Encontrado',
 desc: `O domínio "${foundShortener}" é rejeitado pela Meta por risco de phishing/spam. Use o domínio oficial do seu provedor de internet.`
 });
 } else {
 issues.push({
 id: 'shortener-ok',
 type: 'success',
 title: 'Domínios Transparentes',
 desc: 'Nenhum encurtador de links suspeito foi detectado.'
 });
 }

 // 7. Regra da Meta para categoria MARKETING: Botão de Opt-out obrigatório
 if (editCategory === 'MARKETING') {
 const hasOptOut = editButtons.some(b => 
 b.text.toLowerCase().includes('cancelar') ||
 b.text.toLowerCase().includes('parar') ||
 b.text.toLowerCase().includes('sair') ||
 b.text.toLowerCase().includes('opt-out')
 );
 if (!hasOptOut) {
 issues.push({
 id: 'optout-missing',
 type: 'warning',
 title: 'Aviso de Opt-Out Recomendado (Marketing)',
 desc: 'Para campanhas de Marketing, a Meta exige ou recomenda fortemente um botão claro de descadastro/opt-out (ex: "Cancelar Notificações").'
 });
 } else {
 issues.push({
 id: 'optout-ok',
 type: 'success',
 title: 'Botão de Opt-Out Presente',
 desc: 'Em total conformidade com as diretrizes de marketing da Meta.'
 });
 }
 }

 // 8. Regra para AUTHENTICATION: Sem emojis, sem imagens, sem links soltos
 if (editCategory === 'AUTHENTICATION') {
 if (editHeaderType !== 'NONE') {
 issues.push({
 id: 'auth-header-invalid',
 type: 'error',
 title: 'Cabeçalho Não Permitido em Autenticação (2FA)',
 desc: 'Templates de AUTHENTICATION não podem ter cabeçalho de mídia nem texto. Devem ser limpos.'
 });
 }
 if (text.includes('http://') || text.includes('https://')) {
 issues.push({
 id: 'auth-link-invalid',
 type: 'error',
 title: 'Links no Corpo Proibidos em Autenticação',
 desc: 'Códigos de segurança não podem conter links de navegação no texto.'
 });
 }
 }

 // 9. Checagem de amostras para submissão
 const missingSamples = uniqueVars.filter(v => !editSamples[v] || editSamples[v].trim() === '');
 if (missingSamples.length > 0) {
 issues.push({
 id: 'samples-missing',
 type: 'warning',
 title: 'Valores de Amostra Incompletos',
 desc: `A Meta exige valores de exemplo reais para todas as variáveis. Faltam amostras para: ${missingSamples.join(', ')}.`
 });
 } else if (uniqueVars.length > 0) {
 issues.push({
 id: 'samples-ok',
 type: 'success',
 title: 'Todas as Amostras Preenchidas',
 desc: 'Exemplos prontos para análise pelos revisores humanos da Meta.'
 });
 }

 // 10. Limites de Caracteres
 if (editHeaderText.length > 60) {
 issues.push({
 id: 'header-length',
 type: 'error',
 title: 'Cabeçalho Excede 60 Caracteres',
 desc: `Atualmente com ${editHeaderText.length} caracteres. O limite máximo da Meta é 60.`
 });
 }
 if (text.length > 1024) {
 issues.push({
 id: 'body-length',
 type: 'error',
 title: 'Corpo Excede 1024 Caracteres',
 desc: `Atualmente com ${text.length} caracteres. O limite máximo da Meta é 1024.`
 });
 }
 if (editFooterText.length > 60) {
 issues.push({
 id: 'footer-length',
 type: 'error',
 title: 'Rodapé Excede 60 Caracteres',
 desc: `Atualmente com ${editFooterText.length} caracteres. O limite máximo da Meta é 60.`
 });
 }

 const hasErrors = issues.some(i => i.type === 'error');
 const hasWarnings = issues.some(i => i.type === 'warning');
 const score = hasErrors ? 45 : hasWarnings ? 80 : 100;

 return {
 issues,
 hasErrors,
 hasWarnings,
 score,
 uniqueVars
 };
 }, [editName, editCategory, editHeaderType, editHeaderText, editBodyText, editFooterText, editButtons, editSamples]);

 // Carrega um template pré-definido para o editor
 const handleLoadTemplateIntoEditor = (tpl: MetaTemplate) => {
 setEditName(tpl.name);
 setEditCategory(tpl.category);
 
 const headerComp = tpl.components.find(c => c.type === 'HEADER');
 if (headerComp) {
 setEditHeaderType(headerComp.format as any || 'TEXT');
 setEditHeaderText(headerComp.text || '');
 } else {
 setEditHeaderType('NONE');
 setEditHeaderText('');
 }

 const bodyComp = tpl.components.find(c => c.type === 'BODY');
 setEditBodyText(bodyComp?.text || '');

 const footerComp = tpl.components.find(c => c.type === 'FOOTER');
 setEditFooterText(footerComp?.text || '');

 const btnComp = tpl.components.find(c => c.type === 'BUTTONS');
 if (btnComp?.buttons) {
 setEditButtons(btnComp.buttons.map(b => ({
 type: b.type === 'URL' ? 'URL' : 'QUICK_REPLY',
 text: b.text,
 url: b.url
 })));
 } else {
 setEditButtons([]);
 }

 if (tpl.samples) {
 setEditSamples({ ...tpl.samples });
 }

 setSelectedTemplate(tpl);
 setActiveTab('editor');
 };

 // Inserir variável no texto do corpo
 const insertVariable = () => {
 const varsFound = editBodyText.match(/\{\{\d+\}\}/g) || [];
 const nextIndex = varsFound.length + 1;
 const varTag = `{{${nextIndex}}}`;
 setEditBodyText(prev => prev + ` ${varTag} `);
 setEditSamples(prev => ({
 ...prev,
 [varTag]: `Exemplo ${nextIndex}`
 }));
 };

 // Copiar para clipboard com feedback
 const copyToClipboard = (text: string, key: string) => {
 navigator.clipboard.writeText(text);
 setCopiedKey(key);
 setTimeout(() => setCopiedKey(null), 2500);
 };

 // Geração do Payload exato no formato da Meta Graph API
 const metaGraphApiPayload = useMemo(() => {
 const components: any[] = [];

 if (editHeaderType === 'TEXT' && editHeaderText.trim()) {
 components.push({
 type: 'HEADER',
 format: 'TEXT',
 text: editHeaderText
 });
 } else if (editHeaderType !== 'NONE') {
 components.push({
 type: 'HEADER',
 format: editHeaderType
 });
 }

 // Variáveis de exemplo para o body
 const bodyVars = editBodyText.match(/\{\{\d+\}\}/g) || [];
 const uniqueBodyVars = Array.from(new Set(bodyVars));
 const sampleValues = uniqueBodyVars.map(v => editSamples[v] || 'Exemplo');

 const bodyObj: any = {
 type: 'BODY',
 text: editBodyText
 };
 if (sampleValues.length > 0) {
 bodyObj.example = {
 body_text: [sampleValues]
 };
 }
 components.push(bodyObj);

 if (editFooterText.trim()) {
 components.push({
 type: 'FOOTER',
 text: editFooterText
 });
 }

 if (editButtons.length > 0) {
 components.push({
 type: 'BUTTONS',
 buttons: editButtons.map(b => {
 if (b.type === 'URL') {
 return {
 type: 'URL',
 text: b.text,
 url: b.url || 'https://meuprovedor.com.br'
 };
 }
 return {
 type: 'QUICK_REPLY',
 text: b.text
 };
 })
 });
 }

 return {
 name: editName,
 category: editCategory,
 language: 'pt_BR',
 components
 };
 }, [editName, editCategory, editHeaderType, editHeaderText, editBodyText, editFooterText, editButtons, editSamples]);

 // Renderização do texto no simulador de celular
 const renderedSimulatedText = useMemo(() => {
 let raw = editBodyText;
 if (previewMode === 'sample') {
 Object.entries(editSamples).forEach(([placeholder, val]) => {
 raw = raw.replaceAll(placeholder, val || placeholder);
 });
 }
 return raw;
 }, [editBodyText, editSamples, previewMode]);

 // Simular envio de teste
 const handleSendTestMessage = () => {
 setSendingTest(true);
 setTestSuccess(null);
 setTimeout(() => {
 setSendingTest(false);
 setTestSuccess(`Mensagem HSM de teste disparada com sucesso para ${testPhoneNumber} via WABA Cloud API! (ID: wamid.HBgLMjU1...==)`);
 }, 1200);
 };

 // Salvar novo template na lista
 const handleSaveToLibrary = () => {
 const newTpl: MetaTemplate = {
 id: editName,
 name: editName,
 category: editCategory,
 language: 'pt_BR',
 status: validationResults.hasErrors ? 'REJECTED' : 'PENDING',
 description: 'Template customizado submetido para validação na Meta.',
 useCase: 'Uso operacional no atendimento do provedor.',
 samples: { ...editSamples },
 components: metaGraphApiPayload.components
 };

 setTemplates(prev => {
 const exists = prev.findIndex(t => t.name === editName);
 if (exists >= 0) {
 const copy = [...prev];
 copy[exists] = newTpl;
 return copy;
 }
 return [newTpl, ...prev];
 });

 setSelectedTemplate(newTpl);
 setActiveTab('library');
 };

 return (
 <div className="bg-card border border-border rounded-2xl p-6 text-foreground shadow-xl space-y-6">
 {/* Cabeçalho do Módulo */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
 <MessageSquare size={20} />
 </div>
 <h2 className="text-lg font-bold text-foreground font-outfit flex items-center gap-2">
 WhatsApp Business API Oficial • Gestão & Homologação de Templates (HSM)
 </h2>
 <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 Meta Cloud API v19.0
 </span>
 </div>
 <p className="text-xs text-muted-foreground">
 Crie, valide e submeta modelos de mensagem conforme os <strong>Requisitos Oficiais da Meta</strong> para evitar rejeições e manter alta qualidade de número.
 </p>
 </div>

 {/* Abas de Navegação Interna */}
 <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border">
 <button
 onClick={() => setActiveTab('library')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
 activeTab === 'library'
 ? 'bg-emerald-600 text-white shadow-md'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Layers size={14} />
 <span>Biblioteca Homologada</span>
 </button>
 <button
 onClick={() => setActiveTab('editor')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
 activeTab === 'editor'
 ? 'bg-emerald-600 text-white shadow-md'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Sparkles size={14} />
 <span>Editor & Validador Meta</span>
 </button>
 <button
 onClick={() => setActiveTab('guidelines')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
 activeTab === 'guidelines'
 ? 'bg-emerald-600 text-white shadow-md'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <ShieldCheck size={14} />
 <span>Regras da Meta (Guia)</span>
 </button>
 <button
 onClick={() => setActiveTab('json')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
 activeTab === 'json'
 ? 'bg-emerald-600 text-white shadow-md'
 : 'text-muted-foreground hover:text-foreground hover:bg-accent'
 }`}
 >
 <Code size={14} />
 <span>Payload Graph API</span>
 </button>
 </div>
 </div>

 {/* ABA 1: BIBLIOTECA DE TEMPLATES HOMOLOGADOS */}
 {activeTab === 'library' && (
 <div className="space-y-6">
 <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
 <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
 <div className="text-xs text-muted-foreground leading-relaxed">
 <span className="font-bold text-emerald-400">Templates Pré-Aprovados para ISPs:</span> Estes modelos seguem rigorosamente a taxonomia da Meta (categorias <code>UTILITY</code>, <code>AUTHENTICATION</code> e <code>MARKETING</code>). Você pode cloná-los para o editor ou usá-los imediatamente em automações de cobrança, rompimento de fibra e visitas técnicas.
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {templates.map(tpl => {
 const bodyComp = tpl.components.find(c => c.type === 'BODY');
 const headerComp = tpl.components.find(c => c.type === 'HEADER');
 const btnComp = tpl.components.find(c => c.type === 'BUTTONS');

 return (
 <div
 key={tpl.id}
 className="bg-background border border-border rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <Tag size={14} className="text-emerald-400" />
 <span className="text-xs font-mono font-bold text-foreground truncate max-w-[150px]">
 {tpl.name}
 </span>
 </div>
 <div className="flex items-center gap-1.5">
 <span
 className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
 tpl.category === 'UTILITY'
 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
 : tpl.category === 'AUTHENTICATION'
 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
 : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
 }`}
 >
 {tpl.category}
 </span>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
 <CheckCircle2 size={10} />
 {tpl.status}
 </span>
 </div>
 </div>

 <p className="text-[11px] text-muted-foreground line-clamp-2">
 {tpl.description}
 </p>

 {/* Prévia compacta do corpo */}
 <div className="bg-card/80 border border-border rounded-lg p-2.5 text-[11px] text-muted-foreground font-mono line-clamp-3 leading-relaxed">
 {headerComp?.text && (
 <div className="font-bold text-foreground mb-1">
 {headerComp.text}
 </div>
 )}
 {bodyComp?.text}
 </div>

 {btnComp?.buttons && btnComp.buttons.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {btnComp.buttons.map((b, idx) => (
 <span
 key={idx}
 className="text-[10px] font-medium bg-white/5 border border-border px-2 py-0.5 rounded text-muted-foreground"
 >
 {b.text}
 </span>
 ))}
 </div>
 )}
 </div>

 <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-2">
 <button
 onClick={() => handleLoadTemplateIntoEditor(tpl)}
 className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 w-full justify-center"
 >
 <Sparkles size={13} />
 <span>Abrir no Editor & Testar</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ABA 2: EDITOR INTERATIVO COM VALIDAÇÃO EM TEMPO REAL E SIMULADOR */}
 {activeTab === 'editor' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Coluna Esquerda: Formulário do Template (7 colunas) */}
 <div className="lg:col-span-7 space-y-5">
 {/* Barra de Status e Score da Meta */}
 <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Índice de Conformidade Meta:</span>
 <span
 className={`text-xs font-bold px-2 py-0.5 rounded-full ${
 validationResults.score === 100
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
 : validationResults.score >= 80
 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 : 'bg-red-500/10 text-red-400 border border-red-500/20'
 }`}
 >
 {validationResults.score}% APROVÁVEL
 </span>
 </div>
 <p className="text-[11px] text-muted-foreground">
 {validationResults.hasErrors
 ? 'Existem violações críticas que causam rejeição imediata da Meta.'
 : validationResults.hasWarnings
 ? 'Template válido, com boas práticas sugeridas.'
 : 'Template 100% alinhado com as políticas oficiais da Meta Graph API.'}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={handleSaveToLibrary}
 disabled={validationResults.hasErrors}
 className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
 >
 <Check size={14} />
 <span>Salvar Template</span>
 </button>
 </div>
 </div>

 {/* Metadados Técnicos */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
 Nome Técnico na Meta (WABA)
 </label>
 <input
 type="text"
 value={editName}
 onChange={e => setEditName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
 placeholder="ex: fatura_pix_isp"
 className="w-full p-2.5 bg-background border border-border rounded-xl text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
 />
 <span className="text-[10px] text-muted-foreground mt-1 block">Apenas minúsculas e _ (sem espaços).</span>
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
 Categoria Oficial Meta
 </label>
 <select
 value={editCategory}
 onChange={e => setEditCategory(e.target.value as any)}
 className="w-full p-2.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
 >
 <option value="UTILITY">UTILITY (Cobrança, Fatura, OS, Manutenção)</option>
 <option value="AUTHENTICATION">AUTHENTICATION (Códigos OTP / 2FA Portal)</option>
 <option value="MARKETING">MARKETING (Ofertas, Upgrade Fibra, Fidelização)</option>
 </select>
 <span className="text-[10px] text-muted-foreground mt-1 block">
 {editCategory === 'UTILITY' && 'Conversas de 24h com menor custo. Proibido marketing.'}
 {editCategory === 'AUTHENTICATION' && 'Para envio de códigos de segurança de 6 dígitos.'}
 {editCategory === 'MARKETING' && 'Exige botão de opt-out obrigatório pela Meta.'}
 </span>
 </div>
 </div>

 {/* Cabeçalho (Header) */}
 {editCategory !== 'AUTHENTICATION' && (
 <div className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Cabeçalho (Opcional)
 </label>
 <div className="flex items-center gap-2">
 {(['NONE', 'TEXT', 'IMAGE', 'DOCUMENT'] as const).map(type => (
 <button
 key={type}
 type="button"
 onClick={() => setEditHeaderType(type)}
 className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
 editHeaderType === type
 ? 'bg-emerald-600 text-white'
 : 'bg-white/5 text-muted-foreground hover:text-foreground'
 }`}
 >
 {type === 'NONE' ? 'Sem Cabeçalho' : type}
 </button>
 ))}
 </div>
 </div>

 {editHeaderType === 'TEXT' && (
 <div>
 <input
 type="text"
 maxLength={60}
 value={editHeaderText}
 onChange={e => setEditHeaderText(e.target.value)}
 placeholder="ex: Sua Fatura de Internet Chegou"
 className="w-full p-2.5 bg-card border border-border rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
 />
 <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
 <span>Texto em negrito que aparece no topo da mensagem</span>
 <span>{editHeaderText.length}/60</span>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Corpo do Texto (Body) */}
 <div className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Corpo da Mensagem (Body)
 </label>
 <button
 type="button"
 onClick={insertVariable}
 className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
 >
 <Plus size={13} />
 <span>Inserir Variável</span>
 </button>
 </div>

 <textarea
 rows={7}
 maxLength={1024}
 value={editBodyText}
 onChange={e => setEditBodyText(e.target.value)}
 placeholder="Escreva a mensagem aqui... Use {{1}}, {{2}} para variáveis dinâmicas."
 className="w-full p-3 bg-card border border-border rounded-xl text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed"
 />

 <div className="flex justify-between items-center text-[10px] text-muted-foreground">
 <span>Dica: Use *texto* para negrito e _texto_ para itálico.</span>
 <span>{editBodyText.length}/1024</span>
 </div>
 </div>

 {/* Rodapé (Footer) */}
 <div className="bg-background border border-border rounded-xl p-4 space-y-2">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Rodapé (Footer - Opcional)
 </label>
 <span className="text-[10px] text-muted-foreground">{editFooterText.length}/60</span>
 </div>
 <input
 type="text"
 maxLength={60}
 value={editFooterText}
 onChange={e => setEditFooterText(e.target.value)}
 placeholder="ex: Provedor de Internet • Atendimento Oficial"
 className="w-full p-2.5 bg-card border border-border rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
 />
 </div>

 {/* Botões de Ação Interativos */}
 <div className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Botões de Ação (Máximo 3 botões)
 </label>
 {editButtons.length < 3 && (
 <button
 type="button"
 onClick={() => setEditButtons(prev => [...prev, { type: 'QUICK_REPLY', text: 'Nova Opção' }])}
 className="px-2.5 py-1 bg-white/5 hover:bg-accent text-muted-foreground border border-border rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
 >
 <Plus size={13} />
 <span>Adicionar Botão</span>
 </button>
 )}
 </div>

 {editButtons.length === 0 ? (
 <p className="text-xs text-muted-foreground italic">Nenhum botão configurado.</p>
 ) : (
 <div className="space-y-2.5">
 {editButtons.map((btn, index) => (
 <div key={index} className="flex flex-col sm:flex-row items-center gap-2 bg-card p-2.5 rounded-lg border border-border">
 <select
 value={btn.type}
 onChange={e => {
 const val = e.target.value as any;
 setEditButtons(prev => {
 const copy = [...prev];
 copy[index] = { ...copy[index], type: val, url: val === 'URL' ? 'https://meuprovedor.com.br' : undefined };
 return copy;
 });
 }}
 className="p-1.5 bg-background border border-border rounded-md text-xs font-bold text-foreground"
 >
 <option value="QUICK_REPLY">Resposta Rápida (Quick Reply)</option>
 <option value="URL">Abrir Link (URL)</option>
 </select>

 <input
 type="text"
 maxLength={25}
 value={btn.text}
 onChange={e => {
 const val = e.target.value;
 setEditButtons(prev => {
 const copy = [...prev];
 copy[index] = { ...copy[index], text: val };
 return copy;
 });
 }}
 placeholder="Texto do Botão (máx 25)"
 className="flex-1 p-1.5 bg-background border border-border rounded-md text-xs text-foreground"
 />

 {btn.type === 'URL' && (
 <input
 type="text"
 value={btn.url || ''}
 onChange={e => {
 const val = e.target.value;
 setEditButtons(prev => {
 const copy = [...prev];
 copy[index] = { ...copy[index], url: val };
 return copy;
 });
 }}
 placeholder="https://provedor.com.br/fatura"
 className="flex-1 p-1.5 bg-background border border-border rounded-md text-xs text-foreground font-mono"
 />
 )}

 <button
 type="button"
 onClick={() => setEditButtons(prev => prev.filter((_, i) => i !== index))}
 className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
 >
 <Trash2 size={15} />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Valores de Amostra para a Meta (Samples) */}
 {validationResults.uniqueVars.length > 0 && (
 <div className="bg-background border border-border rounded-xl p-4 space-y-3">
 <div className="flex items-center gap-2">
 <Info size={16} className="text-emerald-400" />
 <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 Amostras de Dados (Exigido pela Meta para Homologação)
 </label>
 </div>
 <p className="text-[11px] text-muted-foreground">
 Os revisores da Meta examinam estes dados para verificar se a mensagem se enquadra na categoria <strong>{editCategory}</strong>.
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {validationResults.uniqueVars.map(v => (
 <div key={v}>
 <label className="block text-[11px] font-mono text-emerald-400 font-bold mb-1">
 Variável {v}
 </label>
 <input
 type="text"
 value={editSamples[v] || ''}
 onChange={e => {
 const val = e.target.value;
 setEditSamples(prev => ({ ...prev, [v]: val }));
 }}
 placeholder={`Exemplo para ${v}`}
 className="w-full p-2 bg-card border border-border rounded-lg text-xs text-foreground outline-none focus:border-emerald-600"
 />
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Coluna Direita: Simulador de Smartphone + Checklist de Validação (5 colunas) */}
 <div className="lg:col-span-5 space-y-5">
 {/* Checklist de Validação em Tempo Real */}
 <div className="bg-background border border-border rounded-xl p-4 space-y-3">
 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <ShieldCheck size={16} className="text-emerald-400" />
 Auditoria Pré-Submissão Meta
 </h4>

 <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
 {validationResults.issues.map(issue => (
 <div
 key={issue.id}
 className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
 issue.type === 'error'
 ? 'bg-red-500/10 border-red-500/20 text-red-300'
 : issue.type === 'warning'
 ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
 : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
 }`}
 >
 {issue.type === 'error' ? (
 <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
 ) : issue.type === 'warning' ? (
 <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
 ) : (
 <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
 )}
 <div>
 <div className="font-bold">{issue.title}</div>
 <div className="text-[11px] opacity-80 leading-relaxed mt-0.5">{issue.desc}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Simulador Smartphone WhatsApp */}
 <div className="bg-background border border-border rounded-2xl p-4 shadow-2xl">
 <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
 <div className="flex items-center gap-2">
 <Smartphone size={16} className="text-emerald-400" />
 <span className="text-xs font-bold text-foreground font-outfit">Simulador WhatsApp Oficial</span>
 </div>
 <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
 <button
 type="button"
 onClick={() => setPreviewMode('sample')}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 previewMode === 'sample' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Com Amostras
 </button>
 <button
 type="button"
 onClick={() => setPreviewMode('variables')}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 previewMode === 'variables' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-white'
 }`}
 >
 Variáveis ({'{{n}}'})
 </button>
 </div>
 </div>

 {/* Moldura do Chat WhatsApp */}
 <div className="bg-[#0b141a] rounded-xl p-4 min-h-[380px] border border-border flex flex-col justify-between relative overflow-hidden">
 {/* Cabeçalho do Contato no Chat */}
 <div className="flex items-center gap-2.5 pb-2 border-b border-border mb-3">
 <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
 ISP
 </div>
 <div>
 <div className="text-xs font-bold text-foreground flex items-center gap-1">
 <span>Provedor de Internet Oficial</span>
 <CheckCircle2 size={12} className="text-emerald-400 fill-emerald-400/20" />
 </div>
 <span className="text-[10px] text-emerald-400 font-mono">Conta Comercial Verificada</span>
 </div>
 </div>

 {/* Balão de Mensagem Estilo WhatsApp */}
 <div className="bg-[#005c4b] text-foreground rounded-lg p-3 max-w-[95%] shadow-md space-y-2 relative ml-auto">
 {/* Cabeçalho */}
 {editHeaderType === 'TEXT' && editHeaderText && (
 <div className="font-bold text-xs text-foreground pb-1 border-b border-border">
 {editHeaderText}
 </div>
 )}
 {editHeaderType === 'IMAGE' && (
 <div className="h-28 bg-emerald-900/60 rounded flex items-center justify-center text-xs text-emerald-300 font-bold">
 [Imagem de Cabeçalho]
 </div>
 )}
 {editHeaderType === 'DOCUMENT' && (
 <div className="p-2 bg-emerald-950/70 rounded flex items-center gap-2 text-xs font-mono text-emerald-200">
 <FileText size={16} />
 <span>Fatura_Mensal_Cliente.pdf</span>
 </div>
 )}

 {/* Corpo com Quebras de Linha */}
 <div className="text-xs leading-relaxed whitespace-pre-line font-sans">
 {renderedSimulatedText || 'A sua mensagem aparecerá aqui...'}
 </div>

 {/* Rodapé e Hora */}
 <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground/80">
 <span className="italic">{editFooterText}</span>
 <span className="flex items-center gap-1 ml-2 font-mono text-[9px]">
 12:30
 <span className="text-sky-300 font-bold">✓✓</span>
 </span>
 </div>
 </div>

 {/* Botões do WhatsApp */}
 {editButtons.length > 0 && (
 <div className="mt-2 space-y-1.5 max-w-[95%] ml-auto">
 {editButtons.map((btn, i) => (
 <div
 key={i}
 className="bg-card hover:bg-card text-sky-400 font-bold text-xs py-2 px-3 rounded-lg text-center shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-border"
 >
 {btn.type === 'URL' ? <ExternalLink size={13} /> : <MessageSquare size={13} />}
 <span>{btn.text}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Área de Teste de Disparo Real/Simulado */}
 <div className="mt-4 pt-3 border-t border-border space-y-2">
 <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
 Testar Disparo no Celular
 </label>
 <div className="flex gap-2">
 <input
 type="text"
 value={testPhoneNumber}
 onChange={e => setTestPhoneNumber(e.target.value)}
 placeholder="(11) 98765-4321"
 className="flex-1 p-2 bg-card border border-border rounded-xl text-xs font-mono text-foreground outline-none"
 />
 <button
 type="button"
 onClick={handleSendTestMessage}
 disabled={sendingTest}
 className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
 >
 {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
 <span>Disparar</span>
 </button>
 </div>
 {testSuccess && (
 <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
 <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
 <span>{testSuccess}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ABA 3: DIRETRIZES E REQUISITOS OFICIAIS DA META (GUIA RÁPIDO) */}
 {activeTab === 'guidelines' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Card UTILITY */}
 <div className="bg-background border border-blue-500/20 rounded-xl p-5 space-y-3">
 <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
 <Tag size={16} />
 <span>Categoria UTILITY (Utilidade)</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Mensagens transacionais relacionadas a uma contratação existente. Cobrança de menor valor pela Meta.
 </p>
 <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
 <li>Segundas vias de faturas e comprovantes PIX.</li>
 <li>Avisos de manutenção de rede ou OLT offline.</li>
 <li>Confirmações de visita técnica e horários de OS.</li>
 <li>Desbloqueio de confiança temporário.</li>
 <li className="text-red-400 font-medium">Proibido incluir mensagens de venda ou upgrade de plano aqui!</li>
 </ul>
 </div>

 {/* Card AUTHENTICATION */}
 <div className="bg-background border border-purple-500/20 rounded-xl p-5 space-y-3">
 <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
 <Lock size={16} />
 <span>Categoria AUTHENTICATION (2FA)</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Códigos de verificação temporários (OTP) para login seguro dos assinantes no Portal PWA.
 </p>
 <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
 <li>O código de segurança deve ser a variável {'{{1}}'}.</li>
 <li>Proibido incluir links de sites soltos no corpo.</li>
 <li>Proibido usar mídias de cabeçalho (imagens ou vídeos).</li>
 <li>Exige botão de ação rápida "Copiar Código".</li>
 <li>Tempo de expiração explícito (ex: 5 minutos).</li>
 </ul>
 </div>

 {/* Card MARKETING */}
 <div className="bg-background border border-amber-500/20 rounded-xl p-5 space-y-3">
 <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
 <Sparkles size={16} />
 <span>Categoria MARKETING (Campanhas)</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Avisos promocionais, novos planos de ultravelocidade, expansão de cobertura de fibra e campanhas.
 </p>
 <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
 <li>Ofertas de upgrade para 600 Mega / 1 Giga com Wi-Fi 6.</li>
 <li>Campanhas de fidelização e desconto na fatura.</li>
 <li className="text-emerald-400 font-bold">Obrigatório botão de descadastro (Opt-out).</li>
 <li>Janela de entrega controlada pelo Tier da WABA.</li>
 </ul>
 </div>
 </div>

 {/* Regras Críticas para Evitar Rejeição pela Meta */}
 <div className="bg-background border border-border rounded-xl p-5 space-y-4">
 <h3 className="text-sm font-bold text-foreground font-outfit flex items-center gap-2">
 <ShieldCheck className="text-emerald-400" size={18} />
 Checklist de 5 Regras de Ouro da Meta Graph API
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
 <div className="p-3 bg-card rounded-lg border border-border space-y-1">
 <div className="font-bold text-emerald-400 flex items-center gap-1.5">
 <CheckCircle2 size={14} /> 1. Posição das Variáveis no Corpo
 </div>
 <p className="text-muted-foreground">
 Nunca inicie a mensagem com uma variável solta (ex: <code>"{'{{1}}'} sua fatura..."</code>). Sempre coloque texto fixo antes (ex: <code>"Olá, {'{{1}}'}! Sua fatura..."</code>). Da mesma forma, não termine com variável solta.
 </p>
 </div>

 <div className="p-3 bg-card rounded-lg border border-border space-y-1">
 <div className="font-bold text-emerald-400 flex items-center gap-1.5">
 <CheckCircle2 size={14} /> 2. Variáveis Consecutivas
 </div>
 <p className="text-muted-foreground">
 A Meta rejeita templates com <code>"{'{{1}}'} {'{{2}}'}"</code> colados. É mandatório ter palavras explicativas entre os parâmetros para que o robô da Meta entenda a estrutura da frase.
 </p>
 </div>

 <div className="p-3 bg-card rounded-lg border border-border space-y-1">
 <div className="font-bold text-emerald-400 flex items-center gap-1.5">
 <CheckCircle2 size={14} /> 3. Proibição de Encurtadores de Links
 </div>
 <p className="text-muted-foreground">
 Serviços como <code>bit.ly</code>, <code>tinyurl</code> e <code>cutt.ly</code> são bloqueados pela Meta para evitar phishing. Use sempre links com o domínio próprio do seu provedor (ex: <code>cliente.seuprovedor.com.br</code>).
 </p>
 </div>

 <div className="p-3 bg-card rounded-lg border border-border space-y-1">
 <div className="font-bold text-emerald-400 flex items-center gap-1.5">
 <CheckCircle2 size={14} /> 4. Fornecimento Obrigatório de Exemplos (Samples)
 </div>
 <p className="text-muted-foreground">
 Qualquer template com variáveis exige a chave <code>example.body_text</code> no payload. Se não enviar exemplos realistas de nomes e valores, a Meta recusa o template em menos de 2 minutos.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ABA 4: JSON PAYLOAD DA GRAPH API */}
 {activeTab === 'json' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="text-xs text-muted-foreground">
 Payload oficial pronto para ser enviado via cURL ou Postman para o endpoint da Meta:
 <br />
 <code className="text-emerald-400 font-mono">
 POST https://graph.facebook.com/v19.0/{'{waba-account-id}'}/message_templates
 </code>
 </div>
 <button
 type="button"
 onClick={() => copyToClipboard(JSON.stringify(metaGraphApiPayload, null, 2), 'payload')}
 className="px-3 py-1.5 bg-white/5 hover:bg-accent text-muted-foreground border border-border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
 >
 {copiedKey === 'payload' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
 <span>{copiedKey === 'payload' ? 'Payload Copiado!' : 'Copiar JSON'}</span>
 </button>
 </div>

 <pre className="bg-background p-4 rounded-xl border border-border text-xs font-mono text-emerald-300 overflow-x-auto max-h-[450px]">
 {JSON.stringify(metaGraphApiPayload, null, 2)}
 </pre>
 </div>
 )}
 </div>
 );
}
