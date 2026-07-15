export class ApiError extends Error {
  public status: number;
  public data: any;
  constructor(status: number, data: any) {
    super(data?.message || 'An API error occurred');
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

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
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
      const refreshResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshResponse.ok) {
        throw new Error('Session expired');
      }

      processQueue(null);
      isRefreshing = false;
      
      // Retry original request
      response = await fetch(url, config);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      isRefreshing = false;
      // Should redirect to login here (handled by authStore integration)
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw refreshError;
    }
  }

  const rateLimitRemaining = response.headers.get('RateLimit-Remaining');
  const retryAfter = response.headers.get('Retry-After');
  
  if (rateLimitRemaining || retryAfter) {
    window.dispatchEvent(new CustomEvent('api:quota', {
      detail: { remaining: rateLimitRemaining, retryAfter }
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
