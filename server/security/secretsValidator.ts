/**
 * NAP - Validador de Secrets e Segurança de Inicialização
 * Bloqueia o startup em produção se secrets obrigatórios estiverem ausentes ou forem padrões inseguros.
 */

interface SecretConfig {
  key: string;
  description: string;
  insecureDefaults: string[];
  requiredInProduction: boolean;
}

const SECRETS_REGISTRY: SecretConfig[] = [
  {
    key: 'DATABASE_URL',
    description: 'String de conexão PostgreSQL',
    insecureDefaults: [
      'postgresql://postgres:nap_secure_pwd@localhost:5432/nap_crm',
      'postgresql://postgres:nap_secure_pwd@db:5432/nap_crm?schema=public'
    ],
    requiredInProduction: true
  },
  {
    key: 'NAP_JWT_SECRET',
    description: 'Chave de assinatura de tokens JWT e sessões de usuários',
    insecureDefaults: ['super_secret_jwt_genieacs', 'secret', 'nap_secret_123'],
    requiredInProduction: true
  },
  {
    key: 'ASTERISK_SECRET_ARI',
    description: 'Senha de autenticação Asterisk ARI',
    insecureDefaults: ['nap_ari_secret_2026', 'ari_secret', 'password'],
    requiredInProduction: false
  },
  {
    key: 'ASTERISK_SECRET_AMI',
    description: 'Senha de autenticação Asterisk AMI',
    insecureDefaults: ['nap_ami_secret_2026', 'ami_secret', 'password'],
    requiredInProduction: false
  },
  {
    key: 'GENIEACS_PASSWORD',
    description: 'Senha de administração da API do GenieACS TR-069',
    insecureDefaults: ['nap_acs_pwd_2026', 'admin', 'password'],
    requiredInProduction: false
  },
  {
    key: 'ZABBIX_TOKEN',
    description: 'Token de API JSON-RPC do Zabbix 7.0 LTS',
    insecureDefaults: ['nap_zabbix_live_token_sec70', 'zabbix_token', '123456'],
    requiredInProduction: false
  },
  {
    key: 'RADIUS_SECRET',
    description: 'Secret compartilhado do Radius PoD/CoA',
    insecureDefaults: ['nap_radius_secret_2026', 'radius_secret', 'testing123'],
    requiredInProduction: false
  },
  {
    key: 'WABA_ACCESS_TOKEN',
    description: 'Token de acesso à API do WhatsApp Cloud (Meta)',
    insecureDefaults: ['EAAGm0PXq1...9823h4', 'mock_token', 'waba_test_token'],
    requiredInProduction: false
  },
  {
    key: 'WABA_VERIFY_TOKEN',
    description: 'Token de verificação do Webhook da Meta',
    insecureDefaults: ['nap_waba_verify_token_secure', 'nap_token_secreto_123', 'verify_token'],
    requiredInProduction: false
  }
];

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSecrets(): ValidationReport {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const secret of SECRETS_REGISTRY) {
    const val = process.env[secret.key]?.trim();

    if (!val) {
      if (secret.requiredInProduction && isProduction) {
        errors.push(`Secret obrigatório ausente: '${secret.key}' (${secret.description})`);
      } else {
        warnings.push(`Secret não definido: '${secret.key}'. Usando modo isolado/fallback.`);
      }
      continue;
    }

    if (secret.insecureDefaults.includes(val)) {
      if (isProduction) {
        errors.push(`Secret inseguro detectado em PRODUÇÃO: '${secret.key}' está utilizando senha padrão conhecida.`);
      } else {
        warnings.push(`[AVISO SEGURANÇA] '${secret.key}' utiliza valor de desenvolvimento padrão.`);
      }
    }
  }

  const valid = errors.length === 0;

  if (!valid && isProduction) {
    console.error('================================================================================');
    console.error('[ERRO CRÍTICO DE SEGURANÇA] Inicialização abortada devido a falhas de segredos:');
    errors.forEach(e => console.error(` - ${e}`));
    console.error('Configure variáveis seguras no .env ou Docker Secrets antes de iniciar.');
    console.error('================================================================================');
    throw new Error('Falha de conformidade de segredos em ambiente de produção.');
  }

  return { valid, errors, warnings };
}
