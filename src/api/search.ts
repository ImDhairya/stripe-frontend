import { apiFetch } from './client';

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SearchResponse<T> {
  data: T[];
  pagination: Pagination;
}

export const searchApi = {
  search: <T>(resource: string, params: Record<string, string | number>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    return apiFetch<SearchResponse<T>>(`/search/${resource}?${searchParams.toString()}`, { method: 'GET' });
  },
};
