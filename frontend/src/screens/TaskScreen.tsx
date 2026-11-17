import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskCard } from '../components/TaskList';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const TaskScreen: React.FC = () => {
  const {
    tasks, total, loading, loadingMore, hasMore, keyword, status,
    setKeyword, setStatus, update, remove, loadMore,
  } = useTasks();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleEdit = (task: Task) => {
    setEditing(task);
    setModalVisible(true);
  };

  const handleSave = async (id: number, data: Partial<Task>) => {
    await update(id, data);
  };

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId !== null) {
      await remove(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  const renderItem = useCallback(({ item }: { item: Task }) => (
    <TaskCard task={item} onEdit={handleEdit} onDelete={handleDelete} />
  ), []);

  const keyExtractor = useCallback((item: Task) => String(item.id), []);

  const ListHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Manager</Text>
        <Text style={styles.headerSubtitle}>Kelola tugas tim Anda dengan rapi</Text>
      </View>
      <SearchInput value={keyword} onChange={setKeyword} />
      <StatusFilter value={status} onChange={setStatus} />
    </>
  );

  const ListFooter = loadingMore ? (
    <ActivityIndicator style={styles.loader} color="#2563EB" />
  ) : !hasMore && tasks.length > 0 ? (
    <View style={styles.endWrap}>
      <View style={styles.endLine} />
      <Text style={styles.endText}>Semua tugas sudah dimuat</Text>
      <View style={styles.endLine} />
    </View>
  ) : undefined;

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
        <Text style={styles.loadingText}>Memuat tugas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Belum ada tugas</Text>
            <Text style={styles.emptySubtitle}>Tambahkan tugas baru untuk memulai</Text>
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title="Hapus Tugas"
        message="Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#BFDBFE', marginTop: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  loadingText: { color: '#64748B', fontSize: 15, marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B' },
  loader: { marginVertical: 16 },
  endWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 16, gap: 12 },
  endLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  endText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});