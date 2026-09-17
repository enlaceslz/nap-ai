const fs = require('fs');
let text = fs.readFileSync('server/gis/gisService.ts', 'utf8');

const targetStr = `    return {
      success: true,
      root_id: startNodeId,
      root_name: startFeature.properties.name,
      impact: {
        total_features: impactedFeatures.length,`;

const replacementStr = `    // OTDR Simulation (Distance from OLT)
    const olts = this.data.features.filter(f => f.layer_id === 'layer-olt');
    let oltDist = 0;
    let oltName = 'OLT Desconhecida';
    
    if (olts.length > 0 && startFeature.geometry.coordinates) {
      let coords = startFeature.geometry.coordinates;
      if (startFeature.geometry.type === 'LineString') {
        coords = startFeature.geometry.coordinates[0];
      }
      let minDist = Infinity;
      for (const olt of olts) {
        const oltCoords = olt.geometry.coordinates;
        const dist = this.calculateDistance(coords[1], coords[0], oltCoords[1], oltCoords[0]);
        if (dist < minDist) {
          minDist = dist;
          oltName = olt.properties.name;
        }
      }
      oltDist = Math.round(minDist);
    }

    return {
      success: true,
      root_id: startNodeId,
      root_name: startFeature.properties.name,
      impact: {
        total_features: impactedFeatures.length,
        otdr_distance_meters: oltDist,
        otdr_reference: oltName,`;

if(text.includes('otdr_distance_meters')) {
  console.log('Already patched');
} else {
  text = text.replace(targetStr, replacementStr);
  fs.writeFileSync('server/gis/gisService.ts', text, 'utf8');
  console.log('gisService.ts patched with OTDR estimation');
}
