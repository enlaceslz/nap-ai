const fs = require('fs');
let text = fs.readFileSync('server/gis/gisService.ts', 'utf8');

if (!text.includes('getDownstreamImpact')) {
  const advancedMethods = `
  private getFeatureTier(feature: GisFeature): number {
    if (feature.layer_id === 'layer-olt') return 10;
    if (feature.layer_id === 'layer-dio') return 20;
    if (feature.layer_id === 'layer-cabo' && feature.properties.name?.includes('Tronco')) return 30;
    if (feature.layer_id === 'layer-ceo') return 40;
    if (feature.layer_id === 'layer-cabo' && feature.properties.name?.includes('Dist')) return 50;
    if (feature.layer_id === 'layer-cto') return 60;
    if (feature.layer_id === 'layer-drop') return 70;
    if (feature.layer_id === 'layer-ont') return 80;
    return 100;
  }

  public getDownstreamImpact(startNodeId: string): string[] {
    const startFeature = this.getFeatureById(startNodeId);
    if (!startFeature) return [];

    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentFeature = this.getFeatureById(currentId);
      if (!currentFeature) continue;
      
      const currentTier = this.getFeatureTier(currentFeature);

      const connections = this.data.topology.filter(t => t.source_id === currentId || t.target_id === currentId);
      
      for (const link of connections) {
        const neighborId = link.source_id === currentId ? link.target_id : link.source_id;
        const neighborFeature = this.getFeatureById(neighborId);
        
        if (neighborFeature && !visited.has(neighborId)) {
          const neighborTier = this.getFeatureTier(neighborFeature);
          // Only traverse downstream (higher tier number)
          if (neighborTier > currentTier) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        }
      }
    }

    return Array.from(visited);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  public checkViability(lat: number, lng: number) {
    this.syncOltDataToGis();
    const ctos = this.data.features.filter(f => f.layer_id === 'layer-cto');
    
    let bestCto = null;
    let minDistance = Infinity;

    for (const cto of ctos) {
      if (cto.geometry.type === 'Point') {
        const [ctoLng, ctoLat] = cto.geometry.coordinates;
        const dist = this.calculateDistance(lat, lng, ctoLat, ctoLng);
        
        const capacity = cto.properties.capacity || 16;
        const occupied = cto.properties.occupied || 0;
        const isAvailable = occupied < capacity;

        if (dist < minDistance && isAvailable) {
          minDistance = dist;
          bestCto = cto;
        }
      }
    }

    return {
      viable: bestCto !== null && minDistance <= 400, // Limite de 400m para drop
      distance_meters: Math.round(minDistance),
      cto: bestCto
    };
  }
  `;

  text = text.replace(
    'public getTopologyPath(startNodeId: string): string[] {',
    advancedMethods + '\n  public getTopologyPath(startNodeId: string): string[] {'
  );

  fs.writeFileSync('server/gis/gisService.ts', text, 'utf8');
  console.log('gisService.ts patched with advanced methods');
} else {
  console.log('Already patched');
}
