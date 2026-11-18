import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types/task';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/status';

interface Props {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export const TaskCard: React.FC<{ task: Task; onPress?: (t: Task) => void; onEdit?: (t: Task) => void; onDelete?: (id: number) => void }> = React.memo(({ task, onPress, onEdit, onDelete }) => (
  <TouchableOpacity style={styles.card} onPress={() => (onPress ? onPress(task) : onEdit?.(task))} activeOpacity={0.7} testID={`task-card-${task.id}`}>
    <View style={styles.cardHeader}>
      <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
      <View style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] || '#64748B' }]}>
        <Text style={styles.badgeText}>{STATUS_LABELS[task.status] || task.status}</Text>
      </View>
    </View>
    {task.description ? <Text style={styles.description} numberOfLines={2}>{task.description}</Text> : null}
    <View style={styles.cardFooter}>
      <Text style={styles.assignee}>{task.assignee || 'Belum ditugaskan'}</Text>
      {(onEdit || onDelete) ? (
        <View style={styles.actions}>
          {onEdit ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(task)} activeOpacity={0.7}>
              <Text style={styles.editText}>Ubah</Text>
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(task.id)} activeOpacity={0.7}>
              <Text style={styles.deleteText}>Hapus</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  </TouchableOpacity>
));

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
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 96 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A', lineHeight: 22 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  assignee: { fontSize: 12, color: '#94A3B8' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  editText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});