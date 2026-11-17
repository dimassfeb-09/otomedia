import React from 'react';
import { render } from '@testing-library/react-native';
import { TaskList } from '../components/TaskList';
import { Task } from '../types/task';

const tasks: Task[] = [
  { id: 1, title: 'Buy milk', description: '', status: 'pending', assignee: 'alice', created_at: '', updated_at: '' },
  { id: 2, title: 'Write code', description: '', status: 'done', assignee: 'bob', created_at: '', updated_at: '' },
];

describe('TaskList', () => {
  it('renders task titles', async () => {
    const { getByText } = await render(<TaskList tasks={tasks} loading={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('Buy milk')).toBeTruthy();
    expect(getByText('Write code')).toBeTruthy();
  });

  it('shows loading state', async () => {
    const { getByText } = await render(<TaskList tasks={[]} loading={true} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('Memuat tugas...')).toBeTruthy();
  });

  it('shows empty state', async () => {
    const { getByText } = await render(<TaskList tasks={[]} loading={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('Belum ada tugas')).toBeTruthy();
  });
});