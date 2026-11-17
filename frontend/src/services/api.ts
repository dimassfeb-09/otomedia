import { Platform } from 'react-native';
import { Task, TaskListResponse, CreateTaskInput } from '../types/task';

// Android emulator mengakses host machine via 10.0.2.2.
// Untuk device fisik, ganti dengan IP komputer Anda.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}:8080`;

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || res.statusText;
    throw new Error(msg);
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

export const taskApi = {
  list: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return apiRequest<TaskListResponse>(`/api/tasks?${qs.toString()}`);
  },
  get: (id: number) => apiRequest<Task>(`/api/tasks/${id}`),
  create: (input: CreateTaskInput) =>
    apiRequest<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: CreateTaskInput) =>
    apiRequest<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => apiRequest<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};