export class ApiError extends Error {
  public status: number;
  public data: any;
  constructor(status: number, data: any) {
    const message =
      data?.message ||
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      (Array.isArray(data?.issue) ? data.issue[0]?.message : null) ||
      'An API error occurred';
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('accessToken');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Core requirement for HTTP-only cookies
  };

  let response = await fetch(url, config);

  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return apiFetch<T>(endpoint, options);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const refreshHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (refreshToken) {
        refreshHeaders['x-refresh-token'] = refreshToken;
      }

      const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: refreshHeaders,
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        throw new Error('Session expired');
      }

      const refreshData = await refreshResponse.json().catch(() => ({}));
      const newAccessToken = refreshData?.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
      }
      if (refreshData?.data?.refreshToken) {
        localStorage.setItem('refreshToken', refreshData.data.refreshToken);
      }

      processQueue(null);
      isRefreshing = false;
      
      // Retry original request with new token
      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
      }
      response = await fetch(url, config);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      isRefreshing = false;
      // Should redirect to login here (handled by authStore integration)
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw refreshError;
    }
  }

  const rateLimitRemaining =
    response.headers.get('X-RateLimit-Remaining') ||
    response.headers.get('RateLimit-Remaining');
  const rateLimitLimit =
    response.headers.get('X-RateLimit-Limit') ||
    response.headers.get('RateLimit-Limit');
  const rateLimitReset =
    response.headers.get('X-RateLimit-Reset') ||
    response.headers.get('RateLimit-Reset');
  const retryAfter = response.headers.get('Retry-After');
  
  if (rateLimitRemaining !== null || retryAfter) {
    window.dispatchEvent(new CustomEvent('api:quota', {
      detail: { remaining: rateLimitRemaining, limit: rateLimitLimit, reset: rateLimitReset, retryAfter }
    }));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
