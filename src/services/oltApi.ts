import axios from 'axios';
import {
 OltDevice,
 OltSlot,
 OltPonPort,
 OnuDevice,
 OpticalTelemetry,
 OnuDiagnosticResult,
 UnassignedOnu,
 OltAlarm,
 OltProfile,
 AuthorizeOnuPayload,
 BatchOnuOperationPayload,
 OltDashboardMetrics
} from '../types/olt';

const API_BASE = '/api/v1';

export const oltApi = {
 // Dashboard & Métricas
 getDashboardMetrics: async (): Promise<OltDashboardMetrics> => {
 const res = await axios.get(`${API_BASE}/olts-dashboard`);
 return res.data;
 },

 getAlarms: async (oltId?: string): Promise<OltAlarm[]> => {
 const res = await axios.get(`${API_BASE}/olts-alarms`, { params: { olt_id: oltId } });
 return res.data;
 },

 acknowledgeAlarm: async (alarmId: string): Promise<{ success: boolean }> => {
 const res = await axios.post(`${API_BASE}/olts-alarms/${alarmId}/ack`);
 return res.data;
 },

 getProfiles: async (oltId?: string): Promise<OltProfile[]> => {
 const res = await axios.get(`${API_BASE}/olts-profiles`, { params: { olt_id: oltId } });
 return res.data;
 },

 // OLTs
 getOlts: async (): Promise<OltDevice[]> => {
 const res = await axios.get(`${API_BASE}/olts`);
 return res.data;
 },

 getOltById: async (id: string): Promise<OltDevice> => {
 const res = await axios.get(`${API_BASE}/olts/${id}`);
 return res.data;
 },

 createOlt: async (payload: Partial<OltDevice>): Promise<OltDevice> => {
 const res = await axios.post(`${API_BASE}/olts`, payload);
 return res.data;
 },

 updateOlt: async (id: string, payload: Partial<OltDevice>): Promise<OltDevice> => {
 const res = await axios.put(`${API_BASE}/olts/${id}`, payload);
 return res.data;
 },

 deleteOlt: async (id: string): Promise<{ success: boolean; message: string }> => {
 const res = await axios.delete(`${API_BASE}/olts/${id}`);
 return res.data;
 },

 testConnection: async (id: string): Promise<{ success: boolean; latency_ms: number; message: string; system_info?: any }> => {
 const res = await axios.post(`${API_BASE}/olts/${id}/test-connection`);
 return res.data;
 },

 runDiscovery: async (id: string): Promise<{ slots: OltSlot[]; pons: OltPonPort[]; onus_count: number }> => {
 const res = await axios.post(`${API_BASE}/olts/${id}/discovery`);
 return res.data;
 },

 getSlots: async (oltId: string): Promise<OltSlot[]> => {
 const res = await axios.get(`${API_BASE}/olts/${oltId}/slots`);
 return res.data;
 },

 getPons: async (oltId?: string): Promise<OltPonPort[]> => {
 const res = await axios.get(oltId ? `${API_BASE}/olts/${oltId}/pons` : `${API_BASE}/pons`);
 return res.data;
 },

 // ONUs
 getOnus: async (filters?: { olt_id?: string; pon_identifier?: string; status?: string; search?: string }): Promise<OnuDevice[]> => {
 const res = await axios.get(`${API_BASE}/onus`, { params: filters });
 return res.data;
 },

 getOnuById: async (id: string): Promise<OnuDevice> => {
 const res = await axios.get(`${API_BASE}/onus/${id}`);
 return res.data;
 },

 getUnassignedOnus: async (oltId?: string): Promise<UnassignedOnu[]> => {
 const res = await axios.get(`${API_BASE}/onus/unassigned`, { params: { olt_id: oltId } });
 return res.data;
 },

 authorizeOnu: async (payload: AuthorizeOnuPayload): Promise<{ success: boolean; onu: OnuDevice; raw_output?: string }> => {
 const res = await axios.post(`${API_BASE}/onus`, payload);
 return res.data;
 },

 rebootOnu: async (id: string): Promise<{ success: boolean; message: string }> => {
 const res = await axios.post(`${API_BASE}/onus/${id}/reboot`);
 return res.data;
 },

 enableOnu: async (id: string): Promise<{ success: boolean; message: string }> => {
 const res = await axios.post(`${API_BASE}/onus/${id}/enable`);
 return res.data;
 },

 disableOnu: async (id: string): Promise<{ success: boolean; message: string }> => {
 const res = await axios.post(`${API_BASE}/onus/${id}/disable`);
 return res.data;
 },

 deleteOnu: async (id: string): Promise<{ success: boolean; message: string }> => {
 const res = await axios.delete(`${API_BASE}/onus/${id}`);
 return res.data;
 },

 getOpticalInfo: async (id: string): Promise<OpticalTelemetry> => {
 const res = await axios.get(`${API_BASE}/onus/${id}/optical`);
 return res.data;
 },

 runDiagnostics: async (id: string): Promise<OnuDiagnosticResult> => {
 const res = await axios.get(`${API_BASE}/onus/${id}/diagnostics`);
 return res.data;
 },

 executeBatchOperation: async (payload: BatchOnuOperationPayload): Promise<{ success: number; failed: number; details: any[] }> => {
 const res = await axios.post(`${API_BASE}/onus/batch`, payload);
 return res.data;
 }
};
