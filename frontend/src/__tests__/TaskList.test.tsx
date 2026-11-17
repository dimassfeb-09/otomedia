import React from 'react';
import { render } from '@testing-library/react-native';
import { TaskList } from '../components/TaskList';
import { Task } from '../types/task';

const tasks: Task[] = [
  { id: 1, title: 'Buy milk', description: '', status: 'pending', assignee: 'alice', created_at: '', updated_at: '' },
  { id: 2, title: 'Write code', description: '', status: 'done', assignee: 'bob', created_at: '', updated_at: '' },
];

describe('TaskList', () => {
  it('renders task titles', () => {
    const { getByText } = render(<TaskList tasks={tasks} loading={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('Buy milk')).toBeTruthy();
    expect(getByText('Write code')).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByText } = render(<TaskList tasks={[]} loading={true} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows empty state', () => {
    const { getByText } = render(<TaskList tasks={[]} loading={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(getByText('No tasks found')).toBeTruthy();
  });
});