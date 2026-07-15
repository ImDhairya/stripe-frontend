import { apiFetch } from './client';

export const adminApi = {
  upgradeUser: (userId: string, newTier: 'free' | 'paid') => 
    apiFetch<{ message: string }>('/admin/upgrade-user', { 
      method: 'POST', 
      body: JSON.stringify({ userId, newTier }) 
    }),
};
