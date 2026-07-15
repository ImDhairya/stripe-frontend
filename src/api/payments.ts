import { apiFetch } from './client';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  processor: 'stripe' | 'dummy';
  processorId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const paymentsApi = {
  create: (data: any, idempotencyKey: string) => 
    apiFetch<Payment>('/payments', { 
      method: 'POST', 
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(data) 
    }),
  get: (id: string) => 
    apiFetch<Payment>(`/payments/${id}`, { method: 'GET' }),
  capture: (id: string) => 
    apiFetch<Payment>(`/payments/${id}/capture`, { method: 'POST' }),
  cancel: (id: string) => 
    apiFetch<Payment>(`/payments/${id}/cancel`, { method: 'POST' }),
  refund: (paymentId: string, amount?: number) => 
    apiFetch<any>(`/payments/${paymentId}/refund`, { 
      method: 'POST', 
      body: JSON.stringify(amount ? { amount } : {}) 
    }),
};
