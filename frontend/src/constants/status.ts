import { TaskStatus } from '../types/task';

// Single source of truth for status labels so the badge, the filter chips and
// the edit modal always read the same. All Indonesian to match the rest of the UI.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Menunggu',
  in_progress: 'Proses',
  done: 'Selesai',
};

export const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'done'];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  done: '#10B981',
};
