import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskList } from '../components/TaskList';
import { Pagination } from '../components/Pagination';
import { EditModal } from '../components/EditModal';

export const TaskScreen: React.FC = () => {
  const {
    tasks, total, page, limit, loading, keyword, status,
    setPage, setKeyword, setStatus, update, remove,
  } = useTasks();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEdit = (task: Task) => {
    setEditing(task);
    setModalVisible(true);
  };

  const handleSave = async (id: number, data: Partial<Task>) => {
    await update(id, data);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  return (
    <View style={styles.container}>
      <SearchInput value={keyword} onChange={setKeyword} />
      <StatusFilter value={status} onChange={setStatus} />
      <TaskList tasks={tasks} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      <EditModal visible={modalVisible} task={editing} onClose={() => setModalVisible(false)} onSave={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});