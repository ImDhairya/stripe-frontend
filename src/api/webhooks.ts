import { apiFetch } from './client';

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  secret: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEventItem {
  id: string;
  endpointId: string;
  eventType: string;
  status: 'pending' | 'succeeded' | 'failed';
  attempts: number;
  lastError: string | null;
  payload: any;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
  endpointUrl?: string;
  endpointDescription?: string;
}

export const webhooksApi = {
  create: async (url: string, description?: string): Promise<WebhookEndpoint> => {
    const res = await apiFetch<{ success?: boolean; data?: { endpoint: WebhookEndpoint }; endpoint?: WebhookEndpoint }>('/webhook-endpoints', { 
      method: 'POST', 
      body: JSON.stringify({ url, description }) 
    });
    return (res.data?.endpoint || res.endpoint || (res as any)) as WebhookEndpoint;
  },
  list: async (): Promise<WebhookEndpoint[]> => {
    const res = await apiFetch<{ success?: boolean; data?: { endpoints: WebhookEndpoint[] } | WebhookEndpoint[]; endpoints?: WebhookEndpoint[] }>('/webhook-endpoints', { method: 'GET' });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray((raw as any).endpoints)) return (raw as any).endpoints;
    if (Array.isArray(res.endpoints)) return res.endpoints;
    return [];
  },
  update: async (id: string, data: { isActive?: boolean; url?: string; description?: string }): Promise<WebhookEndpoint> => {
    const res = await apiFetch<{ success?: boolean; data?: { endpoint: WebhookEndpoint }; endpoint?: WebhookEndpoint }>(`/webhook-endpoints/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
    return (res.data?.endpoint || res.endpoint || (res as any)) as WebhookEndpoint;
  },
  delete: (id: string) => 
    apiFetch<{ message?: string; success?: boolean }>(`/webhook-endpoints/${id}`, { method: 'DELETE' }),
  getEvents: async (): Promise<WebhookEventItem[]> => {
    const res = await apiFetch<{ success?: boolean; data?: WebhookEventItem[] | { events: WebhookEventItem[] }; events?: WebhookEventItem[] }>('/webhook-endpoints/events', { method: 'GET' });
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray((raw as any).events)) return (raw as any).events;
    if (Array.isArray(res.events)) return res.events;
    return [];
  },
  testEndpoint: (id: string, mode: 'success' | 'fail_3_times') =>
    apiFetch<WebhookEventItem>(`/webhook-endpoints/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
};
