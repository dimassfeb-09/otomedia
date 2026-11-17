import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskCard } from '../components/TaskList';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ListFooter } from '../components/ListFooter';

export const TaskScreen: React.FC = () => {
  const {
    tasks, loading, loadingMore, refreshing, hasMore, keyword, status,
    setKeyword, setStatus, update, remove, loadMore, refresh,
  } = useTasks();

  const [editing, setEditing] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleEdit = useCallback((task: Task) => {
    setEditing(task);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async (id: number, data: Partial<Task>) => {
    await update(id, data);
  }, [update]);

  const handleDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (pendingDeleteId !== null) {
      await remove(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, remove]);

  const renderItem = useCallback(({ item }: { item: Task }) => (
    <TaskCard task={item} onEdit={handleEdit} onDelete={handleDelete} />
  ), [handleEdit, handleDelete]);

  const keyExtractor = useCallback((item: Task) => String(item.id), []);

  // Stable header element: it must not be rebuilt while loadingMore toggles,
  // otherwise the search field and filter chips re-render on every page load.
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  loadingText: { color: '#64748B', fontSize: 15, marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B' },
});
