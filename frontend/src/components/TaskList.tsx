import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types/task';

interface Props {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  done: '#10B981',
};

export const TaskCard: React.FC<{ task: Task; onEdit: (t: Task) => void; onDelete: (id: number) => void }> = ({ task, onEdit, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
      <View style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] || '#64748B' }]}>
        <Text style={styles.badgeText}>{task.status.replace('_', ' ')}</Text>
      </View>
    </View>
    {task.description ? <Text style={styles.description} numberOfLines={2}>{task.description}</Text> : null}
    <View style={styles.cardFooter}>
      <Text style={styles.assignee}>{task.assignee || 'Unassigned'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(task)} activeOpacity={0.7}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(task.id)} activeOpacity={0.7}>
          <Text style={styles.deleteText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export const TaskList: React.FC<Props> = ({ tasks, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Memuat tugas...</Text>
      </View>
    );
  }
  if (tasks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Belum ada tugas</Text>
        <Text style={styles.emptySubtitle}>Tambahkan tugas baru untuk memulai</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  center: { paddingVertical: 48, alignItems: 'center' },
  loadingText: { color: '#64748B', fontSize: 15 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A', lineHeight: 22 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  assignee: { fontSize: 12, color: '#94A3B8' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  editText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});