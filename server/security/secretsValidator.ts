import fs from 'fs';
import path from 'path';

/**
 * NAP TELECOM - Matriz de Validação de Segredos Condicionais (Correção 7)
 * Validação rigorosa por módulo com bloqueio estrito de startup em produção.
 */

export const STRICT_PLACEHOLDERS = [
  'nap_ari_secret_2026',
  'nap_ami_secret_2026',
  'nap_acs_pwd_2026',
  'nap_zabbix_live_token_sec70',
  'nap_radius_secret_2026',
  'nap_waba_verify_token_secure',
  'nap_native_sec_token_sgp',
  'nap_secure_pwd',
  'sip_pass_2001_webrtc',
  'postgresql://postgres:nap_secure_pwd@localhost:5432/nap_crm',
  'postgresql://postgres:nap_secure_pwd@db:5432/nap_crm?schema=public',
  'CHANGE_ME_IN_PRODUCTION',
  'CHANGE_ME',
  'substituir_por_chave_jwt_forte',
  'super_secret_jwt_genieacs',
  'postgres:postgres'
];

export const GENERIC_FORBIDDEN_WORDS = [
  'password',
  'admin',
  '123456',
  'test',
  'dummy',
  'secret'
];

export type SecretStatus = 'OK' | 'FALTANDO' | 'FRACO' | 'ARQUIVO_INEXISTENTE' | 'PERMISSAO_INSEGURA';

export interface SecretItemReport {
  modulo: string;
  chave: string;
  descricao: string;
  status: SecretStatus;
  detalhe?: string;
}

export interface ValidationReport {
  valid: boolean;
  modulosAtivos: string[];
  items: SecretItemReport[];
  errors: string[];
  warnings: string[];
}

interface SecretSpec {
  chave: string;
  descricao: string;
  minLen?: number;
  isFile?: boolean;
  aliases?: string[];
  insecurePatterns?: string[];
}

