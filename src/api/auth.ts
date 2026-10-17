import { apiFetch } from './client';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'paid';
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken?: string;
    refreshToken?: string;
  };
}

export const authApi = {
  login: (data: any) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signup: (data: any) =>
    apiFetch<{ message: string; result?: string; signupToken?: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signupComplete: (data: any) =>
    apiFetch<AuthResponse>('/auth/signup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: (data?: any) =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  me: () =>
    apiFetch<{ data?: { user: User }; user?: User }>('/auth/me', {
      method: 'GET',
    }),
};
