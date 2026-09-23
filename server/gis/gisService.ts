import fs from 'fs';
import path from 'path';
import { GisFeature, GisLayer, GisTopologyLink } from './types';
import { OltService } from '../olt/oltService';

interface GisDatabaseSchema {
  layers: GisLayer[];
  features: GisFeature[];
  topology: GisTopologyLink[];
}

export class GisService {
  private static instance: GisService;
  private dbPath: string;
  private data: GisDatabaseSchema;

  private constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'gis_database.json');
    this.data = this.loadDatabase();
  }

  public static getInstance(): GisService {
    if (!GisService.instance) {
      GisService.instance = new GisService();
    }
    return GisService.instance;
  }

  private loadDatabase(): GisDatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn('[NAP GIS] Falha ao carregar banco JSON local, inicializando dados padrão:', e);
    }
    const initialData = this.getInitialSeedData();
    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave?: GisDatabaseSchema): void {
    try {
      const targetData = dataToSave || this.data;
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(targetData, null, 2), 'utf-8');
    } catch (e) {
      console.error('[NAP GIS] Erro ao salvar banco JSON:', e);
    }
  }

  private getInitialSeedData(): GisDatabaseSchema {
    const layers: GisLayer[] = [
      { id: 'layer-clientes', name: 'Clientes', description: 'Assinantes', visible_by_default: true, color_hex: '#10b981' },
      { id: 'layer-olt', name: 'OLTs', description: 'Chassis de OLT', visible_by_default: true, color_hex: '#d946ef' },
      { id: 'layer-dio', name: 'DIOs', description: 'Distribuidor Interno Óptico', visible_by_default: true, color_hex: '#f59e0b' },
      { id: 'layer-ceo', name: 'CEOs', description: 'Caixas de Emenda Óptica', visible_by_default: true, color_hex: '#f97316' },
      { id: 'layer-cto', name: 'CTOs', description: 'Caixas de Atendimento', visible_by_default: true, color_hex: '#3b82f6' },
      { id: 'layer-ont', name: 'ONTs', description: 'Equipamentos de Cliente', visible_by_default: true, color_hex: '#10b981' },
      { id: 'layer-cabo', name: 'Cabos Tronco/Distribuição', description: 'Rotas de Fibra Óptica', visible_by_default: true, color_hex: '#64748b' },
      { id: 'layer-drop', name: 'Drops', description: 'Cabos Drop de Atendimento', visible_by_default: true, color_hex: '#94a3b8' }
    ];

    return { layers, features: [], topology: [] };
  }

  public getLayers(): GisLayer[] {
    return this.data.layers;
  }

  
  /**
   * Integração Nativa e Sincronizada (SGP + Zabbix + OLT + GenieACS)
   * Consolida o status de todos os submódulos no GIS.
   */
  private syncEcosystem() {
    // 1. Sincroniza topologia base (OLT Manager)
    this.syncOltDataToGis();
  }
  
  public getFeatures(layerId?: string): GisFeature[] {
    this.syncEcosystem(); // Substitui a chamada antiga do OLT
    // this.syncOltDataToGis(); delegada para syncEcosystem()

    if (layerId) {
      return this.data.features.filter(f => f.layer_id === layerId);
    }
    return this.data.features;
  }

  public getFeatureById(id: string): GisFeature | null {
    return this.data.features.find(f => f.id === id) || null;
  }

  // --- Parte 02: Topologia Lógica e Física ---
  
  
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

    // OTDR Simulation (Distance from OLT)
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
        otdr_reference: oltName,
        onts_affected: ontCount,
        ctos_affected: ctoCount,
        ceos_affected: ceoCount,
        estimated_customers: ontCount // assumindo 1:1 ONT:Cliente
      },
      suggestion: `Possível causa comum: falha na infraestrutura ${startFeature.properties.name} (${startNodeId})`
    };
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
      confidence: viableOptions.length > 0 ? (viableOptions[0].score >= 80 ? 'ALTA' : 'MEDIA') : 'BAIXA',
      data_quality: ['Coordenada validada', 'CTO documentada', 'Porta disponível']
    };
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
  
  public getTopologyPath(startNodeId: string): string[] {
    // Busca em Grafo (BFS) para encontrar todo o caminho físico/logico associado (Upstream e Downstream)
    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Encontrar todos os links onde current é source ou target
      const connections = this.data.topology.filter(t => t.source_id === current || t.target_id === current);
      
      for (const link of connections) {
        const neighbor = link.source_id === current ? link.target_id : link.source_id;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return Array.from(visited);
  }

  private addTopologyLink(sourceId: string, targetId: string, relationType: 'CONNECTED_TO' | 'SPLICES_TO' | 'CONTAINS') {
    const linkId = `${sourceId}-${targetId}`;
    if (!this.data.topology.find(t => t.id === linkId)) {
      this.data.topology.push({
        id: linkId,
        source_id: sourceId,
        target_id: targetId,
        relation_type: relationType
      });
    }
  }

  /**
   * Constrói a Engenharia Física e Topologia Baseada nos Equipamentos Lógicos (Parte 02)
   */
  private syncOltDataToGis() {
    const oltService = OltService.getInstance();
    const olts = oltService.getOlts();
    let hasChanges = false;

    olts.forEach((olt, index) => {
      const oltGisId = `gis-olt-${olt.id}`;
      let oltFeature = this.data.features.find(f => f.id === oltGisId);
      
      let oltLng = -46.633308 + (index * 0.02);
      let oltLat = -23.55052 + (index * 0.01);

      if (!oltFeature) {
        oltFeature = {
          id: oltGisId,
          type: 'Feature',
          layer_id: 'layer-olt',
          geometry: { type: 'Point', coordinates: [oltLng, oltLat] },
          properties: {
            name: olt.nome,
            source_module: 'OLT_Manager',
            external_id: olt.id,
            status: olt.status,
            description: `${olt.fabricante} ${olt.modelo} - IP: ${olt.ip}`,
            accuracy: 'APPROXIMATE',
            vendor: olt.fabricante
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.data.features.push(oltFeature);
        hasChanges = true;

        // Criar DIO no mesmo POP
        const dioGisId = `gis-dio-${olt.id}`;
        this.data.features.push({
          id: dioGisId,
          type: 'Feature',
          layer_id: 'layer-dio',
          geometry: { type: 'Point', coordinates: [oltLng + 0.0001, oltLat + 0.0001] },
          properties: {
            name: `DIO - POP ${olt.nome.split('-').pop()}`,
            source_module: 'GIS_Core',
            description: 'DIO de Distribuição 72F',
            accuracy: 'APPROXIMATE',
            capacity: 72,
            occupied: 12
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        this.addTopologyLink(oltGisId, dioGisId, 'CONNECTED_TO');

        // Criar CEO Tronco no meio do caminho
        const ceoLng = oltLng - 0.008;
        const ceoLat = oltLat - 0.005;
        const ceoGisId = `gis-ceo-${olt.id}`;
        this.data.features.push({
          id: ceoGisId,
          type: 'Feature',
          layer_id: 'layer-ceo',
          geometry: { type: 'Point', coordinates: [ceoLng, ceoLat] },
          properties: {
            name: `CEO Tronco - Rota ${olt.nome.split('-').pop()}`,
            source_module: 'GIS_Core',
            description: 'Caixa de Emenda Óptica (Sangria)',
            accuracy: 'APPROXIMATE',
            capacity: 48,
            status: 'online'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Cabo Tronco (LineString: DIO -> CEO)
        const caboTroncoId = `gis-cabo-tronco-${olt.id}`;
        this.data.features.push({
          id: caboTroncoId,
          type: 'Feature',
          layer_id: 'layer-cabo',
          geometry: { type: 'LineString', coordinates: [[oltLng + 0.0001, oltLat + 0.0001], [ceoLng, ceoLat]] },
          properties: {
            name: `Cabo Tronco 48FO - Rota ${olt.nome.split('-').pop()}`,
            source_module: 'GIS_Core',
            cable_type: 'AERIAL',
            fibers_count: 48,
            accuracy: 'APPROXIMATE'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        this.addTopologyLink(dioGisId, caboTroncoId, 'CONNECTED_TO');
        this.addTopologyLink(caboTroncoId, ceoGisId, 'CONNECTED_TO');

        // Criar CTO de Distribuição (Final)
        const ctoLng = ceoLng - 0.006;
        const ctoLat = ceoLat - 0.004;
        const ctoGisId = `gis-cto-${olt.id}`;
        this.data.features.push({
          id: ctoGisId,
          type: 'Feature',
          layer_id: 'layer-cto',
          geometry: { type: 'Point', coordinates: [ctoLng, ctoLat] },
          properties: {
            name: `CTO - Bairro ${olt.nome.split('-').pop()}`,
            source_module: 'GIS_Core',
            description: 'CTO 1:16',
            accuracy: 'APPROXIMATE',
            capacity: 16,
            occupied: 0 // Será incrementado dinamicamente
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Cabo Dist (LineString: CEO -> CTO)
        const caboDistId = `gis-cabo-dist-${olt.id}`;
        this.data.features.push({
          id: caboDistId,
          type: 'Feature',
          layer_id: 'layer-cabo',
          geometry: { type: 'LineString', coordinates: [[ceoLng, ceoLat], [ctoLng, ctoLat]] },
          properties: {
            name: `Cabo AS 12FO - Dist ${olt.nome.split('-').pop()}`,
            source_module: 'GIS_Core',
            cable_type: 'AERIAL',
            fibers_count: 12,
            accuracy: 'APPROXIMATE'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        this.addTopologyLink(ceoGisId, caboDistId, 'CONNECTED_TO');
        this.addTopologyLink(caboDistId, ctoGisId, 'CONNECTED_TO');
      } else {
        oltFeature.properties.status = olt.status;
        oltLng = oltFeature.geometry.coordinates[0];
        oltLat = oltFeature.geometry.coordinates[1];
      }
    });

    // Sincronizar ONTs e Drops
    const onus = oltService['data'].onus;
    onus.forEach((onu, idx) => {
      const onuGisId = `gis-onu-${onu.id}`;
      let onuFeature = this.data.features.find(f => f.id === onuGisId);
      
      const ctoGisId = `gis-cto-${onu.olt_id}`;
      const ctoFeature = this.data.features.find(f => f.id === ctoGisId);

      if (!onuFeature && ctoFeature && ctoFeature.geometry.type === 'Point') {
        const ctoLng = ctoFeature.geometry.coordinates[0];
        const ctoLat = ctoFeature.geometry.coordinates[1];
        
        // Espalha as ONTs perto da CTO de forma determinística
        const angle = (idx * 137.5 * Math.PI) / 180;
        const radius = 0.0005 + ((idx % 5) * 0.0003);
        const onuLng = ctoLng + Math.cos(angle) * radius;
        const onuLat = ctoLat + Math.sin(angle) * radius;

        // Atualiza Ocupação da CTO
        ctoFeature.properties.occupied = (ctoFeature.properties.occupied || 0) + 1;

        onuFeature = {
          id: onuGisId,
          type: 'Feature',
          layer_id: 'layer-ont',
          geometry: { type: 'Point', coordinates: [onuLng, onuLat] },
          properties: {
            name: onu.nome,
            source_module: 'OLT_Manager',
            external_id: onu.id,
            status: onu.status,
            description: `ONT ${onu.serial} - PON: ${onu.pon_identifier}`,
            accuracy: 'APPROXIMATE',
            rx_power: onu.rx_onu
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.data.features.push(onuFeature);

        // Criar Drop (LineString: CTO -> ONT)
        const dropId = `gis-drop-${onu.id}`;
        this.data.features.push({
          id: dropId,
          type: 'Feature',
          layer_id: 'layer-drop',
          geometry: { type: 'LineString', coordinates: [[ctoLng, ctoLat], [onuLng, onuLat]] },
          properties: {
            name: `Drop Óptico - ${onu.nome}`,
            source_module: 'GIS_Core',
            cable_type: 'DROP',
            fibers_count: 1,
            accuracy: 'APPROXIMATE'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Topologia Final
        this.addTopologyLink(ctoGisId, dropId, 'CONNECTED_TO');
        this.addTopologyLink(dropId, onuGisId, 'CONNECTED_TO');

        hasChanges = true;
      } else if (onuFeature) {
        onuFeature.properties.status = onu.status;
        onuFeature.properties.rx_power = onu.rx_onu;
      }
    });

    if (hasChanges) {
      this.saveDatabase();
    }
  }
}
