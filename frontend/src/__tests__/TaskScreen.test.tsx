import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
    const { getByText, findByText } = await render(<TaskScreen />);
    await findByText('Buy milk');

    fireEvent.press(getByText('Ubah'));

    await waitFor(() => expect(getByText('Ubah Tugas')).toBeTruthy());
  });
});
