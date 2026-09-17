const fs = require('fs');
let text = fs.readFileSync('server/gis/gisRoutes.ts', 'utf8');

if (text.includes('gisService.getDownstreamImpact')) {
  text = text.replace(
    /router\.get\('\/topology\/impact\/:id',[\s\S]*?\}\);/,
    `router.get('/topology/impact/:id', (req, res) => {
  try {
    const startNodeId = req.params.id;
    const impactReport = gisService.getImpactAnalysis(startNodeId);
    if (!impactReport.success) {
       return res.status(404).json(impactReport);
    }
    res.json(impactReport);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao analisar impacto' });
  }
});`
  );

  text = text.replace(
    /const result = gisService\.checkViability\(lat, lng\);/,
    `const result = gisService.checkViabilityAdvanced(lat, lng);`
  );

  fs.writeFileSync('server/gis/gisRoutes.ts', text, 'utf8');
  console.log('gisRoutes.ts patched for Part 03');
} else {
  console.log('Could not find replace targets in gisRoutes');
}
