import { apiFetch } from './client';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'paid';
}

export const authApi = {
  login: (data: any) => apiFetch<{ message: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: any) => apiFetch<{ message: string; result?: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  signupComplete: (data: any) => apiFetch<{ message: string }>('/auth/signup/complete', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: User }>('/auth/me', { method: 'GET' }),
};
