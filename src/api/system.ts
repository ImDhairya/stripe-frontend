import { apiFetch } from './client';

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface SystemTelemetry {
  queues: {
    outbound: QueueCounts;
    inbound: QueueCounts;
  };
  webhookLagSeconds: number;
  latency: {
    redisMs: number;
    postgresMs: number;
  };
  userUsage: {
    rateLimit: {
      current: number;
      limit: number;
      remaining: number;
    };
    quota: {
      count: number;
      countLimit: number;
      volume: number;
      volumeLimit: number;
      monthKey: string;
    };
  };
  metrics: any[];
}

export const systemApi = {
  getTelemetry: () =>
    apiFetch<{ success: boolean; data: SystemTelemetry }>('/system/telemetry', { method: 'GET' }),
};
