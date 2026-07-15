import { apiFetch } from './client';

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export const refundsApi = {
  get: (id: string) => 
    apiFetch<Refund>(`/refunds/${id}`, { method: 'GET' }),
};
