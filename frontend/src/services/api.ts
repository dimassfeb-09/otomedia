import { Task, TaskListResponse, CreateTaskInput } from '../types/task';

const HOST = 'localhost';
const BASE_URL = `http://${HOST}:8080`;

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || response.statusText;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const taskApi = {
  list: (params: Record<string, string | number>) => {
    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') queryString.append(key, String(value));
    });

    return apiRequest<TaskListResponse>(`/api/tasks?${queryString.toString()}`);
  },
  get: (id: number) => apiRequest<{ data: Task }>(`/api/tasks/${id}`).then((r) => r.data),
  create: (input: CreateTaskInput) =>
    apiRequest<{ data: Task }>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data),
  update: (id: number, input: CreateTaskInput) =>
    apiRequest<{ data: Task }>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) }).then((r) => r.data),
  remove: (id: number) => apiRequest<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};
