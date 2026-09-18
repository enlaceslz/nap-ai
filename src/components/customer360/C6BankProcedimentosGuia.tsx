import React, { useState } from 'react';
import { 
  Building2, Shield, Key, Download, CheckCircle2, Copy, Check, 
  ExternalLink, ArrowRight, Lock, Laptop, FileText, AlertCircle,
  HelpCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

interface Props {
  onClose?: () => void;
  onUseWebhookUrl?: (url: string) => void;
}

export default function C6BankProcedimentosGuia({ onClose, onUseWebhookUrl }: Props) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const steps = [
    {
      step: 1,
      title: "Acessar o Portal C6 Empresas (Web Banking)",
      tag: "Login C6 PJ",
      description: "Acesse o Internet Banking do C6 Bank exclusivo para pessoas jurídicas.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            1. Acesse o portal oficial de internet banking corporativo do C6 Bank:
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="font-mono text-amber-400 font-semibold text-xs">
              https://empresas.c6bank.com.br
            </span>
            <a
              href="https://empresas.c6bank.com.br"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
            >
              Abrir C6 Empresas <ExternalLink size={12} />
            </a>
          </div>
          <p>
            2. Realize o login utilizando o <strong>CNPJ da sua empresa (Provedor)</strong>, CPF do titular ou operador master e a senha de acesso. Confirme a autenticação de 2 fatores (Token/App no celular).
          </p>
        </div>
      )
    },
    {
      step: 2,
      title: "Navegar até a Área de Open Banking / API Pix",
      tag: "Menu de Integrações",
      description: "Localize o menu de credenciais de desenvolvedor e certificados de API.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>No menu lateral esquerdo do C6 Empresas, siga o caminho exato:</p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] text-foreground">
              <span className="text-amber-400 font-bold">C6 Empresas</span>
              <span>&gt;</span>
              <span className="text-slate-300">Configurações da Conta</span>
              <span>&gt;</span>
              <span className="text-slate-300">C6 Connect / Integrações Pix</span>
              <span>&gt;</span>
              <span className="text-emerald-400 font-bold">Gerenciador de APIs (mTLS)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              * Caso sua conta PJ ainda não tenha o módulo "C6 Connect" ou "API Pix" visível, solicite a liberação imediata junto ao seu Gerente de Conta C6 Empresas ou via chat PJ informando: <em>"Desejo habilitar o Pix Cobrança API via mTLS para emissão de TXID automatizada e Webhook"</em>.
            </p>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: "Gerar & Baixar o Certificado Digital mTLS (.crt / .pem)",
      tag: "Segurança Bancária",
      description: "Download da chave de segurança obrigatória pelo Banco Central para autenticação mTLS.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            O Banco Central e o C6 Bank exigem uma conexão mTLS (Mutual Transport Layer Security) para impedir fraudes financeiras.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <Shield size={14} className="text-blue-400" />
              Opção A: Certificado Fornecido pelo C6 Bank (Padrão Recomendado)
            </div>
            <p className="text-[11px] text-muted-foreground">
              Clique em <strong>"Novo Certificado de Aplicação"</strong> &gt; Selecione o escopo <strong>"Pix Cobrança & Webhooks"</strong> &gt; Clique em <strong>"Gerar e Fazer Download (.crt / .pem)"</strong>. Guarde o arquivo com segurança.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <Lock size={14} className="text-amber-400" />
              Opção B: Upload de CSR (Chave Própria e-CNPJ ICP-Brasil)
            </div>
            <p className="text-[11px] text-muted-foreground">
              Se sua política interna exigir uso de e-CNPJ da empresa, gere o CSR no servidor e clique em "Vincular CSR ICP-Brasil". O C6 homologará a chave pública.
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px] bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={14} className="shrink-0" />
            No NAP, basta você clicar no botão "Carregar Novo Certificado (.crt / .pem)" e selecionar o arquivo baixado.
          </div>
        </div>
      )
    },
    {
      step: 4,
      title: "Copiar o Client ID e Gerar o Client Secret",
      tag: "OAuth 2.0 Credentials",
      description: "Obtenha as credenciais de autenticação da aplicação C6.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>Na mesma tela do C6 Connect:</p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
            <li>
              <strong>Client ID:</strong> Código alfanumérico público da sua aplicação (ex: <code className="text-amber-400">c6_client_live_89172401</code>). Copie e cole no campo "Client ID".
            </li>
            <li>
              <strong>Client Secret:</strong> Clique no botão <strong>"Gerar Novo Secret"</strong>. Atenção: o C6 exibirá esta chave apenas uma única vez na tela. Copie imediatamente e cole no campo "Client Secret" no NAP.
            </li>
          </ul>
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px]">
            ⚠️ O NAP armazena o Client Secret de maneira criptografada na instância isolada do provedor, nunca trafegando em texto plano para o frontend.
          </div>
        </div>
      )
    },
    {
      step: 5,
      title: "Cadastrar a URL de Webhook no Portal C6",
      tag: "Notificação Instantânea",
      description: "Informe a URL do NAP no C6 para que os pagamentos Pix sejam baixados na hora.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            No portal C6, acesse a aba <strong>"Webhooks / Notificações"</strong> dentro da aplicação Pix criada e preencha:
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">URL do Endpoint Webhook:</span>
              <button
                type="button"
                onClick={() => handleCopy(`${window.location.origin}/api/payments/webhook`, 'webhook_guide')}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {copiedText === 'webhook_guide' ? <Check size={12} /> : <Copy size={12} />}
                {copiedText === 'webhook_guide' ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/api/payments/webhook`}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Eventos selecionados: Marque <strong className="text-foreground">"PIX_RECEIVED" (Pagamento Pix Recebido)</strong> e <strong className="text-foreground">"PIX_DEVOLUTION"</strong>.
            </p>
          </div>
        </div>
      )
    },
    {
      step: 6,
      title: "Testar o Handshake no NAP & Simular Baixa",
      tag: "Validação",
      description: "Verifique a comunicação em tempo real antes de abrir para os assinantes.",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>Com os dados preenchidos no formulário do NAP:</p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-300">
            <li>Clique no botão <strong>"Salvar &amp; Conectar ao C6 Bank"</strong>.</li>
            <li>Clique em <strong>"Testar Conexão mTLS"</strong> para validar o handshake com o servidor seguro do C6.</li>
            <li>Utilize o botão <strong>"Simular Disparo Webhook Pix"</strong> para testar a recepção do evento e a baixa instantânea no ERP.</li>
          </ol>
        </div>
      )
    }
  ];

  const faqs = [
    {
      q: "Qual chave Pix devo cadastrar?",
      a: "Recomenda-se cadastrar a Chave Pix do tipo CNPJ vinculada à conta corrente C6 Empresas do provedor. Também são suportadas chaves de E-mail, EVP (Aleatória) ou Telefone, desde que vinculadas à mesma titularidade da conta."
    },
    {
      q: "O C6 Bank cobra taxa por Pix recebido via API?",
      a: "O C6 Empresas possui um dos custos operacionais mais competitivos para ISPs do Brasil, frequentemente com pacotes com isenção ou taxas reduzidas (geralmente entre R$ 0,30 e R$ 0,80 por Pix liquidado, muito inferior aos R$ 1,50 a R$ 2,50 de gateways intermediários)."
    },
    {
      q: "O que acontece se o cliente pagar com valor divergente?",
      a: "O motor Enlace-Pay do NAP audita o valor recebido no payload do C6 com o saldo do título no ERP. Se houver divergência (ex: pagamento a menor ou acréscimo de juros manuais), a fatura é enviada para a aba 'Reconciliação & Baixa' para aprovação supervisionada do operador."
    },
    {
      q: "O certificado mTLS expira?",
      a: "Sim, certificados digitais bancários têm validade padrão de 1 a 3 anos. O painel do C6 Bank no NAP exibe a data de expiração e emite alertas na matriz de homologação quando faltarem 30 dias para o vencimento."
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-outfit text-foreground">
                Guia Visual: Como Obter Credenciais e Certificados no C6 Bank (336)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Passo a Passo
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instruções detalhadas para localizar os certificados mTLS e chaves de API no Internet Banking C6 Empresas PJ.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            Voltar à Configuração
          </button>
        )}
      </div>

      {/* Navegador dos Passos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {steps.map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeStep === s.step
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-950/60 border-slate-800/80 text-muted-foreground hover:text-foreground hover:bg-slate-800/50'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Passo {s.step}
            </div>
            <div className="text-xs font-semibold truncate mt-0.5">
              {s.tag}
            </div>
          </button>
        ))}
      </div>

      {/* Conteúdo do Passo Ativo */}
      {steps.filter(s => s.step === activeStep).map((s) => (
        <div key={s.step} className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                {s.step}
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeStep > 1 && (
                <button
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                >
                  Anterior
                </button>
              )}
              {activeStep < steps.length && (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
                >
                  Próximo <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            {s.content}
          </div>
        </div>
      ))}

      {/* Perguntas Frequentes (FAQ) C6 Empresas */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <HelpCircle size={14} className="text-amber-400" />
          Dúvidas Frequentes &amp; Requisitos Bancários C6
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-4 text-xs font-semibold text-foreground hover:bg-slate-800/30 transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={14} className="text-amber-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
              {openFaq === idx && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/30">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
