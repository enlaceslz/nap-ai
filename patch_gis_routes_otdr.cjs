const fs = require('fs');
let text = fs.readFileSync('server/gis/gisRoutes.ts', 'utf8');

if (!text.includes('ZabbixService')) {
  text = text.replace(
    "import { GisService } from './gisService';",
    "import { GisService } from './gisService';\nimport { ZabbixService } from '../zabbix/zabbixService';"
  );
}

const declareRoute = `
router.post('/topology/declare-failure/:id', (req, res) => {
  try {
    const startNodeId = req.params.id;
    const impactReport = gisService.getImpactAnalysis(startNodeId);
    if (!impactReport.success) return res.status(404).json(impactReport);

    const zabbixService = ZabbixService.getInstance();
    const hosts = zabbixService.getHosts();
    const targetHost = hosts.find(h => h.name.includes('OLT')) || hosts[0];

    const alarmMessage = \`Rompimento de Fibra: \${impactReport.root_name}. Estimativa (OTDR): ~\${impactReport.impact.otdr_distance_meters}m da \${impactReport.impact.otdr_reference}. \${impactReport.impact.onts_affected} ONTs offline.\`;

    const problem = zabbixService.simulateTrigger(targetHost.id, 'critical', alarmMessage);

    res.json({ success: true, message: 'Alarme Zabbix gerado com sucesso', problem });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao declarar falha' });
  }
});
`;

if (!text.includes('/topology/declare-failure/')) {
  text = text.replace(
    'export default router;',
    declareRoute + '\nexport default router;'
  );
  fs.writeFileSync('server/gis/gisRoutes.ts', text, 'utf8');
  console.log('gisRoutes.ts patched with OTDR/Zabbix alert endpoint');
} else {
  console.log('Already patched');
}
