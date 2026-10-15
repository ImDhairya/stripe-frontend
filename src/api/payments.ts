import { apiFetch } from './client';

export interface Payment {
  id: string;
  userId: string;
  amount: number | string;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'processing'
    | 'authorized'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'refunded';
  processor: 'stripe' | 'dummy';
  processorPaymentId?: string;
  capturedAmount?: number | string;
  refundedAmount?: number | string;
  idempotencyKey?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  authorizedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  settledVolume: number;
  authorizedVolume: number;
  totalVolumeByCurrency: Record<string, number>;
  totalRefundedVolume: number;
  successRate: number;
  dailyBreakdown: { date: string; count: number; volume: number }[];
}

export const paymentsApi = {
  create: (data: any, idempotencyKey: string) => 
    apiFetch<{ data?: { payment: Payment }; payment?: Payment }>('/payments', { 
      method: 'POST', 
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(data) 
    }),
  get: (id: string) => 
    apiFetch<{ data?: { payment: Payment }; payment?: Payment }>(`/payments/${id}`, { method: 'GET' }),
  capture: (id: string, amount?: number) => 
    apiFetch<{ data?: { payment: Payment }; payment?: Payment }>(`/payments/${id}/capture`, { 
      method: 'POST',
      body: JSON.stringify(amount !== undefined ? { amount } : {}),
    }),
  cancel: (id: string) => 
    apiFetch<{ data?: { payment: Payment }; payment?: Payment }>(`/payments/${id}/cancel`, { method: 'POST' }),
  refund: (paymentId: string, amount?: number, reason?: string) => 
    apiFetch<any>(`/payments/${paymentId}/refund`, { 
      method: 'POST', 
      body: JSON.stringify({
        ...(amount !== undefined ? { amount } : {}),
        ...(reason ? { reason } : {}),
      }),
    }),
  getStats: () =>
    apiFetch<{ success: boolean; data: PaymentStats }>('/payments/stats', { method: 'GET' }),
};
