export type GisGeometryType = 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
export type GisPrecisionLevel = 'UNKNOWN' | 'APPROXIMATE' | 'ADDRESS' | 'BUILDING' | 'MANUAL' | 'GPS' | 'SURVEYED';

export interface GisGeometry {
  type: GisGeometryType;
  coordinates: any; // [lng, lat] para Point, [[lng, lat], ...] para LineString
}

export interface GisProperties {
  name: string;
  source_module: 'SGP' | 'GenieACS' | 'OLT_Manager' | 'Zabbix' | 'Manual' | 'Import' | 'GIS_Core';
  external_id?: string;
  status?: string;
  description?: string;
  accuracy?: GisPrecisionLevel;
  // Engenharia (Parte 02)
  capacity?: number;
  occupied?: number;
  fibers_count?: number;
  cable_type?: 'AERIAL' | 'UNDERGROUND' | 'DROP';
  [key: string]: any;
}

export interface GisFeature {
  id: string;
  type: 'Feature';
  geometry: GisGeometry;
  properties: GisProperties;
  layer_id: string;
  created_at: string;
  updated_at: string;
}

export interface GisLayer {
  id: string;
  name: string;
  description: string;
  visible_by_default: boolean;
  color_hex?: string;
}

// PRD Parte 02: Topologia Lógica e Física
export interface GisTopologyLink {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: 'CONNECTED_TO' | 'SPLICES_TO' | 'CONTAINS' | 'USES_FIBER';
  metadata?: any;
}
