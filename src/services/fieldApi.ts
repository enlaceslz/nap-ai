// Client-side API handler for Field Service (Ordens de Serviço)

const API_BASE_URL = '/api/field';

export async function fetchWorkOrders() {
 try {
 const response = await fetch(`${API_BASE_URL}/os`);
 if (!response.ok) throw new Error('Failed to fetch work orders');
 const data = await response.json();
 return data.workOrders;
 } catch (error) {
 console.error('[Field API] fetchWorkOrders error:', error);
 throw error;
 }
}

export async function updateOrderStatus(id: string, status: string, userId: string, comment?: string) {
 try {
 const response = await fetch(`${API_BASE_URL}/os/${id}/status`, {
 method: 'PATCH',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({ status, userId, comment })
 });
 if (!response.ok) throw new Error('Failed to update order status');
 return await response.json();
 } catch (error) {
 console.error('[Field API] updateOrderStatus error:', error);
 throw error;
 }
}
