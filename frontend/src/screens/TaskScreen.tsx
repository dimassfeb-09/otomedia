import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskCard } from '../components/TaskList';
import { TaskDetail } from '../components/TaskDetail';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditModal } from '../components/EditModal';
import { CreateModal } from '../components/CreateModal';
import { ListFooter } from '../components/ListFooter';

export const TaskScreen: React.FC = () => {
  const {
    tasks, loading, loadingMore, refreshing, hasMore, keyword, status,
    setKeyword, setStatus, create, update, remove, loadMore, refresh,
  } = useTasks();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const handleEdit = useCallback((task: Task) => {
    setEditing(task);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async (id: number, data: Partial<Task>) => {
    const updated = await update(id, data);
    if (detailTask?.id === id && updated) setDetailTask(updated);
  }, [update, detailTask]);

  const handleCreate = useCallback(async (data: Partial<Task>) => {
    await create(data);
  }, [create]);

  const handleDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (pendingDeleteId !== null) {
      await remove(pendingDeleteId);
      setPendingDeleteId(null);
      setDetailTask(null);
    }
  }, [pendingDeleteId, remove]);

  const renderItem = useCallback(({ item: task }: { item: Task }) => (
    <TaskCard task={task} onPress={setDetailTask} />
  ), [setDetailTask]);

  const keyExtractor = useCallback((task: Task) => String(task.id), []);

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manajer Tugas</Text>
          <Text style={styles.headerSubtitle}>Kelola tugas tim Anda dengan rapi</Text>
        </View>
        <SearchInput value={keyword} onChange={setKeyword} />
        <StatusFilter value={status} onChange={setStatus} />
      </>
    ),
    [keyword, status, setKeyword, setStatus],
  );

  const listFooter = useMemo(
    () => <ListFooter loading={loadingMore} hasMore={hasMore} hasItems={tasks.length > 0} />,
    [loadingMore, hasMore, tasks.length],
  );

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
        <Text style={styles.loadingText}>Memuat tugas...</Text>
      </View>
    );
  }

  if (detailTask) {
    return (
      <>
        <TaskDetail task={detailTask} onBack={() => setDetailTask(null)} onEdit={handleEdit} onDelete={handleDelete} />
        <EditModal
          visible={modalVisible}
          task={editing}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
        />
        <ConfirmDialog
          visible={pendingDeleteId !== null}
          title="Hapus Tugas"
          message="Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan."
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Belum ada tugas</Text>
            <Text style={styles.emptySubtitle}>Tambahkan tugas baru untuk memulai</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
            progressBackgroundColor="#FFFFFF"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)} testID="create-task-button" activeOpacity={0.8}>
        <Text style={styles.fabText}>Tambah</Text>
      </TouchableOpacity>
      <EditModal
        visible={modalVisible}
        task={editing}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
      <CreateModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSave={handleCreate}
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
  header: { backgroundColor: '#FFFFFF', marginHorizontal: -16, paddingHorizontal: 36, paddingTop: 52, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#0F172A', letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 15, color: '#64748B', marginTop: 6, lineHeight: 22 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 999, elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  loadingText: { color: '#64748B', fontSize: 15, marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B' },
});
