import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TaskScreen } from '../screens/TaskScreen';
import { taskApi } from '../services/api';

jest.mock('../services/api', () => ({
  taskApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const sample = {
  id: 1,
  title: 'Buy milk',
  description: 'desc',
  status: 'pending' as const,
  assignee: 'alice',
  created_at: '',
  updated_at: '',
};

describe('TaskScreen', () => {
  beforeEach(() => {
    (taskApi.list as jest.Mock).mockResolvedValue({ data: [sample], total: 1, page: 1, limit: 10 });
  });

  it('opens the edit dialog when pressing Ubah', async () => {
    await render(<TaskScreen />);
    await screen.findByText('Buy milk');

    await fireEvent.press(screen.getByText('Ubah'));

    expect(await screen.findByText('Ubah Tugas')).toBeTruthy();
  });
});
