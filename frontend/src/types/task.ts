export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  data: Task[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
}