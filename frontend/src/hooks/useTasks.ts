import { useCallback, useEffect, useState } from 'react';
import { taskApi } from '../services/api';
import { Task, TaskStatus } from '../types/task';

export interface UseTasksState {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  keyword: string;
  status: string;
  setPage: (p: number) => void;
  setKeyword: (k: string) => void;
  setStatus: (s: string) => void;
  refresh: () => void;
  create: (input: Partial<Task>) => Promise<void>;
  update: (id: number, input: Partial<Task>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useTasks(initialLimit = 10): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskApi.list({ page, limit, keyword, status });
      setTasks(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refresh = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  const create = useCallback(async (input: Partial<Task>) => {
    await taskApi.create(input as any);
    await fetchTasks();
  }, [fetchTasks]);

  const update = useCallback(async (id: number, input: Partial<Task>) => {
    await taskApi.update(id, input as any);
    await fetchTasks();
  }, [fetchTasks]);

  const remove = useCallback(async (id: number) => {
    await taskApi.remove(id);
    await fetchTasks();
  }, [fetchTasks]);

  return {
    tasks, total, page, limit, loading, error, keyword, status,
    setPage, setKeyword, setStatus, refresh, create, update, remove,
  };
}