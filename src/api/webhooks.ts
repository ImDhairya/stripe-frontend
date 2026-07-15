import { apiFetch } from './client';

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  secret: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const webhooksApi = {
  create: (url: string) => 
    apiFetch<WebhookEndpoint>('/webhook-endpoints', { 
      method: 'POST', 
      body: JSON.stringify({ url }) 
    }),
  list: () => 
    apiFetch<{ data: WebhookEndpoint[] }>('/webhook-endpoints', { method: 'GET' }),
  update: (id: string, status: 'active' | 'inactive') => 
    apiFetch<WebhookEndpoint>(`/webhook-endpoints/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ status }) 
    }),
  delete: (id: string) => 
    apiFetch<{ message: string }>(`/webhook-endpoints/${id}`, { method: 'DELETE' }),
};
