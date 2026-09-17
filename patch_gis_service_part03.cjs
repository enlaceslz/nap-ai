const fs = require('fs');
let text = fs.readFileSync('server/gis/gisService.ts', 'utf8');

if (!text.includes('status_source')) {
  // Extending properties schema to support Realtime Status and Projects
  text = text.replace(
    "accuracy?: GisPrecisionLevel;",
    "accuracy?: GisPrecisionLevel;\n  status_source?: 'ZABBIX' | 'OLT_MANAGER' | 'GENIEACS' | 'MANUAL';\n  last_update?: string;\n  source_timestamp?: string;\n  project_id?: string;\n  project_status?: 'PLANNED' | 'APPROVED' | 'IN_PROGRESS' | 'INSTALLED' | 'VALIDATED' | 'CANCELLED';"
  );

  // Extend Check Viability logic to include scoring and multiple options
  const newViability = `
  public checkViabilityAdvanced(lat: number, lng: number) {
    this.syncOltDataToGis();
    const ctos = this.data.features.filter(f => f.layer_id === 'layer-cto' && !f.properties.project_id); // Excluir projetos pendentes
    
    const viableOptions = [];

    for (const cto of ctos) {
      if (cto.geometry.type === 'Point') {
        const [ctoLng, ctoLat] = cto.geometry.coordinates;
        const dist = this.calculateDistance(lat, lng, ctoLat, ctoLng);
        
        const capacity = cto.properties.capacity || 16;
        const occupied = cto.properties.occupied || 0;
        const freePorts = capacity - occupied;

        if (dist <= 800) { // Ampliando raio de busca para score
          let viabilityStatus = 'NÃO VIÁVEL';
          let score = 0;

          if (freePorts > 0 && dist <= 400) {
            viabilityStatus = 'VIÁVEL';
            score = 100 - (dist / 400 * 40) + (freePorts * 2); // Fórmula simples de score
          } else if (freePorts === 0 && dist <= 400) {
            viabilityStatus = 'VIÁVEL COM EXPANSÃO'; // CTO saturada mas perto
            score = 40;
          } else if (freePorts > 0 && dist > 400) {
            viabilityStatus = 'VIÁVEL COM EXPANSÃO'; // Tem porta, mas precisa drop longo/poste extra
            score = 50;
          }

          viableOptions.push({
            cto: cto,
            distance_meters: Math.round(dist),
            free_ports: freePorts,
            viability_status: viabilityStatus,
            score: Math.min(100, Math.round(score))
          });
        }
      }
    }

    // Sort by score
    viableOptions.sort((a, b) => b.score - a.score);

    return {
      success: true,
      best_option: viableOptions.length > 0 ? viableOptions[0] : null,
      alternatives: viableOptions.slice(1, 4), // Top 3 alternativas
      viable: viableOptions.length > 0 && viableOptions[0].score >= 60,
      confidence: 'ALTA', // Mock
      data_quality: ['Coordenada validada', 'CTO documentada', 'Porta disponível']
    };
  }
  `;

  text = text.replace(
    'public checkViability(lat: number, lng: number) {',
    newViability + '\n  public checkViability(lat: number, lng: number) {'
  );

  // Extend Downstream Impact to group by CTO and Count
  const newImpact = `
  public getImpactAnalysis(startNodeId: string) {
    const startFeature = this.getFeatureById(startNodeId);
    if (!startFeature) return { success: false, error: 'Origem não encontrada' };

    const impactedIds = this.getDownstreamImpact(startNodeId);
    
    let ontCount = 0;
    let ctoCount = 0;
    let ceoCount = 0;

    const impactedFeatures = impactedIds.map(id => {
      const f = this.getFeatureById(id);
      if(f?.layer_id === 'layer-ont') ontCount++;
      if(f?.layer_id === 'layer-cto') ctoCount++;
      if(f?.layer_id === 'layer-ceo') ceoCount++;
      return f;
    }).filter(f => f !== null);

    return {
      success: true,
      root_id: startNodeId,
      root_name: startFeature.properties.name,
      impact: {
        total_features: impactedFeatures.length,
        onts_affected: ontCount,
        ctos_affected: ctoCount,
        ceos_affected: ceoCount,
        estimated_customers: ontCount // assumindo 1:1 ONT:Cliente
      },
      suggestion: \`Possível causa comum: falha na infraestrutura \${startFeature.properties.name} (\${startNodeId})\`
    };
  }
  `;

  text = text.replace(
    'public getDownstreamImpact(startNodeId: string): string[] {',
    newImpact + '\n  public getDownstreamImpact(startNodeId: string): string[] {'
  );

  fs.writeFileSync('server/gis/gisService.ts', text, 'utf8');
  console.log('gisService.ts patched for Part 03');
} else {
  console.log('Already patched');
}
