const fs = require('fs');
let text = fs.readFileSync('server/gis/gisRoutes.ts', 'utf8');

if (!text.includes('/topology/impact')) {
  const advancedRoutes = `
// Parte 03 (Operacional): Análise de Impacto (Rompimento)
router.get('/topology/impact/:id', (req, res) => {
  try {
    const startNodeId = req.params.id;
    const pathNodes = gisService.getDownstreamImpact(startNodeId);
    
    // Filtrar apenas ONTs impactadas para simplificar o relatório
    const impactFeatures = pathNodes
      .map(id => gisService.getFeatureById(id))
      .filter(f => f && f.layer_id === 'layer-ont');
      
    res.json({ success: true, root_id: startNodeId, impacted_nodes_count: impactFeatures.length, impacted_features: impactFeatures });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao analisar impacto' });
  }
});

// Parte 03 (Operacional): Viabilidade de Instalação (Projetos)
router.post('/topology/viability', express.json(), (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Coordenadas não fornecidas' });
    
    const result = gisService.checkViability(lat, lng);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar viabilidade' });
  }
});
`;

  text = text.replace(
    'export default router;',
    advancedRoutes + '\nexport default router;'
  );

  fs.writeFileSync('server/gis/gisRoutes.ts', text, 'utf8');
  console.log('gisRoutes.ts patched with advanced methods');
} else {
  console.log('Already patched');
}
