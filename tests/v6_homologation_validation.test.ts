import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeZabbixApiUrl } from '../server/zabbix/zabbixService';
import { sanitizeConfig } from '../server/gemini_routes';
import fs from 'fs';
import path from 'path';

describe('NAP-AI V6 — Validação Técnica de Bloqueadores para Homologação', () => {

  describe('1. Zabbix — Contrato da URL JSON-RPC (Ponto 7)', () => {
    it('deve adicionar /api_jsonrpc.php quando a URL informada for apenas a base', () => {
      const url = normalizeZabbixApiUrl('http://127.0.0.1:8080/zabbix');
      assert.equal(url, 'http://127.0.0.1:8080/zabbix/api_jsonrpc.php');
    });

    it('deve remover barras extras no final antes de acrescentar /api_jsonrpc.php', () => {
      const url = normalizeZabbixApiUrl('http://127.0.0.1:8080/zabbix///');
      assert.equal(url, 'http://127.0.0.1:8080/zabbix/api_jsonrpc.php');
    });

    it('NÃO deve duplicar /api_jsonrpc.php se a URL completa já for fornecida', () => {
      const url = normalizeZabbixApiUrl('http://127.0.0.1:8080/zabbix/api_jsonrpc.php');
      assert.equal(url, 'http://127.0.0.1:8080/zabbix/api_jsonrpc.php');
    });

    it('deve lidar corretamente com URLs sem caminho de subpasta', () => {
      const url = normalizeZabbixApiUrl('http://zabbix.isp.com.br');
      assert.equal(url, 'http://zabbix.isp.com.br/api_jsonrpc.php');
    });

    it('deve retornar string vazia para URL vazia ou nula', () => {
      assert.equal(normalizeZabbixApiUrl(''), '');
      assert.equal(normalizeZabbixApiUrl(undefined), '');
    });
  });

  describe('2. Asterisk — Não fabricação de Unique ID e Ciclo de Vida (Pontos 4 e 5)', () => {
    it('código fonte de asterisk.ts não deve conter gerador artificial ast_${Date.now()}', () => {
      const asteriskCode = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.equal(
        asteriskCode.includes('ast_${Date.now()}'),
        false,
        'Não deve conter gerador artificial ast_${Date.now()}'
      );
      assert.equal(
        asteriskCode.includes('ast_${Date.now()}_${cleanPhone}'),
        false,
        'Não deve conter gerador artificial ast_${Date.now()}_${cleanPhone}'
      );
    });

    it('asterisk.ts deve invocar activeChannel.hangup() durante timeout para liberar o canal', () => {
      const asteriskCode = fs.readFileSync(path.join(process.cwd(), 'server/asterisk.ts'), 'utf8');
      assert.equal(
        asteriskCode.includes('activeChannel.hangup'),
        true,
        'O timeout deve solicitar hangup ao canal real no Asterisk'
      );
    });
  });

  describe('3. Zabbix — Host Real sem Fallbacks Artificiais (Ponto 8)', () => {
    it('zabbixService.ts deve solicitar selectHosts na API problem.get', () => {
      const zabbixCode = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.equal(
        zabbixCode.includes("selectHosts: ['hostid', 'name', 'host']"),
        true,
        'problem.get deve solicitar explicitamente selectHosts'
      );
    });

    it('zabbixService.ts não deve usar "Zabbix Gateway" como fallback artificial de host_name', () => {
      const zabbixCode = fs.readFileSync(path.join(process.cwd(), 'server/zabbix/zabbixService.ts'), 'utf8');
      assert.equal(
        zabbixCode.includes("'Zabbix Gateway'"),
        false,
        'Não deve conter fallback artificial "Zabbix Gateway"'
      );
    });
  });

  describe('4. NOC Incidentes — Persistência PostgreSQL e Seleção Geográfica Estrita (Pontos 9 e 10)', () => {
    it('schema.ts e migrations devem possuir a tabela incidentes_rede', () => {
      const schemaCode = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.ts'), 'utf8');
      assert.equal(schemaCode.includes("pgTable('incidentes_rede'"), true, 'Tabela incidentes_rede deve existir no schema');

      const migration0006 = fs.readFileSync(path.join(process.cwd(), 'drizzle/0006_fluffy_iron_monger.sql'), 'utf8');
      assert.equal(migration0006.includes('CREATE TABLE IF NOT EXISTS "incidentes_rede"'), true);
      assert.equal(migration0006.includes('CREATE INDEX IF NOT EXISTS "idx_incidentes_rede_status"'), true);
    });

    it('incidentesRoutes.ts deve validar regiões afetadas e rejeitar com insufficient_data se genéricas ou sem clientes', () => {
      const routesCode = fs.readFileSync(path.join(process.cwd(), 'server/noc/incidentesRoutes.ts'), 'utf8');
      assert.equal(routesCode.includes('insufficient_data'), true, 'Deve retornar insufficient_data se regiões forem insuficientes');
      assert.equal(routesCode.includes('LOWER(${clientes.bairro}) LIKE'), true, 'Deve filtrar clientes reais por bairro');
      assert.equal(routesCode.includes('LOWER(${clientes.cidade}) LIKE'), true, 'Deve filtrar clientes reais por cidade');
    });
  });

  describe('5. System Config — Proteção Contra Vazamento de Segredos (Ponto 14)', () => {
    it('sanitizeConfig deve mascarar chaves de API, senhas e tokens', () => {
      const sensitiveConfig = {
        empresa: 'Provedor XPTO',
        ia: {
          modeloPrimario: 'gemini-2.5-flash',
          apiKey: 'AIzaSyA_SUPER_SECRET_KEY_12345',
          temperatura: 0.2
        },
        erps: {
          ixc: {
            urlBase: 'https://ixc.provedor.com.br',
            token: 'TOKEN_SUPER_SECRETO_IXC_98765'
          }
        },
        seguranca: {
          dbPassword: 'PostgresSecretPassword123'
        }
      };

      const sanitized = sanitizeConfig(sensitiveConfig);

      assert.equal(sanitized.empresa, 'Provedor XPTO');
      assert.equal(sanitized.ia.modeloPrimario, 'gemini-2.5-flash');
      assert.equal(sanitized.ia.apiKey, '********');
      assert.equal(sanitized.ia.apiKeyConfigurada, true);
      assert.equal(sanitized.erps.ixc.token, '********');
      assert.equal(sanitized.erps.ixc.tokenConfigurada, true);
      assert.equal(sanitized.seguranca.dbPassword, '********');
      assert.equal(sanitized.seguranca.dbPasswordConfigurada, true);
    });
  });

  describe('6. Eliminação de Dados Fictícios de Produção (Ponto 12)', () => {
    it('não deve conter fallback para telefone fictício 5511987654321 no Portal de Suporte', () => {
      const code = fs.readFileSync(path.join(process.cwd(), 'src/pages/PortalSuporte.tsx'), 'utf8');
      assert.equal(code.includes('5511987654321'), false, 'PortalSuporte não deve conter telefone fictício');
    });

    it('não deve conter fallback para telefone fictício 11987654321 nas landing pages', () => {
      const t1 = fs.readFileSync(path.join(process.cwd(), 'src/pages/landing/Template1.tsx'), 'utf8');
      const t2 = fs.readFileSync(path.join(process.cwd(), 'src/pages/landing/Template2.tsx'), 'utf8');
      const t3 = fs.readFileSync(path.join(process.cwd(), 'src/pages/landing/Template3.tsx'), 'utf8');
      assert.equal(t1.includes('"11987654321"'), false);
      assert.equal(t2.includes('"11987654321"'), false);
      assert.equal(t3.includes('"11987654321"'), false);
    });
  });

});
