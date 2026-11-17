import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskList } from '../components/TaskList';
import { Pagination } from '../components/Pagination';
import { EditModal } from '../components/EditModal';

export const TaskScreen: React.FC = () => {
  const {
    tasks, total, page, limit, loading, loadingMore, hasMore, keyword, status,
    setKeyword, setStatus, update, remove, loadMore,
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Manager</Text>
        <Text style={styles.headerSubtitle}>Kelola tugas tim Anda dengan rapi</Text>
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) {
            loadMore();
          }
        }}
        scrollEventThrottle={200}
      >
        <SearchInput value={keyword} onChange={setKeyword} />
        <StatusFilter value={status} onChange={setStatus} />
        <TaskList tasks={tasks} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
        {loadingMore ? <ActivityIndicator style={styles.loader} color="#2563EB" /> : null}
        {!hasMore && tasks.length > 0 ? <Text style={styles.endText}>Semua tugas sudah dimuat</Text> : null}
      </ScrollView>
      <EditModal visible={modalVisible} task={editing} onClose={() => setModalVisible(false)} onSave={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  content: { flex: 1 },
  contentContainer: { paddingTop: 12, paddingBottom: 24 },
  loader: { marginVertical: 16 },
  endText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, paddingVertical: 12 },
});