export function validateSecrets(options?: {
  env?: Record<string, string | undefined>;
  isProduction?: boolean;
  baseDir?: string;
}): ValidationReport {
  const env = options?.env || process.env;
  const isProduction = options?.isProduction ?? (env.NODE_ENV === 'production');
  const baseDir = options?.baseDir || process.cwd();

  const errors: string[] = [];
  const warnings: string[] = [];
  const items: SecretItemReport[] = [];
  const modulosAtivos: string[] = ['CORE (Global)'];

  // Helper para buscar valor considerando aliases
  const getVal = (spec: SecretSpec): string | undefined => {
    let v = env[spec.chave]?.trim();
    if (!v && spec.aliases) {
      for (const alias of spec.aliases) {
        v = env[alias]?.trim();
        if (v) break;
      }
    }
    return v;
  };

  // Helper para checar fraqueza/placeholder
  const isWeak = (val: string, spec: SecretSpec): boolean => {
    if (spec.minLen && val.length < spec.minLen) {
      return true;
    }
    const valLower = val.toLowerCase();
    
    // Placeholders restritos (proibidos se contiver a substring)
    const hasStrict = STRICT_PLACEHOLDERS.some(d => valLower.includes(d.toLowerCase()));
    if (hasStrict) return true;

    // Palavras genéricas proibidas como valor completo ou delimitado em URL
    const hasGeneric = GENERIC_FORBIDDEN_WORDS.some(w => {
      if (valLower === w) return true;
      if (valLower.includes(`:${w}@`) || valLower.includes(`//${w}:`)) return true;
      return false;
    });
    if (hasGeneric) return true;

    const hasCustom = (spec.insecurePatterns || []).some(p => {
      if (valLower === p.toLowerCase()) return true;
      if (p.length > 5 && valLower.includes(p.toLowerCase())) return true;
      return false;
    });
    return hasCustom;
  };

  // 1. SEGREDOS GLOBAIS (Obrigatórios em Produção)
  const GLOBAL_SPECS: SecretSpec[] = [
    {
      chave: 'DATABASE_URL',
      descricao: 'String de conexão PostgreSQL',
      insecurePatterns: ['nap_secure_pwd', 'postgres:postgres', 'CHANGE_ME']
    },
    {
      chave: 'JWT_SECRET',
      descricao: 'Assinatura criptográfica de tokens JWT e sessões',
      minLen: 32,
      aliases: ['NAP_JWT_SECRET'],
      insecurePatterns: ['secret', 'super_secret', 'nap_secret']
    },
    {
      chave: 'ALLOWED_ORIGINS',
      descricao: 'Origens autorizadas para CORS (sem wildcard)',
      insecurePatterns: ['*']
    }
  ];

  // Se expõe webhooks externamente ou explicitamente ativado
  const webhooksExpostos = env.WEBHOOKS_EXPOSED === 'true' || env.WABA_ENABLED === 'true' || env.C6_BANK_ENABLED === 'true';
  if (webhooksExpostos) {
    GLOBAL_SPECS.push({
      chave: 'WEBHOOK_SECRET',
      descricao: 'Assinatura HMAC de webhooks públicos',
      minLen: 16,
      aliases: ['WABA_WEBHOOK_SECRET', 'C6_WEBHOOK_SECRET']
    });
  }

  for (const spec of GLOBAL_SPECS) {
    const val = getVal(spec);
    if (!val) {
      items.push({
        modulo: 'CORE',
        chave: spec.chave,
        descricao: spec.descricao,
        status: 'FALTANDO',
        detalhe: 'Variável não definida no ambiente'
      });
      if (isProduction) {
        errors.push(`[CORE] Secret obrigatório ausente: '${spec.chave}' (${spec.descricao})`);
      } else {
        warnings.push(`[CORE] Secret '${spec.chave}' não configurado (modo dev/preview)`);
      }
    } else if (isWeak(val, spec)) {
      items.push({
        modulo: 'CORE',
        chave: spec.chave,
        descricao: spec.descricao,
        status: 'FRACO',
        detalhe: spec.minLen && val.length < spec.minLen
          ? `Comprimento insuficiente (${val.length} caracteres, mínimo exigido: ${spec.minLen})`
          : 'Contém valor padrão ou placeholder inseguro'
      });
      if (isProduction) {
        errors.push(`[CORE] Secret inseguro/fraco em produção: '${spec.chave}' (${items[items.length - 1].detalhe})`);
      } else {
        warnings.push(`[CORE] Secret '${spec.chave}' utiliza valor fraco em desenvolvimento`);
      }
    } else {
      items.push({
        modulo: 'CORE',
        chave: spec.chave,
        descricao: spec.descricao,
        status: 'OK'
      });
    }
  }

  // 2. SEGREDOS CONDICIONAIS POR MÓDULO

  // MÓDULO ASTERISK
  const asteriskEnabled = env.ASTERISK_ENABLED === 'true' || env.VOIP_ENABLED === 'true';
  if (asteriskEnabled) {
    modulosAtivos.push('Asterisk 20+ NBI');
    const asteriskSpecs: SecretSpec[] = [
      { chave: 'ASTERISK_SECRET_ARI', descricao: 'Senha Asterisk REST Interface (ARI)', minLen: 12 },
      { chave: 'ASTERISK_SECRET_AMI', descricao: 'Senha Asterisk Manager Interface (AMI)', minLen: 12 },
      { chave: 'ASTERISK_RAMAL_SECRET', descricao: 'Senha do Ramal WebRTC/PJSIP', minLen: 12 },
      { chave: 'ASTERISK_HOST', descricao: 'Endereço do Asterisk (127.0.0.1)' }
    ];

    for (const spec of asteriskSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'ASTERISK', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[ASTERISK] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'ASTERISK', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[ASTERISK] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'ASTERISK', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO WABA (WhatsApp Cloud API)
  const wabaEnabled = env.WABA_ENABLED === 'true' || env.WHATSAPP_ENABLED === 'true';
  if (wabaEnabled) {
    modulosAtivos.push('WhatsApp Cloud API (WABA)');
    const wabaSpecs: SecretSpec[] = [
      { chave: 'WABA_ACCESS_TOKEN', descricao: 'Token de acesso à API do WhatsApp Cloud (Meta)', minLen: 20 },
      { chave: 'WABA_PHONE_NUMBER_ID', descricao: 'ID do número de telefone WhatsApp Meta' },
      { chave: 'WABA_BUSINESS_ACCOUNT_ID', descricao: 'ID da conta Business Meta' },
      { chave: 'WABA_WEBHOOK_VERIFY_TOKEN', descricao: 'Token de verificação do Webhook WABA', aliases: ['WABA_VERIFY_TOKEN'], minLen: 16 }
    ];

    for (const spec of wabaSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'WABA', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[WABA] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'WABA', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[WABA] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'WABA', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO GENIEACS (TR-069)
  const genieacsEnabled = env.GENIEACS_ENABLED === 'true' || env.TR069_ENABLED === 'true';
  if (genieacsEnabled) {
    modulosAtivos.push('GenieACS TR-069');
    const acsSpecs: SecretSpec[] = [
      { chave: 'GENIEACS_URL', descricao: 'URL da API NBI do GenieACS' },
      { chave: 'GENIEACS_AUTH', descricao: 'Credenciais de autenticação NBI GenieACS', aliases: ['GENIEACS_PASSWORD'] }
    ];

    for (const spec of acsSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'GENIEACS', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[GENIEACS] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'GENIEACS', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[GENIEACS] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'GENIEACS', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO ZABBIX (NOC & Telemetria)
  const zabbixEnabled = env.ZABBIX_ENABLED === 'true';
  if (zabbixEnabled) {
    modulosAtivos.push('Zabbix 7.0 LTS');
    const zabbixSpecs: SecretSpec[] = [
      { chave: 'ZABBIX_API_URL', descricao: 'URL da API JSON-RPC do Zabbix', aliases: ['ZABBIX_URL'] },
      { chave: 'ZABBIX_API_TOKEN', descricao: 'Token de API do Zabbix 7.0', aliases: ['ZABBIX_TOKEN'], minLen: 16 }
    ];

    for (const spec of zabbixSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'ZABBIX', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[ZABBIX] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'ZABBIX', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[ZABBIX] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'ZABBIX', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO ERP (SGP / IXC / HubSoft / MikWeb)
  const erpEnabled = env.ERP_INTEGRATION_ENABLED === 'true' || env.ERP_ENABLED === 'true' || (env.ERP_URL && env.ERP_URL.length > 0);
  if (erpEnabled) {
    modulosAtivos.push('ERP Integration');
    const erpSpecs: SecretSpec[] = [
      { chave: 'ERP_URL', descricao: 'URL do Webservice do ERP' },
      { chave: 'ERP_TOKEN', descricao: 'Token de autenticação do ERP', minLen: 12 }
    ];

    for (const spec of erpSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'ERP', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[ERP] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'ERP', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[ERP] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'ERP', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO C6 BANK (Pix Cobrança mTLS 336)
  const c6Enabled = env.C6_BANK_ENABLED === 'true' || env.PIX_C6_ENABLED === 'true';
  if (c6Enabled) {
    modulosAtivos.push('C6 Bank (Pix mTLS)');
    const c6Specs: SecretSpec[] = [
      { chave: 'C6_CLIENT_ID', descricao: 'Client ID OAuth C6 Bank Empresas' },
      { chave: 'C6_CLIENT_SECRET', descricao: 'Client Secret OAuth C6 Bank Empresas', minLen: 16 },
      { chave: 'C6_CERT_PATH', descricao: 'Caminho do Certificado mTLS (.crt)', isFile: true },
      { chave: 'C6_KEY_PATH', descricao: 'Caminho da Chave Privada mTLS (.key)', isFile: true }
    ];

    for (const spec of c6Specs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'C6_BANK', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[C6_BANK] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (spec.isFile) {
        // Validação física de arquivo de certificado/chave mTLS
        const fullPath = path.isAbsolute(val) ? val : path.join(baseDir, val);
        if (!fs.existsSync(fullPath)) {
          items.push({
            modulo: 'C6_BANK',
            chave: spec.chave,
            descricao: spec.descricao,
            status: 'ARQUIVO_INEXISTENTE',
            detalhe: `Arquivo não localizado no disco: ${fullPath}`
          });
          if (isProduction) errors.push(`[C6_BANK] Arquivo de certificado '${spec.chave}' não existe no disco: ${fullPath}`);
        } else {
          try {
            const stats = fs.statSync(fullPath);
            // Em sistemas POSIX (Linux/Debian 12), checar permissões estritas (0600 ou 0400)
            if (process.platform !== 'win32' && (stats.mode & 0o077) !== 0) {
              items.push({
                modulo: 'C6_BANK',
                chave: spec.chave,
                descricao: spec.descricao,
                status: 'PERMISSAO_INSEGURA',
                detalhe: `Permissão insegura (${(stats.mode & 0o777).toString(8)}). Deve ser 0600 ou 0400.`
              });
              if (isProduction) errors.push(`[C6_BANK] Arquivo '${spec.chave}' possui permissões abertas demais.`);
            } else {
              items.push({ modulo: 'C6_BANK', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
            }
          } catch {
            items.push({ modulo: 'C6_BANK', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
          }
        }
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'C6_BANK', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[C6_BANK] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'C6_BANK', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  // MÓDULO GEMINI / IA MAIA
  const geminiEnabled = env.GEMINI_ENABLED === 'true' || env.MAIA_AI_ENABLED === 'true' || Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0);
  if (geminiEnabled) {
    modulosAtivos.push('MaIA IA (Google Gemini)');
    const geminiSpecs: SecretSpec[] = [
      { chave: 'GEMINI_API_KEY', descricao: 'Chave de API do Google Gemini SDK', minLen: 20 }
    ];

    for (const spec of geminiSpecs) {
      const val = getVal(spec);
      if (!val) {
        items.push({ modulo: 'GEMINI_AI', chave: spec.chave, descricao: spec.descricao, status: 'FALTANDO' });
        if (isProduction) errors.push(`[GEMINI_AI] Módulo ativo mas '${spec.chave}' está ausente.`);
      } else if (isWeak(val, spec)) {
        items.push({ modulo: 'GEMINI_AI', chave: spec.chave, descricao: spec.descricao, status: 'FRACO' });
        if (isProduction) errors.push(`[GEMINI_AI] Secret fraco/inseguro em '${spec.chave}'.`);
      } else {
        items.push({ modulo: 'GEMINI_AI', chave: spec.chave, descricao: spec.descricao, status: 'OK' });
      }
    }
  }

  const valid = errors.length === 0;

  // Imprime relatório estruturado e legível
  console.log('================================================================================');
  console.log('       NAP TELECOM - MATRIZ DE SEGREDOS E CONFORMIDADE DE PRODUÇÃO              ');
  console.log('================================================================================');
  console.log(`Ambiente: ${isProduction ? 'PRODUÇÃO (NODE_ENV=production)' : 'DESENVOLVIMENTO / TESTE'}`);
  console.log(`Módulos Habilitados: ${modulosAtivos.join(' | ')}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'MÓDULO'.padEnd(14) +
    'CHAVE'.padEnd(28) +
    'STATUS'.padEnd(16) +
    'DETALHES'
  );
  console.log('--------------------------------------------------------------------------------');
  for (const it of items) {
    const statusText = `[${it.status}]`.padEnd(16);
    console.log(
      it.modulo.padEnd(14) +
      it.chave.padEnd(28) +
      statusText +
      (it.detalhe || it.descricao)
    );
  }
  console.log('================================================================================');

  if (!valid && isProduction) {
    console.error('[FALHA CRÍTICA DE SEGURANÇA] Startup bloqueado devido a falhas de segredos:');
    errors.forEach(e => console.error(` ❌ ${e}`));
    console.error('Configure as variáveis corretas no .env antes de iniciar o servidor.');
    console.error('================================================================================');
    throw new Error(`[FALHA DE STARTUP] Segredos inválidos em produção: ${errors.join('; ')}`);
  }

  return { valid, modulosAtivos, items, errors, warnings };
}
