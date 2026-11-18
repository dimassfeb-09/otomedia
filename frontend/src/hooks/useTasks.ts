import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi } from '../services/api';
import { Task } from '../types/task';

export interface UseTasksState {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  keyword: string;
  status: string;
  setPage: (pageNumber: number) => void;
  setKeyword: (keywordValue: string) => void;
  setStatus: (statusValue: string) => void;
  refresh: () => void;
  loadMore: () => void;
  create: (input: Partial<Task>) => Promise<void>;
  update: (id: number, input: Partial<Task>) => Promise<Task>;
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
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      refreshingRef.current = true;
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    setPage(1);

    try {
      const response = await taskApi.list({
        page: 1,
        limit,
        keyword: debouncedKeyword,
        status,
        ...(isRefresh ? { refresh: 1 } : {}),
      });

      setTasks(response.data);
      setTotal(response.meta.total);
      setHasMore(response.data.length >= limit && response.data.length < response.meta.total);
    } catch (error: any) {
      setError(error.message || 'Failed to load tasks');
    } finally {
      if (isRefresh) {
        refreshingRef.current = false;
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [limit, debouncedKeyword, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const loadMore = useCallback(async () => {
    if (loading || refreshingRef.current || loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = Math.floor(tasks.length / limit) + 1;
      const response = await taskApi.list({ page: nextPage, limit, keyword: debouncedKeyword, status });

      setTasks((previousTasks) => {
        const existing = new Set(previousTasks.map((task) => task.id));
        const newTasks = response.data.filter((task) => !existing.has(task.id));

        return [...previousTasks, ...newTasks];
      });

      setTotal(response.meta.total);
      setHasMore(response.data.length >= limit && tasks.length + response.data.length < response.meta.total);
      setPage(nextPage);
    } catch (error: any) {
      setError(error.message || 'Failed to load more');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, tasks.length, limit, debouncedKeyword, status]);

  const refresh = useCallback(() => {
    if (refreshingRef.current) return;

    fetchTasks(true);
  }, [fetchTasks]);

  const create = useCallback(async (input: Partial<Task>) => {
    await taskApi.create(input as any);
    await fetchTasks();
  }, [fetchTasks]);

  const update = useCallback(async (id: number, input: Partial<Task>) => {
    const updated = await taskApi.update(id, input as any);
    await fetchTasks();
    return updated;
  }, [fetchTasks]);

  const remove = useCallback(async (id: number) => {
    await taskApi.remove(id);
    await fetchTasks();
  }, [fetchTasks]);

  return {
    tasks, total, page, limit, loading, loadingMore, refreshing, hasMore, error, keyword, status,
    setPage, setKeyword, setStatus, refresh, loadMore, create, update, remove,
  };
}
