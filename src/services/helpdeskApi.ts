// Client-side API handler for Help Desk / Zammad
const API_BASE_URL = '/api/v1';

export async function fetchHelpDeskDashboardData() {
 try {
 const res = await fetch(`${API_BASE_URL}/helpdesk/tickets`);
 const data = await res.json();
 
 // Process real DB tickets
 const realTickets = (data.tickets || []).map((t: any) => ({
 id: t.external_id || t.id?.toString() || 'sem-id',
 title: t.title,
 status: t.status,
 priority: t.priority,
 source: t.source || 'manual',
 date: new Date(t.created_at).toLocaleDateString('pt-BR')
 }));

 return {
 metrics: {
 openTickets: realTickets.filter((t: any) => t.status !== 'resolvido').length,
 criticalIncidents: realTickets.filter((t: any) => t.priority === 'alta').length,
 fieldOrders: 0,
 slaCompliance: 100
 },
 tickets: realTickets,
 nocStatus: {
 oltsTotal: 12,
 oltsUp: 12,
 bgpTotal: 4,
 bgpUp: 4,
 recentAlarm: 'Nenhum'
 }
 };
 } catch (error) {
 console.error('Failed to fetch real tickets:', error);
 return { metrics: {}, tickets: [], nocStatus: {} };
 }
}
