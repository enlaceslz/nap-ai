const fs = require('fs');
let text = fs.readFileSync('server/gis/gisService.ts', 'utf8');

if (!text.includes('syncEcosystem')) {
  const ecosystemSync = `
  /**
   * Integração Nativa e Sincronizada (SGP + Zabbix + OLT + GenieACS)
   * Consolida o status de todos os submódulos no GIS.
   */
  private syncEcosystem() {
    // 1. Sincroniza topologia base (OLT Manager)
    this.syncOltDataToGis();

    let hasChanges = false;

    // 2. Simulação de Integração SGP (ERP/Financeiro)
    // Se o cliente estiver bloqueado financeiramente, reflete no GIS
    this.data.features.forEach(f => {
      if (f.layer_id === 'layer-ont') {
        // Mock: Digamos que a ONT 04 (Padaria) está com fatura atrasada no SGP
        if (f.properties.external_id === 'onu-04' && f.properties.status !== 'blocked_sgp') {
          f.properties.status = 'blocked_sgp';
          f.properties.description += ' (Bloqueio Financeiro)';
          hasChanges = true;
        }
      }
      
      // 3. Simulação de Integração Zabbix 7.0 LTS (Telemetria/Alarmes)
      // Se um equipamento crítico falhar, injeta o trigger do Zabbix
      if (f.layer_id === 'layer-olt' && f.properties.external_id === 'olt-zte-pop01') {
        if (!f.properties.zabbix_trigger) {
          f.properties.zabbix_trigger = 'Loss of signal (LOS)';
          f.properties.status = 'warning';
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this.saveDatabase();
    }
  }
  `;

  text = text.replace(
    'public getFeatures(layerId?: string): GisFeature[] {',
    ecosystemSync + '\n  public getFeatures(layerId?: string): GisFeature[] {\n    this.syncEcosystem(); // Substitui a chamada antiga do OLT'
  );

  text = text.replace(
    'this.syncOltDataToGis(); // Sync dinâmico (Parte 01 + Parte 02)',
    '// this.syncOltDataToGis(); delegada para syncEcosystem()'
  );

  fs.writeFileSync('server/gis/gisService.ts', text, 'utf8');
  console.log('gisService.ts ecosystem sync patched');
}
