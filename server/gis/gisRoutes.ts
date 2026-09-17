import express from 'express';
import { GisService } from './gisService';
import { ZabbixService } from '../zabbix/zabbixService';

const router = express.Router();
const gisService = GisService.getInstance();

// Camadas
router.get('/layers', (req, res) => {
  try {
    const layers = gisService.getLayers();
    res.json(layers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar camadas' });
  }
});

// Features
router.get('/features', (req, res) => {
  try {
    const layerId = req.query.layer_id as string;
    const features = gisService.getFeatures(layerId);
    res.json(features);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar features' });
  }
});

router.get('/features/:id', (req, res) => {
  try {
    const feature = gisService.getFeatureById(req.params.id);
    if (!feature) {
      return res.status(404).json({ error: 'Feature não encontrada' });
    }
    res.json(feature);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feature' });
  }
});

// Parte 02: Topologia (Rastreamento / Caminho)
router.get('/topology/path/:id', (req, res) => {
  try {
    const startNodeId = req.params.id;
    const feature = gisService.getFeatureById(startNodeId);
    if (!feature) {
      return res.status(404).json({ error: 'Elemento de início não encontrado' });
    }
    const pathNodes = gisService.getTopologyPath(startNodeId);
    res.json({ success: true, root_id: startNodeId, topology_nodes: pathNodes });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao rastrear topologia' });
  }
});


// Parte 03 (Operacional): Análise de Impacto (Rompimento)
router.get('/topology/impact/:id', (req, res) => {
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
});

// Parte 03 (Operacional): Viabilidade de Instalação (Projetos)
router.post('/topology/viability', express.json(), (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Coordenadas não fornecidas' });
    
    const result = gisService.checkViabilityAdvanced(lat, lng);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar viabilidade' });
  }
});


router.post('/topology/declare-failure/:id', (req, res) => {
  try {
    const startNodeId = req.params.id;
    const impactReport = gisService.getImpactAnalysis(startNodeId);
    if (!impactReport.success) return res.status(404).json(impactReport);

    const zabbixService = ZabbixService.getInstance();
    const hosts = zabbixService.getHosts();
    const targetHost = hosts.find(h => h.name.includes('OLT')) || hosts[0];

    const alarmMessage = `Rompimento de Fibra: ${impactReport.root_name}. Estimativa (OTDR): ~${impactReport.impact.otdr_distance_meters}m da ${impactReport.impact.otdr_reference}. ${impactReport.impact.onts_affected} ONTs offline.`;

    const problem = zabbixService.simulateTrigger(targetHost.id, 'critical', alarmMessage);

    res.json({ success: true, message: 'Alarme Zabbix gerado com sucesso', problem });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao declarar falha' });
  }
});

export default router;
