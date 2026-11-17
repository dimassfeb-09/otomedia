import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../services/api';
import { Task, TaskStatus } from '../types/task';

export interface UseTasksState {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  keyword: string;
  status: string;
  setPage: (p: number) => void;
  setKeyword: (k: string) => void;
  setStatus: (s: string) => void;
  refresh: () => void;
  loadMore: () => void;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState('');

  // Debounce the search keyword so the list doesn't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const res = await taskApi.list({ page: 1, limit, keyword: debouncedKeyword, status });
      setTasks(res.data);
      setTotal(res.total);
      setHasMore(res.data.length >= limit && res.data.length < res.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [limit, debouncedKeyword, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = Math.floor(tasks.length / limit) + 1;
      const res = await taskApi.list({ page: nextPage, limit, keyword: debouncedKeyword, status });
      setTasks((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        const next = res.data.filter((t) => !existing.has(t.id));
        return [...prev, ...next];
      });
      setTotal(res.total);
      setHasMore(res.data.length >= limit && tasks.length + res.data.length < res.total);
      setPage(nextPage);
    } catch (e: any) {
      setError(e.message || 'Failed to load more');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, tasks.length, limit, debouncedKeyword, status]);

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
    tasks, total, page, limit, loading, loadingMore, hasMore, error, keyword, status,
    setPage, setKeyword, setStatus, refresh, loadMore, create, update, remove,
  };
}